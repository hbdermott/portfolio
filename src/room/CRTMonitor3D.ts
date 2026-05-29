import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export class CRTMonitor3D {
  private group: THREE.Group;
  private screenMesh!: THREE.Mesh;
  private screenTexture: THREE.CanvasTexture;
  private glowLight!: THREE.PointLight;

  // Cabinet dimensions
  private readonly cabW = 0.50;
  private readonly cabH = 0.42;
  private readonly cabD = 0.44;
  private readonly cornerR = 0.025;

  constructor(screenTexture: THREE.CanvasTexture) {
    this.screenTexture = screenTexture;
    this.group = new THREE.Group();

    this.createCabinet();
    this.createBezelFrame();
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
    const cabinetMaterial = new THREE.MeshStandardMaterial({
      color: 0x252525,
      roughness: 0.55,
      metalness: 0.12,
    });

    // Rounded box for the main cabinet body
    const cabinetGeo = new RoundedBoxGeometry(
      this.cabW, this.cabH, this.cabD, 4, this.cornerR
    );
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMaterial);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    this.group.add(cabinet);

    // Side vents
    this.createVents(-this.cabW / 2 - 0.002, 0, 0.05, 'left');
    this.createVents(this.cabW / 2 + 0.002, 0, 0.05, 'right');

    // Top handle ridge
    const ridgeGeo = new THREE.BoxGeometry(0.28, 0.018, 0.10);
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.6,
      metalness: 0.2,
    });
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(0, this.cabH / 2 + 0.002, -0.06);
    this.group.add(ridge);
  }

  private createVents(x: number, y: number, z: number, side: string): void {
    const ventMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.95,
      metalness: 0.05,
    });

    const ventGeo = new THREE.BoxGeometry(0.004, 0.14, 0.28);
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(x, y, z);
    this.group.add(vent);

    // Horizontal vent slits
    const slitGeo = new THREE.BoxGeometry(0.006, 0.002, 0.24);
    const slitMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 1.0,
      metalness: 0.0,
    });

    for (let i = -2; i <= 2; i++) {
      const slit = new THREE.Mesh(slitGeo, slitMat);
      slit.position.set(
        x + (side === 'left' ? -0.004 : 0.004),
        i * 0.016,
        z
      );
      this.group.add(slit);
    }
  }

  private createBezelFrame(): void {
    // Create a bezel frame with a hole using ExtrudeGeometry
    // Outer rounded rect, inner rounded rect hole
    const outerW = this.cabW - 0.02;
    const outerH = this.cabH - 0.02;
    const innerW = 0.38;
    const innerH = 0.30;
    const outerR = 0.02;
    const innerR = 0.01;

    const shape = new THREE.Shape();
    this.drawRoundedRect(shape, -outerW / 2, -outerH / 2, outerW, outerH, outerR);

    const hole = new THREE.Path();
    this.drawRoundedRect(hole, -innerW / 2, -innerH / 2, innerW, innerH, innerR);
    shape.holes.push(hole);

    const bezelGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.018,
      bevelEnabled: false,
    });
    // Extrude goes from z=0 to z=depth, face the front
    bezelGeo.computeVertexNormals();

    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.5,
      metalness: 0.18,
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    // Position at front face of cabinet
    bezel.position.z = this.cabD / 2 - 0.005;
    bezel.castShadow = true;
    this.group.add(bezel);

    // Inner shadow ring (recessed area behind bezel)
    const recessGeo = new THREE.PlaneGeometry(innerW + 0.01, innerH + 0.01);
    const recessMat = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.9,
      metalness: 0.0,
    });
    const recess = new THREE.Mesh(recessGeo, recessMat);
    recess.position.z = this.cabD / 2 - 0.012;
    this.group.add(recess);
  }

  private drawRoundedRect(
    path: THREE.Shape | THREE.Path,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    path.moveTo(x + r, y);
    path.lineTo(x + w - r, y);
    path.quadraticCurveTo(x + w, y, x + w, y + r);
    path.lineTo(x + w, y + h - r);
    path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    path.lineTo(x + r, y + h);
    path.quadraticCurveTo(x, y + h, x, y + h - r);
    path.lineTo(x, y + r);
    path.quadraticCurveTo(x, y, x + r, y);
  }

  private createScreen(): void {
    const screenW = 0.36;
    const screenH = 0.26;
    const segW = 32;
    const segH = 24;

    // Plane facing +Z (toward viewer)
    const geometry = new THREE.PlaneGeometry(screenW, screenH, segW, segH);

    // CONVEX curvature: center bulges forward toward viewer
    // Formula: z = curvature * (1 - distSq) so center is highest
    const curvature = 0.025;
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const nx = x / (screenW * 0.5);
      const ny = y / (screenH * 0.5);
      const distSq = nx * nx + ny * ny;
      // Clamp distSq so edges don't overshoot
      const clampedDist = Math.min(distSq, 1.0);
      // Center forward, edges back
      const z = curvature * (1 - clampedDist);
      positions.setZ(i, z);
    }
    geometry.computeVertexNormals();

    // Screen material with emissive glow
    const material = new THREE.MeshStandardMaterial({
      map: this.screenTexture,
      emissive: 0x0a1a0a,
      emissiveMap: this.screenTexture,
      emissiveIntensity: 0.3,
      roughness: 0.25,
      metalness: 0.05,
      side: THREE.FrontSide,
    });

    this.screenMesh = new THREE.Mesh(geometry, material);
    // Position screen so its center bulge reaches the bezel front
    // Cabinet front is at z = cabD/2 = 0.22
    // Screen center (z=curvature=0.025) should be at or slightly behind bezel
    this.screenMesh.position.set(0, 0, this.cabD / 2 - curvature - 0.005);
    this.group.add(this.screenMesh);

    // Glass overlay matching convex curve
    const glassGeo = new THREE.PlaneGeometry(screenW * 1.01, screenH * 1.01, segW, segH);
    const glassPos = glassGeo.attributes.position;
    for (let i = 0; i < glassPos.count; i++) {
      const x = glassPos.getX(i);
      const y = glassPos.getY(i);
      const nx = x / (screenW * 0.5);
      const ny = y / (screenH * 0.5);
      const distSq = nx * nx + ny * ny;
      const clampedDist = Math.min(distSq, 1.0);
      const z = curvature * (1 - clampedDist) + 0.001;
      glassPos.setZ(i, z);
    }
    glassGeo.computeVertexNormals();

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.025,
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0.15,
      side: THREE.FrontSide,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.copy(this.screenMesh.position);
    glass.position.z += 0.002;
    this.group.add(glass);
  }

  private createDetails(): void {
    // Power LED
    const ledGeo = new THREE.SphereGeometry(0.005, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x33ff33 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.17, -0.175, this.cabD / 2 + 0.008);
    this.group.add(led);

    // LED glow halo
    const glowGeo = new THREE.SphereGeometry(0.009, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x33ff33,
      transparent: true,
      opacity: 0.25,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(led.position);
    this.group.add(glow);

    // Brand plate
    const plateGeo = new THREE.BoxGeometry(0.10, 0.012, 0.004);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.3,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, -0.175, this.cabD / 2 + 0.006);
    this.group.add(plate);

    // Power button
    const btnGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.004, 12);
    const btnMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.4,
      metalness: 0.5,
    });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0.21, -0.175, this.cabD / 2 + 0.006);
    this.group.add(btn);
  }

  private createGlowLight(): void {
    this.glowLight = new THREE.PointLight(0x33ff33, 0.5, 2.0);
    this.glowLight.position.set(0, 0, this.cabD / 2 + 0.15);
    this.glowLight.castShadow = false;
    this.group.add(this.glowLight);
  }
}
