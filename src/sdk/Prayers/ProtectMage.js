'use strict';

import BasePrayer from "./BasePrayer";
import OverheadImg from "../../assets/images/prayers/mageOver.png"
import OnSound from "../../assets/sounds/mageOn.ogg"
import OffSound from "../../assets/sounds/mageOff.ogg"
import Constants from "../Constants";

export default class ProtectMage extends BasePrayer{
  
  get name() {
    return 'Protect from Magic';
  }

  get groups(){
    return ['protection'];
  }
  
  isOverhead() {
    return true;
  }
  
  overheadImageReference(){
    return OverheadImg;
  }
  
  feature () {
    return 'mage';
  }

  playOnSound(){
    if (Constants.playsAudio){
      new Audio(OnSound).play();
    }
  }
  
  playOffSound() {
    if (Constants.playsAudio){
      new Audio(OffSound).play();
    }
  }
}
