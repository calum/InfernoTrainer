import { Necklace } from "../../sdk/gear/Necklace";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Amulet_of_torture.png";
import { ItemName } from "../../sdk/ItemName";
import { Assets } from "../../sdk/utils/Assets";

export class AmuletOfTorture extends Necklace {
  private Model: string;

  constructor() {
    super();

    // Set bonuses
    this.bonuses = {
      attack: {
        stab: 15,
        slash: 15,
        crush: 15,
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
        meleeStrength: 10,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 2,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    };

    // Set properties using setters
    this.itemName = ItemName.AMULET_OF_TORTURE;
    this.inventoryImage = InventImage;
    this.inventorySprite = ImageLoader.createImage(this.inventoryImage);
    this.Model = Assets.getAssetUrl("models/player_amulet_of_torture__or_.glb");
    this.model = this.Model;
  }
}
