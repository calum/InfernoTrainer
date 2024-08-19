import { Assets, AttackStyle, AttackStyleTypes, MeleeWeapon, ItemName } from "../sdk";
import { PlayerAnimationIndices } from "../sdk/rendering";

export class ItemFactory {
  static createItem(equipmentData: any) {
    switch (equipmentData.slot) {
      case "weapon":
        return WeaponFactory.createWeapon(equipmentData);
      default:
        return null; 
    }
  }
}

export class WeaponFactory {
  static createWeapon(equipmentData: any): MeleeWeapon | null {
    if (equipmentData.category !== "Stab Sword") {
      return null;
    }

    const bonuses = {
      attack: equipmentData.offensive,
      defence: equipmentData.defensive,
      other: {
        meleeStrength: equipmentData.bonuses.str,
        rangedStrength: equipmentData.bonuses.ranged_str,
        magicDamage: equipmentData.bonuses.magic_str,
        prayer: equipmentData.bonuses.prayer,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    };

    const inventoryImageUrl = Assets.getAssetUrl(`icons/${encodeURIComponent(equipmentData.image)}`, true);
    const modelUrl = Assets.getAssetUrl(
      `models/player_${equipmentData.name.toLowerCase().replace(/ /g, "_")}.glb`,
      true
    );

    // Create a new MeleeWeapon instance and set its properties using the setters
    const weapon = new MeleeWeapon();

    weapon.attackStyles = () => [
      AttackStyle.ACCURATE,
      AttackStyle.AGGRESSIVESLASH,
      AttackStyle.STAB,
      AttackStyle.DEFENSIVE,
    ];
    weapon.attackStyleCategory = () => AttackStyleTypes.SLASHSWORD;
    weapon.defaultStyle = () => AttackStyle.AGGRESSIVESLASH;
    weapon.itemName = equipmentData.name as ItemName;
    weapon.isTwoHander = false;
    weapon.hasSpecialAttack = () => false;
    weapon.attackRange = 1;
    weapon.attackSpeed = 4;
    weapon.inventoryImage = inventoryImageUrl;
    weapon.model = modelUrl;
    weapon.attackAnimationId = PlayerAnimationIndices.SwordSlash;
    weapon.bonuses = bonuses;

    return weapon;
  }
}
