"use strict";
import { Player } from "./Player";
import { World } from "./World";
import { Viewport, ViewportDelegate } from "./Viewport";
import { Region } from "./Region";
import { Settings } from "./Settings";
import { Renderable } from "./Renderable";
import { Unit } from "./Unit";

export class Viewport2d implements ViewportDelegate {
  initialise(world: World, region: Region) {
    // do nothing, but maybe we should buffer the world background
  }

  draw(world: World, region: Region) {
    region.context.save();
    region.drawWorldBackground(region.context, Settings.tileSize);
    region.drawGroundItems(region.context);

    // Draw all things on the map
    const renderables: Renderable[] = [...region.entities];
    const units: Unit[] = [];

    if (world.getReadyTimer <= 0) {
      units.push(...region.mobs);
      units.push(...region.newMobs);
    }
    units.push(...region.players);
    renderables.concat(units).forEach((r) => {
      const location = r.getPerceivedLocation(world.tickPercent);
      r.draw(world.tickPercent, region.context, location, Settings.tileSize);
    });

    region.entities.forEach((entity) => entity.drawUILayer(world.tickPercent));

    if (world.getReadyTimer === 0) {
      const getOffset = (r: Renderable) => {
        const perceivedLocation = r.getPerceivedLocation(world.tickPercent);
        const perceivedX = perceivedLocation.x;
        const perceivedY = perceivedLocation.y;

        return {
          x: perceivedX * Settings.tileSize + (r.size * Settings.tileSize) / 2,
          y:
            (perceivedY - r.size + 1) * Settings.tileSize +
            (r.size * Settings.tileSize) / 2,
        };
      };
      region.mobs.forEach((mob) =>
        mob.drawUILayer(
          world.tickPercent,
          getOffset(mob),
          mob.region.context,
          Settings.tileSize
        )
      );

      region.players.forEach((player: Player) => {
        player.drawUILayer(
          world.tickPercent,
          getOffset(player),
          player.region.context,
          Settings.tileSize
        );
      });
    
      // ignore the 'height' value
      const translator = ({x, y}) => ({x: x * Settings.tileSize, y: y * Settings.tileSize});
      units.forEach((unit) => {
        if (unit.dying === -1) {
          unit.drawIncomingProjectiles(unit.region.context, world.tickPercent, translator);
        }
      });
    }

    region.context.restore();

    const { viewportX, viewportY } = Viewport.viewport.getViewport(
      world.tickPercent
    );
    return {
      canvas: region.canvas,
      uiCanvas: null,
      flip: Settings.rotated === "south",
      offsetX: -viewportX * Settings.tileSize,
      offsetY: -viewportY * Settings.tileSize,
    };
  }

  translateClick(offsetX, offsetY, world, viewport) {
    const { viewportX, viewportY } = viewport.getViewport(world.tickPercent);
    let x: number = offsetX + viewportX * Settings.tileSize;
    let y: number = offsetY + viewportY * Settings.tileSize;

    if (Settings.rotated === "south") {
      x =
        viewport.width * Settings.tileSize -
        offsetX +
        viewportX * Settings.tileSize;
      y =
        viewport.height * Settings.tileSize -
        offsetY +
        viewportY * Settings.tileSize;
    }
    return {
      type: "coordinate" as const,
      location: {
        x: x / Settings.tileSize,
        y: y / Settings.tileSize,
      },
    };
  }
}
