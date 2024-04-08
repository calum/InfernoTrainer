import * as THREE from "three";

import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module";

import { Model } from "./Model";
import { Renderable } from "../Renderable";
import { Location } from "../Location";

const CANVAS_TILE_SIZE = 20;

const OUTLINE_NORMAL = 0xffffff;
const OUTLINE_SELECTED = 0xff0000;

/**
 * Render the model using a sprite derived from the 2d representation of the renderable.
 */
export class GLTFModel implements Model {
  static forRenderable(r: Renderable, model: string, scale: number) {
    return new GLTFModel(r, model, scale);
  }

  private clock = new THREE.Clock();

  private outline: THREE.LineSegments;
  private outlineMaterial: THREE.LineBasicMaterial;

  private clickHull: THREE.Mesh;

  private loadedModel: GLTF | null = null;
  private mixer: THREE.AnimationMixer | null = null;

  private playingAnimationId = -1;
  private playingAnimationPriority = 0;
  private playingAnimationNonce = undefined;
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

    const hullMaterial = new THREE.MeshBasicMaterial({ color: 0x00000000 });
    hullMaterial.transparent = true;
    this.clickHull = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 0.4, size * 0.4, renderable.height, 6),
      hullMaterial
    );
    this.clickHull.userData.clickable = renderable.selectable;
    this.clickHull.userData.unit = renderable;
    this.clickHull.visible = false;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(model, (gltf: GLTF) => {
      this.loadedModel = gltf;
      // make adjustments
      gltf.scene.scale.set(scale, scale, scale);
      this.mixer = new THREE.AnimationMixer(gltf.scene);
      this.animations = gltf.animations.map((animation) => {
        const anim = this.mixer.clipAction(animation);
        return anim;
      });
      const { index, priority, nonce } = renderable.getNewAnimation();
      this.playingAnimationId = index;
      this.playingAnimationPriority = priority;
      this.playingAnimationNonce = nonce;
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
    const currentNonce = this.playingAnimationNonce;
    const { index, priority, nonce, nonceFallback, speedScale } =
      this.renderable.getNewAnimation();
    this.playingAnimationNonce = nonce;
    if (
      nonce !== undefined &&
      currentNonce === nonce &&
      index === this.playingAnimationId
    ) {
      // do not play it again, play the fallbcak instead
      this.playingAnimationNonce = nonce;
      this.playingAnimationId = nonceFallback;
    } else {
      this.playingAnimationId = index;
    }
    this.playingAnimationPriority = priority;
    this.animations[this.playingAnimationId].stop();
    const newAnimation = this.animations[this.playingAnimationId];
    newAnimation.reset();
    newAnimation.setEffectiveTimeScale(speedScale ?? 1.0);
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
      scene.add(this.clickHull);
    }

    this.outlineMaterial.color.setHex(
      this.renderable.selected ? OUTLINE_SELECTED : OUTLINE_NORMAL
    );

    const { x, y } = location;
    this.outline.position.x = x;
    this.outline.position.y = -0.49;
    this.outline.position.z = y;
    this.clickHull.position.x = x + this.renderable.size / 2;
    this.clickHull.position.y = -0.49;
    this.clickHull.position.z = y - this.renderable.size / 2;

    if (this.loadedModel && this.mixer) {
      const { index, priority } = this.renderable.getNewAnimation();
      if (
        priority > this.playingAnimationPriority &&
        index !== this.playingAnimationId
      ) {
        this.playingAnimationId = index;
        this.onAnimationFinished();
      }
      this.mixer.update(this.clock.getDelta());

      const { scene } = this.loadedModel;
      const { size } = this.renderable;
      const adjustedRotation = rotation + Math.PI / 2;
      scene.position.x = x + size / 2;
      scene.position.y = -0.45;
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
      scene.remove(this.clickHull);
    }
  }

  getWorldPosition(): THREE.Vector3 {
    return this.outline.getWorldPosition(new THREE.Vector3());
  }
}
