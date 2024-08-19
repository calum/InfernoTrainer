"use strict";

import { BasePrayer } from "../BasePrayer";
import { Unit, UnitTypes } from "../Unit";
import { ImageLoader } from "../utils/ImageLoader";
import { Equipment } from "../Equipment";
import { Player } from "../Player";
import { Projectile, ProjectileOptions } from "../weapons/Projectile";
import { find } from "lodash";
import { SetEffect, SetEffectTypes } from "../SetEffect";
import { ItemName } from "../ItemName";
import { AttackStylesController, AttackStyle, AttackStyleTypes } from "../AttackStylesController";
import { Random } from "../Random";
import { Sound } from "../utils/SoundCache";
import { PlayerAnimationIndices } from "../rendering/GLTFAnimationConstants";
import { XpDrop } from "../XpDrop";

interface EffectivePrayers {
  magic?: BasePrayer;
  range?: BasePrayer;
  attack?: BasePrayer;
  strength?: BasePrayer;
  defence?: BasePrayer;
  overhead?: BasePrayer;
}

export interface AttackBonuses {
  styleBonus?: number;
  isAccurate?: boolean;
  styleStrengthBonus?: number;
  voidMultiplier?: number;
  gearMeleeMultiplier?: number;
  gearMageMultiplier?: number;
  gearRangeMultiplier?: number;
  attackStyle?: string;
  magicBaseSpellDamage?: number;
  overallMultiplier?: number;
  effectivePrayers?: EffectivePrayers;
  isSpecialAttack?: boolean;
}

export class Weapon extends Equipment {
  private _image: HTMLImageElement | null = null;
  private _attackRange: number = 0;
  private _attackSpeed: number = 10;
  private _aoe: { x: number, y: number }[] = [{ x: 0, y: 0 }];
  private _isAreaAttack: boolean = false;
  private _isMeleeAttack: boolean = false;
  private _isTwoHander: boolean = false;
  private _attackSound: Sound | null = null;
  private _specialAttackSound: Sound | null = null;
  private _attackLandingSound: Sound | null = null;
  private _projectileModel: string | null = null;
  private _idleAnimationId: number = PlayerAnimationIndices.Idle;

  damage: number = 0;
  damageRoll: number = 0;
  lastHitHit: boolean = false;
  override selected: boolean = false;
  override inventorySprite: HTMLImageElement = ImageLoader.createImage(this.inventoryImage);

  constructor(protected projectileOptions: ProjectileOptions = {}) {
    super();
  }

  attackStyles(): AttackStyle[] {
    return [];
  }

  compatibleAmmo(): ItemName[] {
    return [];
  }

  attackStyleCategory(): AttackStyleTypes | null {
    return null;
  }

  defaultStyle(): AttackStyle {
    return AttackStyle.RAPID;
  }

  attackStyle(): AttackStyle {
    return AttackStylesController.controller.getAttackStyleForType(this.attackStyleCategory(), this);
  }

  override assignToPlayer(player: Player): void {
    player.equipment.weapon = this;
    player.interruptCombat();
  }

  override unassignToPlayer(player: Player): void {
    player.equipment.weapon = null;
  }

  override currentEquipment(player: Player): Equipment | null {
    return player.equipment.weapon;
  }

  hasSpecialAttack(): boolean {
    return false;
  }

  specialAttackDrain(): number {
    return 50;
  }

  specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): void {
    // Override me
  }

  override inventoryLeftClick(player: Player): void {
    const currentWeapon = player.equipment.weapon || null;
    const currentOffhand = player.equipment.offhand || null;

    let openInventorySlots = player.openInventorySlots();
    openInventorySlots.unshift(player.inventory.indexOf(this));

    let neededInventorySlots = 0;
    if (this.isTwoHander && currentWeapon) neededInventorySlots++;
    if (this.isTwoHander && currentOffhand) neededInventorySlots++;
    if (currentWeapon) neededInventorySlots--;

    if (neededInventorySlots > openInventorySlots.length) return;

    this.assignToPlayer(player);
    if (currentWeapon) {
      player.inventory[openInventorySlots.shift()] = currentWeapon;
    } else {
      player.inventory[openInventorySlots.shift()] = null;
    }

    if (this.isTwoHander && currentOffhand) {
      player.inventory[openInventorySlots.shift()] = currentOffhand;
      player.equipment.offhand = null;
    }
    player.equipmentChanged();
  }

  cast(from: Unit, to: Unit): void {
    // Override me
  }

  rollDamage(from: Unit, to: Unit, bonuses: AttackBonuses): void {
    this.damageRoll = Math.floor(this._rollAttack(from, to, bonuses));
    this.damage = Math.min(this.damageRoll, to.currentStats.hitpoint);
  }

  calculateHitDelay(distance: number): number {
    return 999;
  }

  attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    this._calculatePrayerEffects(from, to, bonuses);
    bonuses.styleBonus = bonuses.styleBonus || 0;
    bonuses.voidMultiplier = bonuses.voidMultiplier || 1;
    bonuses.gearMeleeMultiplier = bonuses.gearMeleeMultiplier || 1;
    bonuses.gearMageMultiplier = bonuses.gearMageMultiplier || 1;
    bonuses.gearRangeMultiplier = bonuses.gearRangeMultiplier || 1;
    bonuses.overallMultiplier = bonuses.overallMultiplier || 1.0;

    this.rollDamage(from, to, bonuses);

    if (this.damage === -1) return false;

    if (to.setEffects) {
      find(to.setEffects, (effect: typeof SetEffect) => {
        if (effect.effectName() === SetEffectTypes.JUSTICIAR) {
          const tosDefenceBonus = to.bonuses.defence[bonuses.attackStyle];
          if (tosDefenceBonus !== undefined) {
            const justiciarDamageReduction = Math.max(tosDefenceBonus / 3000, 0);
            this.damage -= Math.ceil(justiciarDamageReduction * this.damage);
          }
        }
      });
    }

    if (this.isBlockable(from, to, bonuses)) {
      this.damage = 0;
    }

    this.damage = Math.floor(Math.max(Math.min(to.currentStats.hitpoint, this.damage, 100), 0));

    if (to.equipment.ring && to.equipment.ring.itemName === ItemName.RING_OF_SUFFERING_I && this.damage > 0) {
      from.addProjectile(
        new Projectile(this, Math.floor(this.damage * 0.1) + 1, to, from, "recoil", { reduceDelay: 15, hidden: true }),
      );
    }

    this.grantXp(from, to);
    this.registerProjectile(from, to, bonuses, options);
    return true;
  }

  _rollAttack(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    this.lastHitHit = false;
    return Random.get() > this._hitChance(from, to, bonuses) ? 0 : this._calculateHitDamage(from, to, bonuses);
  }

  _calculateHitDamage(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    this.lastHitHit = true;
    let damage = Math.floor(Random.get() * (this._maxHit(from, to, bonuses) + 1));
    if (Math.random() < 0.1) {
      damage = damage * 2;
    }
    return damage;
  }

  _attackRoll(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return 0; // weapons implement this at the type tier
  }

  _defenceRoll(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return 0; // weapons implement this at the type tier
  }

  _maxHit(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return 0; // weapons implement this at the type tier
  }

  _hitChance(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    let attackRoll = this._attackRoll(from, to, bonuses);
    const defenceRoll = this._defenceRoll(from, to, bonuses);

    attackRoll = attackRoll * 2;

    return attackRoll > defenceRoll
      ? 1 - (defenceRoll + 2) / (2 * attackRoll + 1)
      : attackRoll / (2 * defenceRoll + 1);
  }

  isBlockable(from: Unit, to: Unit, bonuses: AttackBonuses): boolean {
    return false; // weapons implement this at the type tier
  }

  grantXp(from: Unit, to: Unit): void {
    if (from.type === UnitTypes.PLAYER && this.damage > 0) {
      AttackStylesController.controller
        .getWeaponXpDrops(this.attackStyle(), this.damage, to.xpBonusMultiplier)
        .forEach(({ skill, xp }) => {
          from.grantXp(new XpDrop(skill, xp));
        });
    }
  }

  _calculatePrayerEffects(from: Unit, to: Unit, bonuses: AttackBonuses): void {
    // weapons implement this at the type tier
  }

  registerProjectile(from: Unit, to: Unit, bonuses: AttackBonuses, options: ProjectileOptions = {}): void {
    to.addProjectile(
      new Projectile(this, this.damage, from, to, bonuses.attackStyle, {
        sound: this.attackSound,
        hitSound: this.attackLandingSound,
        model: this.projectileModel,
        ...this.projectileOptions,
        ...options,
      }),
    );
  }

  // Getters and Setters
  get image(): HTMLImageElement | null {
    return this._image;
  }

  set image(value: HTMLImageElement | null) {
    this._image = value;
  }

  get attackRange(): number {
    return this._attackRange;
  }

  set attackRange(value: number) {
    this._attackRange = value;
  }

  get attackSpeed(): number {
    return this._attackSpeed;
  }

  set attackSpeed(value: number) {
    this._attackSpeed = value;
  }

  get aoe(): { x: number, y: number }[] {
    return this._aoe;
  }

  set aoe(value: { x: number, y: number }[]) {
    this._aoe = value;
  }

  get isAreaAttack(): boolean {
    return this._isAreaAttack;
  }

  set isAreaAttack(value: boolean) {
    this._isAreaAttack = value;
  }

  get isMeleeAttack(): boolean {
    return this._isMeleeAttack;
  }

  set isMeleeAttack(value: boolean) {
    this._isMeleeAttack = value;
  }

  get isTwoHander(): boolean {
    return this._isTwoHander;
  }

  set isTwoHander(value: boolean) {
    this._isTwoHander = value;
  }

  get attackSound(): Sound | null {
    return this._attackSound;
  }

  set attackSound(value: Sound | null) {
    this._attackSound = value;
  }

  get specialAttackSound(): Sound | null {
    return this._specialAttackSound;
  }

  set specialAttackSound(value: Sound | null) {
    this._specialAttackSound = value;
  }

  get attackLandingSound(): Sound | null {
    return this._attackLandingSound;
  }

  set attackLandingSound(value: Sound | null) {
    this._attackLandingSound = value;
  }

  get projectileModel(): string | null {
    return this._projectileModel;
  }

  set projectileModel(value: string | null) {
    this._projectileModel = value;
  }

  get idleAnimationId(): number {
    return this._idleAnimationId;
  }

  set idleAnimationId(value: number) {
    this._idleAnimationId = value;
  }

  static isMeleeAttackStyle(style: string): boolean {
    return style === "crush" || style === "slash" || style === "stab";
  }
}
