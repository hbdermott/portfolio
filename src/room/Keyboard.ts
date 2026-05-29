import * as THREE from 'three';

export class Keyboard {
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.createBase();
    this.createKeys();
  }

  getMesh(): THREE.Group {
    return this.group;
  }

  private createBase(): void {
    const geometry = new THREE.BoxGeometry(0.45, 0.015, 0.16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.2,
    });
    const base = new THREE.Mesh(geometry, material);
    base.castShadow = true;
    this.group.add(base);

    // Slight tilt toward user
    this.group.rotation.x = 0.04;
  }

  private createKeys(): void {
    const keyMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.6,
      metalness: 0.1,
    });

    const keyGeometry = new THREE.BoxGeometry(0.025, 0.008, 0.025);

    // Create a simplified key grid
    const rows = 4;
    const cols = 14;
    const startX = -0.19;
    const startZ = -0.05;
    const spacingX = 0.028;
    const spacingZ = 0.028;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = new THREE.Mesh(keyGeometry, keyMaterial);
        key.position.set(
          startX + c * spacingX,
          0.012,
          startZ + r * spacingZ
        );
        this.group.add(key);
      }
    }

    // Spacebar (wider)
    const spacebarGeo = new THREE.BoxGeometry(0.12, 0.008, 0.025);
    const spacebar = new THREE.Mesh(spacebarGeo, keyMaterial);
    spacebar.position.set(0, 0.012, startZ + rows * spacingZ);
    this.group.add(spacebar);
  }
}
