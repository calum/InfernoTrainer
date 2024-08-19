import { AmuletOfTorture, AvernicDefender, SuperCombatPotion, UnitOptions } from "@supalosa/oldschool-trainer-sdk";
import { DragonSword, BladeOfSaeldor, Player } from "@supalosa/oldschool-trainer-sdk";
import { BlackDhideBody, BlackDhideChaps, BlackDhideVambraces } from "@supalosa/oldschool-trainer-sdk";

export class ColosseumLoadout {
  loadoutType: string;

  constructor(loadoutType: string) {
    this.loadoutType = loadoutType;
  }

  async loadoutMaxMelee() {
    //const dragonSword = getItemByName('Dragon sword');
    return {
      equipment: {
        weapon: new DragonSword(),
        offhand: null,
        helmet: null,
        necklace: new AmuletOfTorture(),
        cape: null,
        ammo: null,
        chest: null,
        legs: null,
        feet: null,
        gloves: null,
        ring: null,
      },
      inventory: [
        new BladeOfSaeldor(),
        new AvernicDefender(),
        null,
        null,
        null,
        null,
        new SuperCombatPotion(),
        new SuperCombatPotion(),
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        new BlackDhideBody(),
        new BlackDhideChaps(),
        new BlackDhideVambraces(),
      ],
    };
  }

  setStats(player: Player) {
    player.stats.prayer = 99;
    player.currentStats.prayer = 99;
    player.stats.defence = 99;
    player.currentStats.defence = 99;
  }

  async getLoadout(): Promise<UnitOptions> {
    let loadout: UnitOptions;
    switch (this.loadoutType) {
      case "max_melee":
        loadout = await this.loadoutMaxMelee();
        break;
    }
    return loadout;
  }
}
