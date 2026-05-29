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

  // ─── Terminal projection-mapping config ───
  // The terminal canvas is planar-projected onto the glass mesh.
  // FLIP_V: true to flip vertically if text appears upside-down.
  // FLIP_U: true to flip horizontally if text appears mirrored.
  // SWAP_AXES: true if the screen surface is rotated 90° in the model.
  // BEZEL_PADDING: fraction of screen to leave as black bezel (0 = edge-to-edge, 0.1 = 10% bezel on each side)
  private readonly PROJ_FLIP_V = false;
  private readonly PROJ_FLIP_U = true;
  private readonly PROJ_SWAP_AXES = false;  
  private readonly PROJ_BEZEL_PADDING = -0.05;

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
    this.camera.position.set(1.1, 0.88, 0);

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

        // Compute bounding box and auto-scale
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.0 / maxDim;
        model.scale.set(scale, scale, scale);
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

        this.controls.target.set(0, size.y * scale * 0.5, 0);
        this.controls.update();

        this.findMonitorScreen(model);
      },
      undefined,
      (error) => {
        console.error('Error loading GLTF model:', error);
      }
    );
  }

  private findMonitorScreen(model: THREE.Group): void {
    let foundScreen = false;
    const names = ['glass', 'screen', 'monitor', 'display', 'object_7', 'object_1'];

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && !foundScreen) {
        const name = child.name.toLowerCase();
        if (names.some((n) => name.includes(n))) {
          this.monitorScreenMesh = child;
          this.applyTerminalTexture(child);
          foundScreen = true;
        }
      }
    });

    if (!foundScreen) {
      console.warn('No monitor screen mesh found; applying texture to first mesh.');
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && !this.monitorScreenMesh) {
          this.monitorScreenMesh = child;
          this.applyTerminalTexture(child);
        }
      });
    }
  }

  private applyTerminalTexture(mesh: THREE.Mesh): void {
    // 1. Compute planar-projection UVs so the terminal maps 1:1 onto the
    //    screen surface, preserving aspect ratio (letterboxed if needed).
    this.projectionMapUVs(mesh);

    // 2. Apply texture with GLTF top-left origin
    const texture = this.terminal.getTexture();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false; // top-left origin = upright text
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
  }

  /**
   * Replaces the mesh UVs with planar-projection coordinates derived from
   * the mesh vertex positions. The two largest bounding-box dimensions
   * define the screen surface (width/height); the smallest is the normal.
   * The terminal canvas aspect ratio is preserved via letterboxing.
   */
  private projectionMapUVs(mesh: THREE.Mesh): void {
    const geometry = mesh.geometry.clone();
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    // Compute local-space bounding box
    const localBox = new THREE.Box3();
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      localBox.expandByPoint(vertex);
    }

    const localSize = localBox.getSize(new THREE.Vector3());

    // Identify the two largest dimensions (screen surface) and smallest (normal)
    const dims = [
      { axis: 'x', size: localSize.x, idx: 0 },
      { axis: 'y', size: localSize.y, idx: 1 },
      { axis: 'z', size: localSize.z, idx: 2 },
    ].sort((a, b) => b.size - a.size);

    const uDim = this.PROJ_SWAP_AXES ? dims[1] : dims[0];
    const vDim = this.PROJ_SWAP_AXES ? dims[0] : dims[1];

    // Aspect ratios
    const terminalCanvas = this.terminal.getCanvas();
    const terminalAspect = terminalCanvas.width / terminalCanvas.height;
    const screenAspect = uDim.size / vDim.size;

    // Letterbox so terminal fits inside the screen surface without stretching
    let uScale: number, vScale: number, uOffset: number, vOffset: number;

    if (screenAspect > terminalAspect) {
      // Screen is wider → fill height, bars on left/right
      vScale = 1.0;
      uScale = terminalAspect / screenAspect;
      vOffset = 0.0;
      uOffset = (1.0 - uScale) / 2.0;
    } else {
      // Screen is taller → fill width, bars on top/bottom
      uScale = 1.0;
      vScale = screenAspect / terminalAspect;
      uOffset = 0.0;
      vOffset = (1.0 - vScale) / 2.0;
    }

    // Apply bezel padding: shrink content inward, leaving black space at edges
    const bezel = this.PROJ_BEZEL_PADDING;
    uScale *= (1.0 - 2.0 * bezel);
    vScale *= (1.0 - 2.0 * bezel);
    uOffset += bezel;
    vOffset += bezel;

    // Generate planar UVs
    const newUvs = new Float32Array(positions.count * 2);

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      const rawU =
        (vertex.getComponent(uDim.idx) - localBox.min.getComponent(uDim.idx)) /
        uDim.size;
      const rawV =
        (vertex.getComponent(vDim.idx) - localBox.min.getComponent(vDim.idx)) /
        vDim.size;

      let u = rawU * uScale + uOffset;
      let v = rawV * vScale + vOffset;

      if (this.PROJ_FLIP_U) u = 1.0 - u;
      if (this.PROJ_FLIP_V) v = 1.0 - v;

      newUvs[i * 2] = u;
      newUvs[i * 2 + 1] = v;
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(newUvs, 2));
    mesh.geometry = geometry;
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
