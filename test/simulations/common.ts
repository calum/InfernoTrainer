import { Random } from "../../src/sdk/Random";
import { Settings } from "../../src/sdk/Settings";

export default () => {
  jest.mock("../../src/sdk/XpDropController", () => {
    return {
      XpDropController: {
        controller: {
          tick: () => true,
          registerXpDrop: () => true,
        },
      },
    };
  });

  jest.mock("../../src/sdk/MapController", () => {
    return {
      MapController: {
        controller: {
          updateOrbsMask: () => true,
        },
      },
    };
  });

  jest.mock("../../src/sdk/ControlPanelController", () => {
    return {
      ControlPanelController: {
        controller: {},
      },
    };
  });

  jest
    .spyOn(document, "getElementById")
    .mockImplementation((elementId: string) => {
      const c = document.createElement("canvas");
      c.ariaLabel = elementId;
      return c;
    });

  Random.setRandom(() => {
    Random.memory = (Random.memory + 13.37) % 180;
    return Math.abs(Math.sin(Random.memory * 0.0174533));
  });

  Settings.readFromStorage();
};
