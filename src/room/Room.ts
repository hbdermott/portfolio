import * as THREE from 'three';

export class Room {
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.createFloor();
    this.createWalls();
  }

  getMesh(): THREE.Group {
    return this.group;
  }

  private createFloor(): void {
    const geometry = new THREE.PlaneGeometry(8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x141210,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  private createWalls(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.BackSide,
    });

    // Back wall
    const backWallGeo = new THREE.PlaneGeometry(8, 4);
    const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
    backWall.position.set(0, 2, -4);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    // Left wall
    const leftWallGeo = new THREE.PlaneGeometry(8, 4);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-4, 2, 0);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // Right wall
    const rightWallGeo = new THREE.PlaneGeometry(8, 4);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(4, 2, 0);
    rightWall.receiveShadow = true;
    this.group.add(rightWall);
  }
}
