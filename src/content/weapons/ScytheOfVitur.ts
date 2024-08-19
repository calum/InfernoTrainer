import ScytheInventImage from "../../assets/images/weapons/scytheOfVitur.png";
import { MeleeWeapon } from "../../sdk/weapons/MeleeWeapon";
import { ItemName } from "../../sdk/ItemName";
import { AttackStyle, AttackStyleTypes } from "../../sdk/AttackStylesController";
import { Assets } from "../../sdk/utils/Assets";
import { PlayerAnimationIndices } from "../../sdk/rendering/GLTFAnimationConstants";
import { Sound } from "../../sdk/utils/SoundCache";

import ScytheAttackSound from "../../assets/sounds/scythe_swing_2524.ogg";
import { AttackBonuses } from "../../sdk/gear/Weapon";
import { Unit } from "../../sdk/Unit";
import { Collision } from "../../sdk/Collision";

const EXTRA_HIT_LOCATIONS = [
  [
    [-1, -1],
    [1, -1],
  ], // North
  [
    [1, 1],
    [1, -1],
  ], // East
  [
    [-1, 1],
    [1, 1],
  ], // South
  [
    [-1, 1],
    [-1, -1],
  ], // West
];

export class ScytheOfVitur extends MeleeWeapon {
  constructor() {
    super();

    this.bonuses = {
      attack: {
        stab: 70,
        slash: 125,
        crush: 30,
        magic: -6,
        range: 0,
      },
      defence: {
        stab: -2,
        slash: 8,
        crush: 10,
        magic: 0,
        range: 0,
      },
      other: {
        meleeStrength: 75,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    };

    this.itemName = ItemName.SCYTHE_OF_VITUR;
    this.isTwoHander = true;
    this.attackRange = 1;
    this.attackSpeed = 5;
    this.inventoryImage = ScytheInventImage;
    this.model = Assets.getAssetUrl("models/player_sanguine_scythe_of_vitur.glb");
    this.attackAnimationId = PlayerAnimationIndices.ScytheSwing;
    this.idleAnimationId = PlayerAnimationIndices.ScytheIdle;
    this.attackSound = new Sound(ScytheAttackSound, 0.1);
  }

  attackStyles() {
    return [AttackStyle.REAP, AttackStyle.AGGRESSIVESLASH, AttackStyle.AGGRESSIVECRUSH, AttackStyle.DEFENSIVE];
  }

  attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.SCYTHE;
  }

  defaultStyle(): AttackStyle {
    return AttackStyle.AGGRESSIVESLASH;
  }

  override attack(from: Unit, to: Unit, bonuses: AttackBonuses) {
    const region = from.region;
    const targetTile = to.getClosestTileTo(from.location.x, from.location.y);

    const dx = from.location.x - targetTile[0];
    const dy = from.location.y - targetTile[1];
    let direction;
    if (dx < 0) {
      direction = 1; // East
    } else if (dx > 0) {
      direction = 3; // West
    } else if (dy < 0) {
      direction = 2; // South
    } else {
      direction = 0; // North
    }

    let multiplier = 1.0;
    super.attack(from, to, bonuses);
    EXTRA_HIT_LOCATIONS[direction].forEach((hit) => {
      const xx = from.location.x + hit[0];
      const yy = from.location.y + hit[1];
      const collision = Collision.collidesWithAnyMobs(region, xx, yy, from.size);
      multiplier *= 0.5;
      const extraHitBonuses: AttackBonuses = {
        ...bonuses,
        overallMultiplier: multiplier,
      };
      if (collision) {
        super.attack(from, collision, extraHitBonuses);
      } else {
        super.attack(from, to, extraHitBonuses);
      }
    });
    return true;
  }
}
