import * as THREE from "three";

import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module";

import { Model } from "./Model";
import { Renderable } from "../Renderable";
import { Location } from "../Location";

const CANVAS_TILE_SIZE = 20;

const OUTLINE_NORMAL = 0xffffff;
const OUTLINE_SELECTED = 0xff0000;

const clock = new THREE.Clock();

/**
 * Render the model using a sprite derived from the 2d representation of the renderable.
 */
export class GLTFModel implements Model {
  static forRenderable(r: Renderable, model: string, scale: number) {
    return new GLTFModel(r, model, scale);
  }

  private outline: THREE.LineSegments;
  private outlineMaterial: THREE.LineBasicMaterial;

  private loadedModel: GLTF | null = null;
  private mixer: THREE.AnimationMixer | null = null;

  private playingAnimationId = -1;
  private playingAnimationPriority = 0;
  private animations: THREE.AnimationAction[] = [];

  constructor(private renderable: Renderable, model: string, scale: number) {
    const { size } = renderable;

    this.outlineMaterial = new THREE.LineBasicMaterial({
      color: OUTLINE_NORMAL,
    });
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(size, 0, 0),
      new THREE.Vector3(size, 0, 0),
      new THREE.Vector3(size, 0, -size),
      new THREE.Vector3(size, 0, -size),
      new THREE.Vector3(0, 0, -size),
      new THREE.Vector3(0, 0, -size),
      new THREE.Vector3(0, 0, 0),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.outline = new THREE.LineSegments(geometry, this.outlineMaterial);

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(model, (gltf: GLTF) => {
      this.loadedModel = gltf;
      // make adjustments
      gltf.scene.scale.set(scale, scale, scale);
      this.mixer = new THREE.AnimationMixer(gltf.scene);
      this.animations = gltf.animations.map((animation) =>
        this.mixer.clipAction(animation)
      );
      const { index, priority } = renderable.getNewAnimation();
      this.playingAnimationId = index;
      this.playingAnimationPriority = priority;
      this.animations[this.playingAnimationId].setLoop(THREE.LoopOnce, 1);
      this.animations[this.playingAnimationId].play();

      this.mixer.addEventListener("finished", (e) => {
        if (e.action === this.animations[this.playingAnimationId]) {
          this.onAnimationFinished();
        }
      });
    });
  }

  onAnimationFinished() {
    const { index, priority } = this.renderable.getNewAnimation();
    this.playingAnimationId = index;
    this.playingAnimationPriority = priority;
    this.animations[this.playingAnimationId].stop();
    const newAnimation = this.animations[this.playingAnimationId];
    newAnimation.reset();
    console.log("RESET");
    newAnimation.setLoop(THREE.LoopOnce, 1);
    newAnimation.play();
  }

  draw(
    scene: THREE.Scene,
    tickPercent: number,
    location: Location,
    rotation: number
  ) {
    if (this.loadedModel && this.loadedModel.scene.parent !== scene) {
      scene.add(this.loadedModel.scene);
    }
    if (this.outline.parent !== scene) {
      scene.add(this.outline);
    }

    this.outlineMaterial.color.setHex(
      this.renderable.selected ? OUTLINE_SELECTED : OUTLINE_NORMAL
    );

    const { x, y } = location;
    this.outline.position.x = x;
    this.outline.position.y = -0.49;
    this.outline.position.z = y;

    if (this.loadedModel && this.mixer) {
      const { index, priority } = this.renderable.getNewAnimation();
      if (
        priority > this.playingAnimationPriority &&
        index !== this.playingAnimationId
      ) {
        this.playingAnimationId = index;
        this.onAnimationFinished();
      }
      this.mixer.update(clock.getDelta());

      const { scene } = this.loadedModel;
      const { size } = this.renderable;
      const adjustedRotation = rotation + Math.PI / 2;
      scene.position.x = x + size / 2;
      scene.position.y = -0.49;
      scene.position.z = y - size / 2;
      scene.setRotationFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        adjustedRotation
      );
    }
  }

  destroy(scene: THREE.Scene) {
    if (this.loadedModel && this.loadedModel.scene.parent === scene) {
      scene.remove(this.loadedModel.scene);
    }
    if (this.outline.parent === scene) {
      scene.remove(this.outline);
    }
  }

  getWorldPosition(): THREE.Vector3 {
    return this.outline.getWorldPosition(new THREE.Vector3());
  }
}
