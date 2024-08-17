import DragonSwordImage from "../../assets/images/weapons/Dragon_sword.png";
import { MeleeWeapon } from "../../sdk/weapons/MeleeWeapon";
import { ItemName } from "../../sdk/ItemName";
import { AttackStyle, AttackStyleTypes } from "../../sdk/AttackStylesController";
import { Assets } from "../../sdk/utils/Assets";
import { PlayerAnimationIndices } from "../../sdk/rendering/GLTFAnimationConstants";
import { Sound } from "../../sdk/utils/SoundCache";

import ScytheAttackSound from "../../assets/sounds/scythe_swing_2524.ogg";

export class DragonSword extends MeleeWeapon {
  constructor() {
    super();

    this.bonuses = {
      attack: {
        stab:65,
        slash: 55,
        crush: -2,
        magic: 0,
        range: 0,
      },
      defence: {
        stab: 0,
        slash: 2,
        crush: 1,
        magic: 0,
        range: 0,
      },
      other: {
        meleeStrength: 63,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    };
  }

  attackStyles() {
    return [AttackStyle.ACCURATE, AttackStyle.AGGRESSIVESLASH, AttackStyle.STAB, AttackStyle.DEFENSIVE];
  }

  attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.SLASHSWORD;
  }

  defaultStyle(): AttackStyle {
    return AttackStyle.AGGRESSIVESLASH;
  }

  get itemName(): ItemName {
    return ItemName.DRAGON_SWORD;
  }

  get isTwoHander(): boolean {
    return false;
  }

  hasSpecialAttack(): boolean {
    return false;
  }

  get attackRange() {
    return 1;
  }

  get attackSpeed() {
    return 4;
  }

  get inventoryImage() {
    return DragonSwordImage;
  }

  private Model = Assets.getAssetUrl("models/player_dragon_sword.glb", true);
  override get model() {
    return this.Model;
  }

  override get attackAnimationId() {
    return PlayerAnimationIndices.SwordSlash;
  }

  override get idleAnimationId() {
    return PlayerAnimationIndices.Idle;
  }

  get attackSound() {
    return new Sound(ScytheAttackSound, 0.1);
  }
}
