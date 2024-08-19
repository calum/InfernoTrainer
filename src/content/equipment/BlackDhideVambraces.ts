import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Black_d'hide_vambraces.png";
import { Gloves } from "../../sdk/gear/Gloves";
import { ItemName } from "../../sdk/ItemName";
import { Assets } from "../../sdk/utils/Assets";

export class BlackDhideVambraces extends Gloves {
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
        range: 11,
      },
      defence: {
        stab: 6,
        slash: 5,
        crush: 7,
        magic: 8,
        range: 0,
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
    this.itemName = ItemName.BLACK_D_HIDE_VAMBRACES;
    this.inventoryImage = InventImage;
    this.inventorySprite = ImageLoader.createImage(this.inventoryImage);
    this.Model = Assets.getAssetUrl("models/player_black_d_hide_vambraces.glb", true);
    this.model = this.Model;
  }
}
