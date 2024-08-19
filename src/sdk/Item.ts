import { Location } from "./Location";
import { ItemName } from "./ItemName";
import { Player } from "./Player";

export class Item {
  groundLocation: Location | null = null;
  inventorySprite: HTMLImageElement | null = null;
  selected: boolean = false;
  defaultAction: string = "Use";
  private _serialNumber: string = "";
  private _itemName: ItemName | null = null;
  private _inventoryImage: string = "";

  // Getter for serialNumber with lazy initialization
  get serialNumber(): string {
    if (!this._serialNumber) {
      this._serialNumber = String(Math.random());
    }
    return this._serialNumber;
  }

  // Getter for itemName
  get itemName(): ItemName | null {
    return this._itemName;
  }

  // Setter for itemName
  set itemName(value: ItemName | null) {
    this._itemName = value;
  }

  // Getter for inventoryImage
  get inventoryImage(): string {
    return this._inventoryImage;
  }

  // Setter for inventoryImage
  set inventoryImage(value: string) {
    this._inventoryImage = value;
  }

  // Getter for weight with a default value of 0
  get weight(): number {
    return 0;
  }

  // Method to determine if the item has a left-click action in the inventory
  get hasInventoryLeftClick(): boolean {
    return false;
  }

  // Method to handle inventory left-click action
  inventoryLeftClick(player: Player) {
    // Override me in subclasses
  }

  // Method to get the position of the item in the player's inventory
  inventoryPosition(player: Player): number {
    return player.inventory
      .map((item: Item | null) => item ? item.serialNumber : null)
      .indexOf(this.serialNumber);
  }

  // Method to consume the item (remove from inventory)
  consumeItem(player: Player) {
    const position = this.inventoryPosition(player);
    if (position >= 0) {
      player.inventory[position] = null;
    }
  }

  // Method to generate context actions for the item
  contextActions(player: Player) {
    const options = [
      {
        text: [
          { text: "Drop ", fillStyle: "white" },
          { text: this.itemName || "", fillStyle: "#FF911F" },
        ],
        action: () => {
          if (this.groundLocation) {
            player.region.addGroundItem(player, this, this.groundLocation.x, this.groundLocation.y);
          }
          this.consumeItem(player);
        },
      },
      {
        text: [
          { text: "Examine ", fillStyle: "white" },
          { text: this.itemName || "", fillStyle: "#FF911F" },
        ],
        action: () => {
          // TODO: Implement the Examine feature
        },
      },
    ];

    if (this.defaultAction) {
      options.unshift({
        text: [
          { text: `${this.defaultAction} `, fillStyle: "white" },
          { text: this.itemName || "", fillStyle: "#FF911F" },
        ],
        action: () => {
          this.inventoryLeftClick(player);
        },
      });
    }

    return options;
  }
}
