import * as THREE from 'three';
import { GeometryFactory } from './GeometryFactory';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private geometryFactory: GeometryFactory;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 15;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
    });
    this.renderer.setSize(120, 80);
    this.renderer.setPixelRatio(1);

    this.geometryFactory = new GeometryFactory(this.scene);
    this.geometryFactory.createSceneObjects();
  }

  start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.geometryFactory.updateObjects();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
