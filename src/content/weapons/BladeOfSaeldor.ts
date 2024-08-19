import BladeOfSaeldorImage from "../../assets/images/weapons/Blade_of_saeldor.png";
import { MeleeWeapon } from "../../sdk/weapons/MeleeWeapon";
import { ItemName } from "../../sdk/ItemName";
import { AttackStyle, AttackStyleTypes } from "../../sdk/AttackStylesController";
import { Assets } from "../../sdk/utils/Assets";
import { PlayerAnimationIndices } from "../../sdk/rendering/GLTFAnimationConstants";
import { Sound } from "../../sdk/utils/SoundCache";

import ScytheAttackSound from "../../assets/sounds/scythe_swing_2524.ogg";

export class BladeOfSaeldor extends MeleeWeapon {
  private Model: string;

  constructor() {
    super();

    // Set bonuses
    this.bonuses = {
      attack: {
        stab: 55,
        slash: 94,
        crush: 0,
        magic: 0,
        range: 0,
      },
      defence: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 0,
      },
      other: {
        meleeStrength: 89,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    };

    // Set properties using setters
    this.itemName = ItemName.BLADE_OF_SAELDOR;
    this.isTwoHander = false;
    this.attackRange = 1;
    this.attackSpeed = 4;
    this.inventoryImage = BladeOfSaeldorImage;
    this.Model = Assets.getAssetUrl("models/player_blade_of_saeldor.glb");
    this.model = this.Model;
    this.attackAnimationId = PlayerAnimationIndices.SwordSlash;
    this.idleAnimationId = PlayerAnimationIndices.Idle;
    this.attackSound = new Sound(ScytheAttackSound, 0.1);
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

  hasSpecialAttack(): boolean {
    return false;
  }
}
