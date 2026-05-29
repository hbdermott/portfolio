import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CanvasTerminal } from '../terminal/CanvasTerminal';

export class GLTFScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private terminal: CanvasTerminal;
  private clock: THREE.Clock;
  private monitorScreenMesh: THREE.Mesh | null = null;

  private animationId: number | null = null;

  constructor(container: HTMLElement, terminal: CanvasTerminal) {
    this.terminal = terminal;
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    this.camera.position.set(0.4, 0.5, 1.2);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 3;
    this.controls.target.set(0, 0.2, 0);
    this.controls.update();

    this.setupLighting();
    this.loadModel();
    this.handleResize();
  }

  start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const elapsed = this.clock.getElapsedTime() * 1000;

      // Update terminal canvas
      this.terminal.update(elapsed);

      // Update monitor screen texture if found
      if (this.monitorScreenMesh) {
        const mat = this.monitorScreenMesh.material as THREE.MeshStandardMaterial;
        if (mat.map) {
          mat.map.needsUpdate = true;
        }
        if (mat.emissiveMap) {
          mat.emissiveMap.needsUpdate = true;
        }
      }

      this.controls.update();
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

  private setupLighting(): void {
    // Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional (like a desk lamp)
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    dirLight.position.set(1, 2, 1);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // Fill from other side
    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.4);
    fillLight.position.set(-1, 1, 0.5);
    this.scene.add(fillLight);

    // Subtle rim light from behind
    const rimLight = new THREE.PointLight(0x445566, 0.3, 5);
    rimLight.position.set(0, 0.8, -1);
    this.scene.add(rimLight);
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      '/retro_crt_computer_1990s_desktop_pc/scene.gltf',
      (gltf) => {
        const model = gltf.scene;
        this.scene.add(model);

        // Scale and position the model
        model.scale.set(3, 3, 3);
        model.position.set(0, -0.25, 0);

        // Find the monitor glass/screen mesh
        this.findMonitorScreen(model);
      },
      (progress) => {
        console.log('Loading model:', (progress.loaded / progress.total) * 100, '%');
      },
      (error) => {
        console.error('Error loading GLTF model:', error);
      }
    );
  }

  private findMonitorScreen(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        console.log('Found mesh:', child.name);

        // Look for monitor screen/glass mesh by name
        if (
          name.includes('glass') ||
          name.includes('screen') ||
          name.includes('monitor') ||
          name.includes('display')
        ) {
          console.log('Found monitor mesh:', child.name);
          this.monitorScreenMesh = child;
          this.applyTerminalTexture(child);
        }
      }
    });
  }

  private applyTerminalTexture(mesh: THREE.Mesh): void {
    const texture = this.terminal.getTexture();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0x112211,
      emissiveMap: texture,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.FrontSide,
    });

    mesh.material = material;
  }

  private handleResize(): void {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }
}
