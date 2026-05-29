import * as THREE from 'three';

export class MatrixRain3D {
  private scene: THREE.Scene;
  private particles: THREE.Points | null = null;
  private active = false;
  private particleCount = 800;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private velocities: Float32Array | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  start(): void {
    if (this.active) return;
    this.active = true;

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      // Start particles above the monitor area
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = 1.0 + Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      // Green colors
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 0.2;

      this.velocities[i] = 0.3 + Math.random() * 0.5;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.008,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);

    // Auto-stop after 8 seconds
    setTimeout(() => {
      this.stop();
    }, 8000);

    this.animate();
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
      this.particles = null;
    }
  }

  private animate(): void {
    if (!this.active || !this.geometry || !this.velocities) return;

    const positions = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 1] -= this.velocities[i] * 0.016; // fall down

      // Reset if below desk
      if (positions[i * 3 + 1] < 0.6) {
        positions[i * 3] = (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = 1.2 + Math.random() * 0.3;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        this.velocities[i] = 0.3 + Math.random() * 0.5;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    requestAnimationFrame(() => this.animate());
  }
}
