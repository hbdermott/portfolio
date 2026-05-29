import * as THREE from 'three';

interface KeyDef {
  label: string;
  width: number; // in key units (1.0 = standard key)
  row: number;
}

export class Keyboard {
  private group: THREE.Group;
  private readonly keyUnit = 0.019;
  private readonly keyHeight = 0.019;

  constructor() {
    this.group = new THREE.Group();
    this.createBase();
    this.createKeys();
  }

  getMesh(): THREE.Group {
    return this.group;
  }

  private createBase(): void {
    // Main chassis - thicker, more substantial
    const chassisGeo = new THREE.BoxGeometry(0.42, 0.025, 0.17);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.4,
      metalness: 0.3,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.castShadow = true;
    this.group.add(chassis);

    // Top plate
    const plateGeo = new THREE.BoxGeometry(0.41, 0.003, 0.16);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,
      roughness: 0.5,
      metalness: 0.2,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.014;
    this.group.add(plate);

    // Slight tilt toward user
    this.group.rotation.x = 0.06;
  }

  private createKeys(): void {
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.55,
      metalness: 0.15,
    });

    // TKL layout (Tenkeyless - no numpad)
    const layout: KeyDef[][] = [
      // Row 0: Function keys
      [
        { label: 'ESC', width: 1, row: 0 },
        { label: '', width: 0.5, row: 0 },
        { label: 'F1', width: 1, row: 0 },
        { label: 'F2', width: 1, row: 0 },
        { label: 'F3', width: 1, row: 0 },
        { label: 'F4', width: 1, row: 0 },
        { label: '', width: 0.5, row: 0 },
        { label: 'F5', width: 1, row: 0 },
        { label: 'F6', width: 1, row: 0 },
        { label: 'F7', width: 1, row: 0 },
        { label: 'F8', width: 1, row: 0 },
        { label: '', width: 0.5, row: 0 },
        { label: 'F9', width: 1, row: 0 },
        { label: 'F10', width: 1, row: 0 },
        { label: 'F11', width: 1, row: 0 },
        { label: 'F12', width: 1, row: 0 },
      ],
      // Row 1: Number row
      [
        { label: '`', width: 1, row: 1 },
        { label: '1', width: 1, row: 1 },
        { label: '2', width: 1, row: 1 },
        { label: '3', width: 1, row: 1 },
        { label: '4', width: 1, row: 1 },
        { label: '5', width: 1, row: 1 },
        { label: '6', width: 1, row: 1 },
        { label: '7', width: 1, row: 1 },
        { label: '8', width: 1, row: 1 },
        { label: '9', width: 1, row: 1 },
        { label: '0', width: 1, row: 1 },
        { label: '-', width: 1, row: 1 },
        { label: '=', width: 1, row: 1 },
        { label: 'BKSP', width: 2, row: 1 },
      ],
      // Row 2: QWERTY row
      [
        { label: 'TAB', width: 1.5, row: 2 },
        { label: 'Q', width: 1, row: 2 },
        { label: 'W', width: 1, row: 2 },
        { label: 'E', width: 1, row: 2 },
        { label: 'R', width: 1, row: 2 },
        { label: 'T', width: 1, row: 2 },
        { label: 'Y', width: 1, row: 2 },
        { label: 'U', width: 1, row: 2 },
        { label: 'I', width: 1, row: 2 },
        { label: 'O', width: 1, row: 2 },
        { label: 'P', width: 1, row: 2 },
        { label: '[', width: 1, row: 2 },
        { label: ']', width: 1, row: 2 },
        { label: '\\', width: 1.5, row: 2 },
      ],
      // Row 3: Home row
      [
        { label: 'CAPS', width: 1.75, row: 3 },
        { label: 'A', width: 1, row: 3 },
        { label: 'S', width: 1, row: 3 },
        { label: 'D', width: 1, row: 3 },
        { label: 'F', width: 1, row: 3 },
        { label: 'G', width: 1, row: 3 },
        { label: 'H', width: 1, row: 3 },
        { label: 'J', width: 1, row: 3 },
        { label: 'K', width: 1, row: 3 },
        { label: 'L', width: 1, row: 3 },
        { label: ';', width: 1, row: 3 },
        { label: "'", width: 1, row: 3 },
        { label: 'ENTER', width: 2.25, row: 3 },
      ],
      // Row 4: Bottom alpha row
      [
        { label: 'SHIFT', width: 2.25, row: 4 },
        { label: 'Z', width: 1, row: 4 },
        { label: 'X', width: 1, row: 4 },
        { label: 'C', width: 1, row: 4 },
        { label: 'V', width: 1, row: 4 },
        {label: 'B', width: 1, row: 4 },
        { label: 'N', width: 1, row: 4 },
        { label: 'M', width: 1, row: 4 },
        { label: ',', width: 1, row: 4 },
        { label: '.', width: 1, row: 4 },
        { label: '/', width: 1, row: 4 },
        { label: 'SHIFT', width: 2.75, row: 4 },
      ],
      // Row 5: Space/modifier row
      [
        { label: 'CTRL', width: 1.25, row: 5 },
        { label: 'WIN', width: 1.25, row: 5 },
        { label: 'ALT', width: 1.25, row: 5 },
        { label: 'SPACE', width: 6.25, row: 5 },
        { label: 'ALT', width: 1.25, row: 5 },
        { label: 'FN', width: 1.25, row: 5 },
        { label: 'CTRL', width: 1.25, row: 5 },
      ],
    ];

    let startY = 0.055;
    const rowSpacing = this.keyHeight + 0.002;

    for (let r = 0; r < layout.length; r++) {
      const row = layout[r];
      let startX = -0.185;

      for (const key of row) {
        if (key.label === '' && key.width === 0.5) {
          startX += key.width * this.keyUnit;
          continue;
        }

        const keyGeo = new THREE.BoxGeometry(
          key.width * this.keyUnit * 0.9,
          0.005,
          this.keyHeight * 0.9
        );
        const keyMesh = new THREE.Mesh(keyGeo, keyMat);
        keyMesh.position.set(
          startX + (key.width * this.keyUnit) / 2,
          0.018,
          startY - r * rowSpacing
        );
        this.group.add(keyMesh);

        startX += key.width * this.keyUnit;
      }
    }
  }
}
