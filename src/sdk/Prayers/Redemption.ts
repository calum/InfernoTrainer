'use strict'

import { BasePrayer } from './BasePrayer'
import { Settings } from '../Settings'

export class Redemption extends BasePrayer {
  get name () {
    return 'Redemption'
  }

  get groups (): string[] {
    return [] // TODO: Incorrect
  }

  isOverhead () {
    return false
  }

  feature () {
    return ''
  }

  playOnSound () {
    if (Settings.playsAudio) {
      // new Audio(OnSound).play();
    }
  }

  playOffSound () {
    if (Settings.playsAudio) {
      // new Audio(OffSound).play();
    }
  }
}
