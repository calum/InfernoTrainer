import * as THREE from "three";

import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module";

import { Model } from "./Model";
import { Renderable } from "../Renderable";
import { Location } from "../Location";
import { Viewport } from "../Viewport";
import { Viewport3d } from "../Viewport3d";

const CANVAS_TILE_SIZE = 20;

const OUTLINE_NORMAL = 0xffffff;
const OUTLINE_SELECTED = 0xff0000;

// global loader across models
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

/**
 * Render the model using a sprite derived from the 2d representation of the renderable.
 */
export class GLTFModel implements Model {
  static forRenderable(r: Renderable, model: string, scale: number) {
    return new GLTFModel(r, model, scale);
  }

  private outline: THREE.LineSegments;
  private outlineMaterial: THREE.LineBasicMaterial;

  private clickHull: THREE.Mesh;

  private loadedModel: GLTF | null = null;
  private hasInitialisedModel = false;
  private mixer: THREE.AnimationMixer | null = null;

  private playingAnimationId = -1;
  private playingAnimationPriority = 0;
  private playingAnimationNonce = undefined;
  private animations: THREE.AnimationAction[] = [];

  constructor(private renderable: Renderable, private model: string, private scale: number) {
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
  }

  onAnimationFinished() {
    const currentNonce = this.playingAnimationNonce;
    const { index, priority, nonce, nonceFallback, speedScale } =
      this.renderable.getNewAnimation();
    this.playingAnimationNonce = nonce;
    // needed otherwise the animations bleed into each other
    this.mixer.stopAllAction();
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
    const newAnimation = this.animations[this.playingAnimationId];
    newAnimation.reset();
    newAnimation.setEffectiveTimeScale(speedScale ?? 1.0);
    newAnimation.setLoop(THREE.LoopOnce, 1);
    newAnimation.play();
  }

  // called the first time the model needs to appear on the scene
  initialiseModel() {
    loader.load(this.model, (gltf: GLTF) => {
      this.loadedModel = gltf;
      const scale = this.scale;
      // make adjustments
      gltf.scene.scale.set(scale, scale, scale);
      gltf.scene.frustumCulled = false;
      this.mixer = new THREE.AnimationMixer(gltf.scene);
      this.animations = gltf.animations.map((animation) => this.mixer.clipAction(animation));
      const { index, priority, nonce } = this.renderable.getNewAnimation();
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

  draw(
    scene: THREE.Scene,
    clockDelta: number,
    tickPercent: number,
    location: Location,
    rotation: number
  ) {
    if (!this.hasInitialisedModel) {
      this.initialiseModel();
      this.hasInitialisedModel = true;
    }
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
      this.mixer.update(clockDelta);

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

  private static until(condition: () => boolean) {
    const poll = (res) => {
      if (condition()) {
        res();
      } else {
        setTimeout(() => poll(res), 50);
      }
    };
    return new Promise(poll);
  }

  async preload() {
    return await GLTFModel.preload(this.model);
  }

  static async preload(model: string) {
    const gltf = await loader.loadAsync(model);
    const scene = (Viewport.viewport.getDelegate() as Viewport3d).scene;
    const camera = new THREE.PerspectiveCamera();
    gltf.scene.scale.set(0.01, 0.01, 0.01);
    gltf.scene.position.set(20, 0, 20);
    
    scene.add(gltf.scene);
    camera.position.set(10, 10, 10);
    camera.lookAt(gltf.scene.position);
    

    const renderer = new THREE.WebGLRenderer({ canvas: new OffscreenCanvas(1, 1)});
    renderer.setSize(1, 1, false);
    let didRender = false;
    requestAnimationFrame(() => {
      renderer.render(scene, camera);
      didRender = true;
    });
    await GLTFModel.until(() => didRender);
    scene.remove(gltf.scene);
    return;
  }
}
