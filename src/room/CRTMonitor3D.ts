import * as THREE from 'three';

export class CRTMonitor3D {
  private group: THREE.Group;
  private screenMesh!: THREE.Mesh;
  private screenTexture: THREE.CanvasTexture;
  private glowLight!: THREE.PointLight;

  constructor(screenTexture: THREE.CanvasTexture) {
    this.screenTexture = screenTexture;
    this.group = new THREE.Group();

    this.createCabinet();
    this.createBezel();
    this.createScreen();
    this.createDetails();
    this.createGlowLight();
  }

  getMesh(): THREE.Group {
    return this.group;
  }

  getGlowLight(): THREE.PointLight {
    return this.glowLight;
  }

  private createCabinet(): void {
    const cabinetColor = 0x222222;
    const cabinetMaterial = new THREE.MeshStandardMaterial({
      color: cabinetColor,
      roughness: 0.6,
      metalness: 0.15,
    });

    // Main cabinet body - deep box
    const cabinetGeo = new THREE.BoxGeometry(0.52, 0.42, 0.48);
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMaterial);
    cabinet.castShadow = true;
    this.group.add(cabinet);

    // Side vents (left)
    this.createVents(-0.261, 0, 0, 'left');
    // Side vents (right)
    this.createVents(0.261, 0, 0, 'right');

    // Top handle/vent area
    const topGeo = new THREE.BoxGeometry(0.3, 0.03, 0.1);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.2,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 0.215, -0.1);
    this.group.add(top);
  }

  private createVents(x: number, y: number, z: number, side: string): void {
    const ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      metalness: 0.1,
    });

    const ventGeo = new THREE.BoxGeometry(0.005, 0.15, 0.3);
    const vent = new THREE.Mesh(ventGeo, ventMaterial);
    vent.position.set(x, y, z);
    this.group.add(vent);

    // Vent slits
    const slitGeo = new THREE.BoxGeometry(0.008, 0.003, 0.25);
    const slitMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 1.0,
      metalness: 0.0,
    });

    for (let i = -3; i <= 3; i++) {
      const slit = new THREE.Mesh(slitGeo, slitMat);
      slit.position.set(x + (side === 'left' ? -0.005 : 0.005), i * 0.02, z);
      this.group.add(slit);
    }
  }

  private createBezel(): void {
    const bezelColor = 0x2a2a2a;
    const bezelMaterial = new THREE.MeshStandardMaterial({
      color: bezelColor,
      roughness: 0.5,
      metalness: 0.2,
    });

    const bezelThickness = 0.08;
    const bezelDepth = 0.03;

    // Top bezel
    const topBezelGeo = new THREE.BoxGeometry(0.52, bezelThickness, bezelDepth);
    const topBezel = new THREE.Mesh(topBezelGeo, bezelMaterial);
    topBezel.position.set(0, 0.17, 0.225);
    this.group.add(topBezel);

    // Bottom bezel
    const bottomBezelGeo = new THREE.BoxGeometry(0.52, bezelThickness, bezelDepth);
    const bottomBezel = new THREE.Mesh(bottomBezelGeo, bezelMaterial);
    bottomBezel.position.set(0, -0.17, 0.225);
    this.group.add(bottomBezel);

    // Left bezel
    const leftBezelGeo = new THREE.BoxGeometry(bezelThickness, 0.26, bezelDepth);
    const leftBezel = new THREE.Mesh(leftBezelGeo, bezelMaterial);
    leftBezel.position.set(-0.22, 0, 0.225);
    this.group.add(leftBezel);

    // Right bezel
    const rightBezelGeo = new THREE.BoxGeometry(bezelThickness, 0.26, bezelDepth);
    const rightBezel = new THREE.Mesh(rightBezelGeo, bezelMaterial);
    rightBezel.position.set(0.22, 0, 0.225);
    this.group.add(rightBezel);
  }

  private createScreen(): void {
    const screenWidth = 0.36;
    const screenHeight = 0.26;
    const segmentsW = 48;
    const segmentsH = 32;

    // Create plane with many segments for curvature
    const geometry = new THREE.PlaneGeometry(screenWidth, screenHeight, segmentsW, segmentsH);

    // Apply curvature - bulge outward toward viewer
    const curvature = 1.8;
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const distSq = (x / screenWidth) ** 2 + (y / screenHeight) ** 2;
      const z = distSq * curvature;
      positions.setZ(i, z);
    }
    geometry.computeVertexNormals();

    // Screen material - emissive for glow effect
    const material = new THREE.MeshStandardMaterial({
      map: this.screenTexture,
      emissive: 0x0a1a0a,
      emissiveMap: this.screenTexture,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.FrontSide,
    });

    this.screenMesh = new THREE.Mesh(geometry, material);
    // Position slightly recessed into bezel
    this.screenMesh.position.set(0, 0, 0.23);
    this.group.add(this.screenMesh);

    // Screen glass reflection overlay
    const glassGeo = new THREE.PlaneGeometry(screenWidth * 1.02, screenHeight * 1.02, segmentsW, segmentsH);
    const glassPositions = glassGeo.attributes.position;
    for (let i = 0; i < glassPositions.count; i++) {
      const x = glassPositions.getX(i);
      const y = glassPositions.getY(i);
      const distSq = (x / screenWidth) ** 2 + (y / screenHeight) ** 2;
      const z = distSq * curvature + 0.001;
      glassPositions.setZ(i, z);
    }
    glassGeo.computeVertexNormals();

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.03,
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0.1,
      side: THREE.FrontSide,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0, 0.235);
    this.group.add(glass);
  }

  private createDetails(): void {
    // Power LED
    const ledGeo = new THREE.SphereGeometry(0.008, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0x33ff33,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.18, -0.19, 0.24);
    this.group.add(led);

    // LED glow
    const glowGeo = new THREE.SphereGeometry(0.012, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x33ff33,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(led.position);
    this.group.add(glow);

    // Brand name plate
    const plateGeo = new THREE.BoxGeometry(0.12, 0.015, 0.005);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.3,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, -0.19, 0.24);
    this.group.add(plate);

    // Power button
    const btnGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 12);
    const btnMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.4,
      metalness: 0.5,
    });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0.22, -0.19, 0.24);
    this.group.add(btn);
  }

  private createGlowLight(): void {
    this.glowLight = new THREE.PointLight(0x33ff33, 0.8, 3.0);
    this.glowLight.position.set(0, 0, 0.5);
    this.glowLight.castShadow = false;
    this.group.add(this.glowLight);
  }
}
