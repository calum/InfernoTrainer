import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Black_d'hide_chaps.png";
import { Legs } from "../../sdk/gear/Legs";
import { ItemName } from "../../sdk/ItemName";
import { Assets } from "../../sdk/utils/Assets";

export class BlackDhideChaps extends Legs {
  private Model: string;

  constructor() {
    super();

    // Set bonuses
    this.bonuses = {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: -10,
        range: 17,
      },
      defence: {
        stab: 31,
        slash: 25,
        crush: 33,
        magic: 28,
        range: 31,
      },
      other: {
        meleeStrength: 0,
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
    this.itemName = ItemName.BLACK_D_HIDE_CHAPS;
    this.inventoryImage = InventImage;
    this.inventorySprite = ImageLoader.createImage(this.inventoryImage);
    this.Model = Assets.getAssetUrl("models/player_black_d_hide_chaps.glb", true);
    this.model = this.Model;
  }
}
