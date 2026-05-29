import * as THREE from 'three';

export class GeometryFactory {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createSceneObjects(): void {
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x33ff33,
      wireframe: true,
    });

    // Spinning cube
    const cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
    const cube = new THREE.Mesh(cubeGeometry, wireframeMaterial);
    cube.position.set(-5, 2, 0);
    cube.userData.rotationSpeed = { x: 0.01, y: 0.015, z: 0.005 };
    this.scene.add(cube);

    // Torus knot
    const torusGeometry = new THREE.TorusKnotGeometry(2, 0.6, 64, 8);
    const torus = new THREE.Mesh(torusGeometry, wireframeMaterial);
    torus.position.set(5, 2, 0);
    torus.userData.rotationSpeed = { x: 0.005, y: 0.01, z: 0.008 };
    this.scene.add(torus);

    // Icosahedron
    const icoGeometry = new THREE.IcosahedronGeometry(2.5, 0);
    const ico = new THREE.Mesh(icoGeometry, wireframeMaterial);
    ico.position.set(0, -3, 0);
    ico.userData.rotationSpeed = { x: 0.008, y: 0.012, z: 0.003 };
    this.scene.add(ico);

    // Create text logo using box geometries
    this.createTextLogo();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x33ff33, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x33ff33, 1, 100);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);
  }

  private createTextLogo(): void {
    const hGroup = new THREE.Group();
    const barGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x33ff33 });

    const leftBar = new THREE.Mesh(barGeo, barMat);
    leftBar.position.set(-0.6, 0, 0);
    hGroup.add(leftBar);

    const rightBar = new THREE.Mesh(barGeo, barMat);
    rightBar.position.set(0.6, 0, 0);
    hGroup.add(rightBar);

    const midBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.3), barMat);
    midBar.position.set(0, 0, 0);
    hGroup.add(midBar);

    hGroup.position.set(-8, 5, -5);
    hGroup.userData.rotationSpeed = { x: 0.003, y: 0.007, z: 0 };
    this.scene.add(hGroup);
  }

  updateObjects(): void {
    this.scene.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh && object.userData.rotationSpeed) {
        const speed = object.userData.rotationSpeed;
        object.rotation.x += speed.x;
        object.rotation.y += speed.y;
        object.rotation.z += speed.z;
      }
      if (object instanceof THREE.Group && object.userData.rotationSpeed) {
        const speed = object.userData.rotationSpeed;
        object.rotation.x += speed.x;
        object.rotation.y += speed.y;
        object.rotation.z += speed.z;
      }
    });
  }
}
