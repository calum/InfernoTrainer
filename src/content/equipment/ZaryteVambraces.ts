import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from '../../assets/images/equipment/Zaryte_vambraces.png';
import { Gloves } from "../../sdk/gear/Gloves";
import { ItemName } from "../../sdk/ItemName";

import ZaryteVambracesModel from "../../assets/models/male_Zaryte_vambraces-v2.glb";

export class ZaryteVambraces extends Gloves {
  inventorySprite: HTMLImageElement = ImageLoader.createImage(
    this.inventoryImage
  );

  get inventoryImage() {
    return InventImage;
  }
  get itemName(): ItemName {
    return ItemName.ZARYTE_VAMBRACES;
  }
  get weight(): number {
    return 1;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: {
        stab: -8,
        slash: -8,
        crush: -8,
        magic: 0,
        range: 18,
      },
      defence: {
        stab: 8,
        slash: 8,
        crush: 8,
        magic: 5,
        range: 8,
      },
      other: {
        meleeStrength: 0,
        rangedStrength: 2,
        magicDamage: 0,
        prayer: 1,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    };
  }

  override get model() {
    return ZaryteVambracesModel;
  }
}