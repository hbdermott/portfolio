import * as THREE from 'three';

interface KeyDef {
  label: string;
  width: number; // in key units (1u = 19.05mm)
}

export class Keyboard {
  private group: THREE.Group;
  private readonly unit = 0.01905; // 19.05mm in meters

  constructor() {
    this.group = new THREE.Group();
    this.createBase();
    this.createKeys();
    // Slight tilt toward user like a real keyboard
    this.group.rotation.x = 0.05;
  }

  getMesh(): THREE.Group {
    return this.group;
  }

  private createBase(): void {
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.45,
      metalness: 0.25,
    });

    // Main chassis body - thick and solid
    const chassisGeo = new THREE.BoxGeometry(0.38, 0.022, 0.155);
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.castShadow = true;
    this.group.add(chassis);

    // Top metal plate
    const plateGeo = new THREE.BoxGeometry(0.375, 0.002, 0.148);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x202020,
      roughness: 0.5,
      metalness: 0.4,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.012;
    this.group.add(plate);
  }

  private createKeys(): void {
    // TKL row definitions with proper staggering
    // Each row: array of KeyDef, plus row-specific offset
    const rows: { keys: KeyDef[]; yOffset: number; xStagger: number }[] = [
      {
        // Function row
        keys: [
          { label: 'ESC', width: 1 },
          { label: '', width: 0.5 },
          { label: 'F1', width: 1 },
          { label: 'F2', width: 1 },
          { label: 'F3', width: 1 },
          { label: 'F4', width: 1 },
          { label: '', width: 0.5 },
          { label: 'F5', width: 1 },
          { label: 'F6', width: 1 },
          { label: 'F7', width: 1 },
          { label: 'F8', width: 1 },
          { label: '', width: 0.5 },
          { label: 'F9', width: 1 },
          { label: 'F10', width: 1 },
          { label: 'F11', width: 1 },
          { label: 'F12', width: 1 },
        ],
        yOffset: 0.065,
        xStagger: 0,
      },
      {
        // Number row
        keys: [
          { label: '`', width: 1 },
          { label: '1', width: 1 },
          { label: '2', width: 1 },
          { label: '3', width: 1 },
          { label: '4', width: 1 },
          { label: '5', width: 1 },
          { label: '6', width: 1 },
          { label: '7', width: 1 },
          { label: '8', width: 1 },
          { label: '9', width: 1 },
          { label: '0', width: 1 },
          { label: '-', width: 1 },
          { label: '=', width: 1 },
          { label: 'BKSP', width: 2 },
        ],
        yOffset: 0.045,
        xStagger: 0,
      },
      {
        // QWERTY row
        keys: [
          { label: 'TAB', width: 1.5 },
          { label: 'Q', width: 1 },
          { label: 'W', width: 1 },
          { label: 'E', width: 1 },
          { label: 'R', width: 1 },
          { label: 'T', width: 1 },
          { label: 'Y', width: 1 },
          { label: 'U', width: 1 },
          { label: 'I', width: 1 },
          { label: 'O', width: 1 },
          { label: 'P', width: 1 },
          { label: '[', width: 1 },
          { label: ']', width: 1 },
          { label: '\\', width: 1.5 },
        ],
        yOffset: 0.025,
        xStagger: 0.25,
      },
      {
        // Home row
        keys: [
          { label: 'CAPS', width: 1.75 },
          { label: 'A', width: 1 },
          { label: 'S', width: 1 },
          { label: 'D', width: 1 },
          { label: 'F', width: 1 },
          { label: 'G', width: 1 },
          { label: 'H', width: 1 },
          { label: 'J', width: 1 },
          { label: 'K', width: 1 },
          { label: 'L', width: 1 },
          { label: ';', width: 1 },
          { label: "'", width: 1 },
          { label: 'ENTER', width: 2.25 },
        ],
        yOffset: 0.005,
        xStagger: 0.4,
      },
      {
        // Bottom alpha row
        keys: [
          { label: 'SHIFT', width: 2.25 },
          { label: 'Z', width: 1 },
          { label: 'X', width: 1 },
          { label: 'C', width: 1 },
          { label: 'V', width: 1 },
          { label: 'B', width: 1 },
          { label: 'N', width: 1 },
          { label: 'M', width: 1 },
          { label: ',', width: 1 },
          { label: '.', width: 1 },
          { label: '/', width: 1 },
          { label: 'SHIFT', width: 2.75 },
        ],
        yOffset: -0.015,
        xStagger: 0.1,
      },
      {
        // Bottom modifier row
        keys: [
          { label: 'CTRL', width: 1.25 },
          { label: 'WIN', width: 1.25 },
          { label: 'ALT', width: 1.25 },
          { label: 'SPACE', width: 6.25 },
          { label: 'ALT', width: 1.25 },
          { label: 'FN', width: 1.25 },
          { label: 'CTRL', width: 1.25 },
        ],
        yOffset: -0.035,
        xStagger: 0.15,
      },
    ];

    // Materials
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x282828,
      roughness: 0.6,
      metalness: 0.1,
    });

    const capTopMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.4,
      metalness: 0.05,
    });

    // ESC key gets a different color (accent)
    const escCapMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Warm brown accent
      roughness: 0.45,
      metalness: 0.05,
    });

    for (const row of rows) {
      let startX = -0.175 + row.xStagger * this.unit;

      for (const key of row.keys) {
        if (key.label === '' && key.width === 0.5) {
          startX += key.width * this.unit;
          continue;
        }

        const keyW = key.width * this.unit * 0.92;
        const keyD = this.unit * 0.92;
        const keyH = 0.008;

        // Key stem (the vertical sides)
        const stemGeo = new THREE.BoxGeometry(keyW, keyH, keyD);
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.set(
          startX + (key.width * this.unit) / 2,
          0.016,
          row.yOffset
        );
        this.group.add(stem);

        // Key cap top (slightly smaller, sits on stem)
        const capTopW = keyW * 0.85;
        const capTopD = keyD * 0.85;
        const capTopH = 0.003;
        const capTopGeo = new THREE.BoxGeometry(capTopW, capTopH, capTopD);

        const mat = key.label === 'ESC' ? escCapMat : capTopMat;
        const capTop = new THREE.Mesh(capTopGeo, mat);
        capTop.position.set(
          startX + (key.width * this.unit) / 2,
          0.016 + keyH / 2 + capTopH / 2,
          row.yOffset
        );
        this.group.add(capTop);

        startX += key.width * this.unit;
      }
    }
  }
}
