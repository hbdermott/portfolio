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
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    this.camera.position.set(0, 0.5, 2);

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
    this.controls.minDistance = 0.3;
    this.controls.maxDistance = 5;
    this.controls.target.set(0, 0.15, 0);
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Main directional (like a desk lamp from above-right)
    const dirLight = new THREE.DirectionalLight(0xffeedd, 2.0);
    dirLight.position.set(2, 3, 2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // Fill from left
    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.6);
    fillLight.position.set(-2, 1, 1);
    this.scene.add(fillLight);

    // Back light for rim
    const backLight = new THREE.PointLight(0x445566, 0.5, 5);
    backLight.position.set(0, 1, -2);
    this.scene.add(backLight);
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      '/scene.gltf',
      (gltf) => {
        const model = gltf.scene;
        this.scene.add(model);

        console.log('GLTF model loaded successfully');
        console.log('Model children count:', model.children.length);

        // Compute bounding box to understand model scale
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        console.log('Model bounding box:');
        console.log('  Size:', size.x, size.y, size.z);
        console.log('  Center:', center.x, center.y, center.z);
        console.log('  Min:', box.min.x, box.min.y, box.min.z);
        console.log('  Max:', box.max.x, box.max.y, box.max.z);

        // Auto-scale to fit view
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 1.0;
        const scale = targetSize / maxDim;
        model.scale.set(scale, scale, scale);

        // Center the model
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

        console.log('Applied scale:', scale);
        console.log('Applied position:', model.position.x, model.position.y, model.position.z);

        // Adjust camera to look at model
        this.controls.target.set(0, size.y * scale * 0.5, 0);
        this.controls.update();

        // Find the monitor glass/screen mesh
        this.findMonitorScreen(model);

      },
      (progress) => {
        if (progress.total > 0) {
          const pct = (progress.loaded / progress.total) * 100;
          console.log('Loading model:', pct.toFixed(1), '%');
        }
      },
      (error) => {
        console.error('Error loading GLTF model:', error);
      }
    );
  }

  private findMonitorScreen(model: THREE.Group): void {
    let foundScreen = false;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        console.log('Mesh found:', child.name);

        // Look for monitor screen/glass mesh
        if (!foundScreen && (
          name.includes('glass') ||
          name.includes('screen') ||
          name.includes('monitor') ||
          name.includes('display') ||
          name.includes('object_7') ||  // often the screen mesh
          name.includes('object_1')
        )) {
          console.log('>> Selected as monitor screen:', child.name);
          this.monitorScreenMesh = child;
          this.applyTerminalTexture(child);
          foundScreen = true;
        }
      }
    });

    if (!foundScreen) {
      console.warn('No monitor screen mesh found by name. Applying to first mesh.');
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && !this.monitorScreenMesh) {
          this.monitorScreenMesh = child;
          this.applyTerminalTexture(child);
        }
      });
    }
  }

  private applyTerminalTexture(mesh: THREE.Mesh): void {
    const texture = this.terminal.getTexture();
    texture.colorSpace = THREE.SRGBColorSpace;

    // GLTF uses top-left UV origin; Three.js defaults to bottom-left.
    // flipY=false aligns the texture so text appears right-side up.
    texture.flipY = false;
    texture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0x0a1a0a,
      emissiveMap: texture,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.05,
      side: THREE.FrontSide,
    });

    mesh.material = material;
    console.log('Terminal texture applied to:', mesh.name);
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
