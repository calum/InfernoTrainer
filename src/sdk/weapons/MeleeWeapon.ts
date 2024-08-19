import { AttackStylesController } from "../AttackStylesController";
import { PrayerGroups } from "../BasePrayer";
import { EquipmentTypes } from "../Equipment";
import { Weapon, AttackBonuses } from "../gear/Weapon";
import { Unit, UnitTypes } from "../Unit";
import { ProjectileOptions } from "./Projectile";

export class MeleeWeapon extends Weapon {
  constructor(projectileOptions: ProjectileOptions = {}) {
    super({
      hidden: true,
      ...projectileOptions,
    });

    // Set isMeleeAttack to true for all melee weapons
    this.isMeleeAttack = true;
  }

  get type() {
    return EquipmentTypes.WEAPON;
  }

  attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}): boolean {
    bonuses.attackStyle = bonuses.attackStyle || "slash";
    return super.attack(from, to, bonuses);
  }

  _calculatePrayerEffects(from: Unit, to: Unit, bonuses: AttackBonuses) {
    bonuses.effectivePrayers = {};

    if (from.type !== UnitTypes.MOB && from.prayerController) {
      bonuses.effectivePrayers.attack = from.prayerController.matchGroup(PrayerGroups.ACCURACY);
      bonuses.effectivePrayers.strength = from.prayerController.matchGroup(PrayerGroups.STRENGTH);
    }

    if (to.type !== UnitTypes.MOB && to.prayerController) {
      bonuses.effectivePrayers.defence = to.prayerController.matchGroup(PrayerGroups.DEFENCE);
      bonuses.effectivePrayers.overhead = to.prayerController.overhead();
    }
  }

  isBlockable(from: Unit, to: Unit, bonuses: AttackBonuses): boolean {
    this._calculatePrayerEffects(from, to, bonuses);

    let prayerAttackBlockStyle = bonuses.attackStyle;
    if (Weapon.isMeleeAttackStyle(prayerAttackBlockStyle)) {
      prayerAttackBlockStyle = "melee"; // Generalize melee attack styles for protection prayers
    }

    return (
      bonuses.effectivePrayers.overhead &&
      bonuses.effectivePrayers.overhead.feature() === prayerAttackBlockStyle
    );
  }

  _strengthLevel(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    let prayerMultiplier = 1;
    const strengthPrayer = bonuses.effectivePrayers.strength;

    if (strengthPrayer) {
      switch (strengthPrayer.name) {
        case "Burst of Strength":
          prayerMultiplier = 1.05;
          break;
        case "Superhuman Strength":
          prayerMultiplier = 1.1;
          break;
        case "Ultimate Strength":
          prayerMultiplier = 1.15;
          break;
        case "Chivalry":
          prayerMultiplier = 1.18;
          break;
        case "Piety":
          prayerMultiplier = 1.23;
          break;
      }
    }

    bonuses.styleStrengthBonus =
      from.type === UnitTypes.PLAYER
        ? AttackStylesController.controller.getWeaponStrengthBonus(this.attackStyle())
        : 0;

    return Math.floor(
      (Math.floor(from.currentStats.strength * prayerMultiplier) + bonuses.styleStrengthBonus + 8) *
        bonuses.voidMultiplier,
    );
  }

  _maxHit(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return Math.floor(
      Math.floor((this._strengthLevel(from, to, bonuses) * (from.bonuses.other.meleeStrength + 64) + 320) / 640) *
        bonuses.gearMeleeMultiplier *
        bonuses.overallMultiplier,
    );
  }

  _attackLevel(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    let prayerMultiplier = 1;
    const attackPrayer = bonuses.effectivePrayers.attack;

    if (attackPrayer) {
      switch (attackPrayer.name) {
        case "Clarity of Thought":
          prayerMultiplier = 1.05;
          break;
        case "Improved Reflexes":
          prayerMultiplier = 1.1;
          break;
        case "Incredible Reflexes":
        case "Chivalry":
          prayerMultiplier = 1.15;
          break;
        case "Piety":
          prayerMultiplier = 1.2;
          break;
      }
    }

    return Math.floor(
      (Math.floor(from.currentStats.attack * prayerMultiplier) + bonuses.styleBonus + 8) *
        bonuses.voidMultiplier,
    );
  }

  _attackRoll(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return Math.floor(
      this._attackLevel(from, to, bonuses) *
        (from.bonuses.attack[bonuses.attackStyle] + 64) *
        bonuses.gearMeleeMultiplier,
    );
  }

  _defenceRoll(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    if (to.type === UnitTypes.MOB || to.type === UnitTypes.ENTITY) {
      return (to.currentStats.defence + 9) * (to.bonuses.defence[bonuses.attackStyle] + 64);
    } else {
      return this._defenceLevel(from, to, bonuses) * (to.bonuses.defence[bonuses.attackStyle] + 64);
    }
  }

  _defenceLevel(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    let prayerMultiplier = 1;
    const defencePrayer = bonuses.effectivePrayers.defence;

    if (defencePrayer) {
      switch (defencePrayer.name) {
        case "Thick Skin":
        case "Mystic Will":
          prayerMultiplier = 1.05;
          break;
        case "Rock Skin":
        case "Mystic Lore":
          prayerMultiplier = 1.1;
          break;
        case "Steel Skin":
        case "Mystic Might":
          prayerMultiplier = 1.15;
          break;
        case "Chivalry":
          prayerMultiplier = 1.2;
          break;
        case "Piety":
        case "Rigour":
        case "Augury":
          prayerMultiplier = 1.25;
          break;
      }
    }

    return Math.floor(from.currentStats.defence * prayerMultiplier) + bonuses.styleBonus + 8;
  }
}
