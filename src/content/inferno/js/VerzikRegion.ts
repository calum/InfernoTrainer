"use strict";
import { Region, CardinalDirection, Settings, Mob, Player, BrowserUtils, InvisibleMovementBlocker, ImageLoader, Location, TileMarker, ControlPanelController, Trainer, EntityNames } from "@supalosa/oldschool-trainer-sdk";

import InfernoMapImage from "../assets/images/map.png";

import { JalImKot } from "./mobs/JalImKot";
import { InfernoScene } from "./InfernoScene";

import SidebarContent from "../sidebar.html";
import { filter } from "lodash";
import { VerzikLoadout } from "./VerzikLoadout";

/* eslint-disable @typescript-eslint/no-explicit-any */

export class VerzikRegion extends Region {
  mapImage: HTMLImageElement = ImageLoader.createImage(InfernoMapImage);

  get initialFacing() {
    return CardinalDirection.NORTH;
  }

  getName() {
    return "VerzikP3";
  }

  get width(): number {
    return 51;
  }

  get height(): number {
    return 57;
  }

  rightClickActions(): any[] {
    return [];
  }

  initializeAndGetLoadoutType() {
    const loadoutSelector = document.getElementById("loadouts") as HTMLInputElement;
    loadoutSelector.value = Settings.loadout;
    loadoutSelector.addEventListener("change", () => {
      Settings.loadout = loadoutSelector.value;
      Settings.persistToStorage();
    });

    return loadoutSelector.value;
  }

  initializeAndGetOnTask() {
    const onTaskCheckbox = document.getElementById("onTask") as HTMLInputElement;
    onTaskCheckbox.checked = Settings.onTask;
    onTaskCheckbox.addEventListener("change", () => {
      Settings.onTask = onTaskCheckbox.checked;
      Settings.persistToStorage();
    });
    return onTaskCheckbox.checked;
  }

  initializeAndGetSouthPillar() {
    const southPillarCheckbox = document.getElementById("southPillar") as HTMLInputElement;
    southPillarCheckbox.checked = Settings.southPillar;
    southPillarCheckbox.addEventListener("change", () => {
      Settings.southPillar = southPillarCheckbox.checked;
      Settings.persistToStorage();
    });
    return southPillarCheckbox.checked;
  }

  initializeAndGetWestPillar() {
    const westPillarCheckbox = document.getElementById("westPillar") as HTMLInputElement;
    westPillarCheckbox.checked = Settings.westPillar;
    westPillarCheckbox.addEventListener("change", () => {
      Settings.westPillar = westPillarCheckbox.checked;
      Settings.persistToStorage();
    });
    return westPillarCheckbox.checked;
  }

  initializeAndGetNorthPillar() {
    const northPillarCheckbox = document.getElementById("northPillar") as HTMLInputElement;
    northPillarCheckbox.checked = Settings.northPillar;
    northPillarCheckbox.addEventListener("change", () => {
      Settings.northPillar = northPillarCheckbox.checked;
      Settings.persistToStorage();
    });
    return northPillarCheckbox.checked;
  }

  initializeAndGetUse3dView() {
    const use3dViewCheckbox = document.getElementById("use3dView") as HTMLInputElement;
    use3dViewCheckbox.checked = Settings.use3dView;
    use3dViewCheckbox.addEventListener("change", () => {
      Settings.use3dView = use3dViewCheckbox.checked;
      Settings.persistToStorage();
      window.location.reload();
    });
    return use3dViewCheckbox.checked;
  }

  initialiseRegion() {
    // create player
    const player = new Player(this, {
      x: parseInt(BrowserUtils.getQueryVar("x")) || 25,
      y: parseInt(BrowserUtils.getQueryVar("y")) || 30,
    });

    this.addPlayer(player);

    this.addMob(new JalImKot(this, { x: 25, y: 25 }, { aggro: player}));

    const loadoutType = this.initializeAndGetLoadoutType();
    const onTask = this.initializeAndGetOnTask();

    this.initializeAndGetUse3dView();

    const loadout = new VerzikLoadout(loadoutType, onTask);
    loadout.setStats(player); // flip this around one day
    player.setUnitOptions(loadout.getLoadout());

    document
      .getElementById("pauseResumeLink")
      .addEventListener("click", () => (this.world.isPaused ? this.world.startTicking() : this.world.stopTicking()));

    // Add 3d scene
    if (Settings.use3dView) {
      this.addEntity(new InfernoScene(this, { x: 0, y: 48 }));
    }

    return { player };
  }

  drawWorldBackground(context: OffscreenCanvasRenderingContext2D, scale: number) {
    context.fillStyle = "black";
    context.fillRect(0, 0, 10000000, 10000000);
    if (this.mapImage) {
      const ctx = context as any;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      context.imageSmoothingEnabled = false;

      context.fillStyle = "white";

      context.drawImage(this.mapImage, 0, 0, this.width * scale, this.height * scale);

      ctx.webkitImageSmoothingEnabled = true;
      ctx.mozImageSmoothingEnabled = true;
      context.imageSmoothingEnabled = true;
    }
  }

  drawDefaultFloor() {
    // replaced by an Entity in 3d view
    return !Settings.use3dView;
  }

  getSidebarContent() {
    return SidebarContent;
  }
}
