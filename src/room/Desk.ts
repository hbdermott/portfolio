import * as THREE from 'three';

export class Desk {
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.createDeskTop();
    this.createLegs();
  }

  getMesh(): THREE.Group {
    return this.group;
  }

  private createDeskTop(): void {
    const topGeometry = new THREE.BoxGeometry(1.8, 0.04, 0.9);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.6,
      metalness: 0.05,
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 0.74;
    top.castShadow = true;
    top.receiveShadow = true;
    this.group.add(top);
  }

  private createLegs(): void {
    const legGeometry = new THREE.BoxGeometry(0.05, 0.74, 0.05);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.3,
    });

    const positions = [
      { x: -0.8, z: 0.38 },
      { x: 0.8, z: 0.38 },
      { x: -0.8, z: -0.38 },
      { x: 0.8, z: -0.38 },
    ];

    for (const pos of positions) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos.x, 0.37, pos.z);
      leg.castShadow = true;
      this.group.add(leg);
    }
  }
}
