import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CanvasTerminal } from '../terminal/CanvasTerminal';
import { Room } from './Room';
import { Desk } from './Desk';
import { Keyboard } from './Keyboard';
import { CRTMonitor3D } from './CRTMonitor3D';

export class RoomScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private terminal: CanvasTerminal;
  private crtMonitor!: CRTMonitor3D;
  private clock: THREE.Clock;

  private animationId: number | null = null;

  constructor(container: HTMLElement, terminal: CanvasTerminal) {
    this.terminal = terminal;
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 2, 8);

    // Camera - sitting at desk position
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0.5, 1.08, 1.8);
    this.camera.lookAt(0, 0.96, 0);

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
    this.renderer.toneMappingExposure = 0.8;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 4;
    this.controls.maxPolarAngle = Math.PI / 1.8;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.target.set(0, 0.96, 0);
    this.controls.update();

    this.setupLighting();
    this.createRoomObjects();
    this.handleResize();
  }

  start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const elapsed = this.clock.getElapsedTime() * 1000;

      // Update terminal canvas texture
      this.terminal.update(elapsed);

      // Animate monitor glow intensity slightly
      const glowIntensity = 0.7 + Math.sin(elapsed * 0.001) * 0.1;
      this.crtMonitor.getGlowLight().intensity = glowIntensity;

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

  getScene(): THREE.Scene {
    return this.scene;
  }

  private setupLighting(): void {
    // Very dim ambient - monitor is the main light source
    const ambientLight = new THREE.AmbientLight(0x111111, 0.3);
    this.scene.add(ambientLight);

    // Subtle fill light from above (ceiling light)
    const fillLight = new THREE.PointLight(0xffaa55, 0.15, 6);
    fillLight.position.set(1, 3, 1);
    this.scene.add(fillLight);

    // Rim light from behind monitor (subtle blue-ish)
    const rimLight = new THREE.PointLight(0x223344, 0.1, 4);
    rimLight.position.set(0, 1.5, -1);
    this.scene.add(rimLight);
  }

  private createRoomObjects(): void {
    // Room
    const room = new Room();
    this.scene.add(room.getMesh());

    // Desk
    const desk = new Desk();
    this.scene.add(desk.getMesh());

    // CRT Monitor
    this.crtMonitor = new CRTMonitor3D(this.terminal.getTexture());
    const monitorMesh = this.crtMonitor.getMesh();
    // Position on desk: desk top at 0.74, monitor half-height 0.21
    monitorMesh.position.set(0, 0.95, -0.12);
    monitorMesh.rotation.x = -0.04;
    this.scene.add(monitorMesh);

    // Keyboard
    const keyboard = new Keyboard();
    const keyboardMesh = keyboard.getMesh();
    keyboardMesh.position.set(0, 0.753, 0.18);
    this.scene.add(keyboardMesh);

    // Add subtle dust particles in the air
    this.createDustParticles();
  }

  private createDustParticles(): void {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x33ff33,
      size: 0.005,
      transparent: true,
      opacity: 0.15,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Animate particles slowly
    const animateParticles = () => {
      const posArray = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += Math.sin(Date.now() * 0.0001 + i) * 0.0001;
      }
      geometry.attributes.position.needsUpdate = true;
      requestAnimationFrame(animateParticles);
    };
    animateParticles();
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
