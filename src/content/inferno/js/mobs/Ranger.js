'use strict';

import _ from "lodash";
import { Settings } from "../../../../sdk/Settings";
import { MeleeWeapon } from "../../../../sdk/Weapons/MeleeWeapon";
import { Mob } from "../../../../sdk/Mob";
import { RangedWeapon } from "../../../../sdk/Weapons/RangedWeapon";
import RangeImage from "../../assets/images/ranger.png";
import RangerSound from "../../assets/sounds/ranger.ogg";

export class Ranger extends Mob {


  get displayName(){
    return "Jal-Xil";
  }

  get combatLevel() {
    return 370
  }

  get combatLevelColor() {
    return 'red';
  }
  
  setStats () {
    this.frozen = 1;

    this.weapons = {
      slash: new MeleeWeapon(),
      range: new RangedWeapon()
    };

    // non boosted numbers
    this.stats = {
      attack: 140,
      strength: 180,
      defence: 60,
      range: 250,
      magic: 90,
      hitpoint: 125
    };

    // with boosts
    this.currentStats = JSON.parse(JSON.stringify(this.stats))

    this.bonuses = {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 40
      },
      defence: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 0
      },
      other: {
        meleeStrength: 0,
        rangedStrength: 50,
        magicDamage: 0,
        prayer: 0
      }
    }
  }
  
  get cooldown() {
    return 4;
  }

  get attackRange() {
    return 15;
  }

  get size() {
    return 3;
  }

  get image() {
    return RangeImage;
  }

  get sound() {
    return RangerSound;
  }

  get color() {
    return "#AC88B933";
  }


  attackStyle() {
    return 'range';
  }

  canMeleeIfClose() {
    return 'crush';
  }
  
  playAttackSound (){
    if (Settings.playsAudio){
      setTimeout(() => new Audio(this.sound).play(), 1.75 * Settings.tickMs)
    }
  }

  attackAnimation(region, framePercent){
    region.ctx.rotate(Math.sin(-framePercent * Math.PI))
  }
}
