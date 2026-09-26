import * as THREE from 'three';
import { ActiveTool, BuildingData, CellData, OverlayMode, ServiceType, Vehicle, ZoneType } from '../types/city';
import { CityManager, GRID_SIZE } from './cityGrid';

const MAX_VEHICLE_POOL = 45;
const MAX_PEDESTRIAN_POOL = 60;

export class ThreeSceneManager {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  // Lighting
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;

  // City reference
  private city: CityManager;

  // Object tracking groups
  private terrainGroup: THREE.Group;
  private roadGroup: THREE.Group;
  private buildingGroup: THREE.Group;
  private serviceGroup: THREE.Group;
  private vehicleGroup: THREE.Group;
  private pedestrianGroup: THREE.Group;
  private overlayGroup: THREE.Group;
  private particleGroup: THREE.Group;
  private foliageGroup: THREE.Group;
  private gatewayGroup: THREE.Group;

  // Interaction
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoverPlane: THREE.Mesh;
  private selectedTileMesh: THREE.LineSegments;
  public hoveredCoord: { x: number; z: number } | null = null;
  public selectedTileCoord: { x: number; z: number } | null = null;
  public onCellClicked?: (x: number, z: number) => void;
  public buildModeActive: boolean = true; // Build mode: taps/clicks build immediately
  public dragBuildMode: boolean = true; // Drag to paint roads/zones
  public placementMode: 'confirm' | 'rapid' = 'confirm'; // 'confirm' = safe click with checkbox, 'rapid' = continuous paint
  private lastBuiltCoord: { x: number; z: number } | null = null;

  // Camera state (Isometric Orbit)
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(GRID_SIZE / 2, 0, GRID_SIZE / 2);
  private cameraRadius: number = 36;
  private cameraTheta: number = Math.PI / 4;
  private cameraPhi: number = Math.PI / 3.4;

  // Touch & Pointer gesture tracking
  private isPointerDown: boolean = false;
  private isTwoFingerTouch: boolean = false;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchMovedDistance: number = 0;
  private lastTouchPos: { x: number; y: number } = { x: 0, y: 0 };
  private initialPinchDist: number = 0;
  private isRightDragging: boolean = false;

  // Materials & Geometries Cache
  private materials: Record<string, THREE.Material> = {};
  private sharedGeos: Record<string, THREE.BufferGeometry> = {};

  // Vehicle Object Pool (Lag Elimination)
  private vehiclePool: {
    group: THREE.Group;
    bodyMesh: THREE.Mesh;
    headlightMesh: THREE.Mesh;
    taillightMesh: THREE.Mesh;
  }[] = [];

  // Pedestrian Object Pool (Zero Allocation Lag Elimination)
  private pedestrianPool: {
    group: THREE.Group;
    bodyMesh: THREE.Mesh;
    headMesh: THREE.Mesh;
    legsMesh: THREE.Mesh;
  }[] = [];

  // Animated elements
  private windTurbineRotors: THREE.Object3D[] = [];
  private smokeParticles: { mesh: THREE.Mesh; initialY: number; speed: number }[] = [];

  // Night emissives & animated building lights
  private windowMaterials: THREE.MeshStandardMaterial[] = [];
  private streetLightMaterials: THREE.MeshStandardMaterial[] = [];
  private buildingLightMaterials: THREE.MeshStandardMaterial[] = [];
  private neonMaterials: THREE.MeshStandardMaterial[] = [];
  private antennaLights: { mesh: THREE.Mesh; baseIntensity: number }[] = [];
  private parkCitizens: THREE.Group[] = [];

  constructor(container: HTMLElement, city: CityManager) {
    this.container = container;
    this.city = city;

    // 1. Scene & Atmosphere (Minimal pastel aesthetic)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe8f2f8);
    this.scene.fog = new THREE.FogExp2(0xe8f2f8, 0.0065);

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 300);
    this.updateCameraTransform();

    // 3. Renderer with high performance & shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.10;
    container.appendChild(this.renderer.domElement);

    // 4. Warm Soft Isometric Lights
    this.ambientLight = new THREE.AmbientLight(0xfffdf7, 0.82);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xfefcf6, 0x93c5fd, 0.5);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff8ed, 1.3);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 130;
    const shadowD = 32;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);

    // 5. Scene Hierarchy Groups
    this.terrainGroup = new THREE.Group();
    this.roadGroup = new THREE.Group();
    this.buildingGroup = new THREE.Group();
    this.serviceGroup = new THREE.Group();
    this.vehicleGroup = new THREE.Group();
    this.pedestrianGroup = new THREE.Group();
    this.overlayGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();
    this.foliageGroup = new THREE.Group();
    this.gatewayGroup = new THREE.Group();

    this.scene.add(this.terrainGroup);
    this.scene.add(this.roadGroup);
    this.scene.add(this.buildingGroup);
    this.scene.add(this.serviceGroup);
    this.scene.add(this.vehicleGroup);
    this.scene.add(this.pedestrianGroup);
    this.scene.add(this.overlayGroup);
    this.scene.add(this.particleGroup);
    this.scene.add(this.foliageGroup);
    this.scene.add(this.gatewayGroup);

    // 6. Hover highlight cursor
    const hoverGeo = new THREE.PlaneGeometry(0.96, 0.96);
    hoverGeo.rotateX(-Math.PI / 2);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.hoverPlane = new THREE.Mesh(hoverGeo, hoverMat);
    this.hoverPlane.position.y = 0.04;
    this.hoverPlane.visible = false;
    this.scene.add(this.hoverPlane);

    // Selected tile highlight box
    const selBoxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 0.16, 1.02));
    const selBoxMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    this.selectedTileMesh = new THREE.LineSegments(selBoxGeo, selBoxMat);
    this.selectedTileMesh.visible = false;
    this.scene.add(this.selectedTileMesh);

    // 7. Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initSharedResources();
    this.initVehiclePool();
    this.initPedestrianPool();
    this.buildTerrain();
    this.buildFoliage();
    this.rebuildCityScene();

    this.bindTouchAndPointerEvents();
    this.startLoop();
  }

  private initSharedResources() {
    // Geometries
    this.sharedGeos.car = new THREE.BoxGeometry(0.18, 0.1, 0.32);
    this.sharedGeos.bus = new THREE.BoxGeometry(0.24, 0.16, 0.55);
    this.sharedGeos.headlight = new THREE.SphereGeometry(0.035, 4, 4);
    this.sharedGeos.taillight = new THREE.BoxGeometry(0.04, 0.03, 0.01);

    // Pedestrian Shared Geometries
    this.sharedGeos.pedHead = new THREE.SphereGeometry(0.045, 6, 6);
    this.sharedGeos.pedBody = new THREE.BoxGeometry(0.08, 0.09, 0.06);
    this.sharedGeos.pedLegs = new THREE.BoxGeometry(0.07, 0.07, 0.05);

    // Shared Building Geometries
    this.sharedGeos.cube1 = new THREE.BoxGeometry(0.72, 0.75, 0.72);
    this.sharedGeos.cube2 = new THREE.BoxGeometry(0.75, 1.3, 0.75);
    this.sharedGeos.cube3 = new THREE.BoxGeometry(0.78, 2.0, 0.78);
    this.sharedGeos.cube4 = new THREE.BoxGeometry(0.8, 2.8, 0.8);
    this.sharedGeos.silo = new THREE.CylinderGeometry(0.16, 0.16, 0.75, 10);
    this.sharedGeos.chimney = new THREE.CylinderGeometry(0.06, 0.08, 1.0, 6);

    // Pastel Terrain Materials
    this.materials.grass = new THREE.MeshStandardMaterial({ color: 0x9ecd9f, roughness: 0.95 });
    this.materials.sand = new THREE.MeshStandardMaterial({ color: 0xf5ebd0, roughness: 0.95 });
    this.materials.water = new THREE.MeshStandardMaterial({
      color: 0x76c5db,
      roughness: 0.15,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88,
    });

    // Pastel Clean Road Materials
    this.materials.asphalt = new THREE.MeshStandardMaterial({ color: 0x505d6e, roughness: 0.8 });
    this.materials.highwayAsphalt = new THREE.MeshStandardMaterial({ color: 0x414d5e, roughness: 0.75 });
    this.materials.roadLine = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.materials.crosswalk = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.materials.highwayYellow = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    this.materials.sidewalk = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
    this.materials.curb = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.9 });

    // 1. Residential Palette: Warm community neighborhood tones (terracotta, cream, mint, sage, blush, cedar wood)
    this.materials.resMint = new THREE.MeshStandardMaterial({ color: 0xa7f3d0, roughness: 0.65 });
    this.materials.resCream = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.65 });
    this.materials.resBlush = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.65 });
    this.materials.resLavender = new THREE.MeshStandardMaterial({ color: 0xe9d5ff, roughness: 0.65 });
    this.materials.resPowder = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.65 });
    this.materials.resTerracotta = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
    this.materials.resSage = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.7 });
    this.materials.resWood = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
    this.materials.resDarkWood = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    this.materials.resParapet = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    this.materials.resBrickChimney = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
    this.materials.resPlanter = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
    this.materials.resFlower1 = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
    this.materials.resFlower2 = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    // 2. Commercial Palette: Vibrant shopping street tones (peach coral, sunny butter, teal, candy striped awnings, neon)
    this.materials.comPeach = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.55 });
    this.materials.comButter = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.55 });
    this.materials.comCoral = new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.55 });
    this.materials.comTeal = new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.55 });
    this.materials.comTurquoise = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.55 });
    this.materials.comStucco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    this.materials.comGlass = new THREE.MeshStandardMaterial({
      color: 0xc7d2fe,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.85,
    });
    this.materials.comAwningRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    this.materials.comAwningWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    this.materials.comAwningBlue = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 });
    this.materials.comAwningYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
    this.materials.comNeonPink = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xf43f5e,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });
    this.neonMaterials.push(this.materials.comNeonPink as THREE.MeshStandardMaterial);
    this.materials.comNeonCyan = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });
    this.neonMaterials.push(this.materials.comNeonCyan as THREE.MeshStandardMaterial);
    this.materials.comNeonYellow = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xfacc15,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });
    this.neonMaterials.push(this.materials.comNeonYellow as THREE.MeshStandardMaterial);

    // 3. Industrial Palette: Heavy factory & manufacturing tones (brick russet, iron slate, caution yellow, pipes)
    this.materials.indBrick = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 });
    this.materials.indSlate = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
    this.materials.indCharcoal = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 });
    this.materials.indCautionYellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
    this.materials.indMintSilo = new THREE.MeshStandardMaterial({ color: 0x6ee7b7, roughness: 0.4, metalness: 0.25 });
    this.materials.indPipe = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.35, metalness: 0.5 });
    this.materials.indSolar = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.7 });
    this.materials.indCrate = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
    this.materials.indCargoRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
    this.materials.indCargoBlue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });

    // 4. Office Palette: High-tech corporate high-rise tones (deep sapphire, titanium silver, obsidian, helipad)
    this.materials.officeGlass = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.9,
    });
    this.materials.officeDeepGlass = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.12,
      metalness: 0.55,
      transparent: true,
      opacity: 0.92,
    });
    this.materials.officeDarkGlass = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.7 });
    this.materials.officeFrame = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.2 });
    this.materials.officeDarkFrame = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    this.materials.officeGold = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6 });
    this.materials.officeHelipad = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8 });
    this.materials.officeAntenna = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });

    // Warm Ambient Windows with dynamic night glow
    this.materials.windowLit = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });
    this.windowMaterials.push(this.materials.windowLit as THREE.MeshStandardMaterial);

    this.materials.windowOfficeLit = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
      roughness: 0.25,
    });
    this.windowMaterials.push(this.materials.windowOfficeLit as THREE.MeshStandardMaterial);

    this.materials.storefrontLit = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xfb923c,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });
    this.buildingLightMaterials.push(this.materials.storefrontLit as THREE.MeshStandardMaterial);

    this.materials.headlight = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    this.materials.taillight = new THREE.MeshBasicMaterial({ color: 0xf87171 });
    this.materials.brakeLight = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Pedestrian Materials
    this.materials.pedSkin = new THREE.MeshStandardMaterial({ color: 0xfbd0b8, roughness: 0.8 });
    this.materials.pedPants = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });

    // Weathered & Dimmed Abandoned Building Materials (Preserves model structure in dim colors)
    this.materials.abandonedWall = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
    this.materials.abandonedTrim = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.98 });
    this.materials.abandonedWood = new THREE.MeshStandardMaterial({ color: 0x3f352e, roughness: 0.98 });
    this.materials.abandonedGlass = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.1 });
    this.materials.abandonedSign = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 });
  }

  // Pre-instantiated vehicle pool for zero-allocation performance
  private initVehiclePool() {
    this.vehicleGroup.clear();
    this.vehiclePool = [];

    const carGeo = this.sharedGeos.car;
    const hlGeo = this.sharedGeos.headlight;
    const tlGeo = this.sharedGeos.taillight;

    for (let i = 0; i < MAX_VEHICLE_POOL; i++) {
      const vGroup = new THREE.Group();
      vGroup.visible = false;

      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
      const bodyMesh = new THREE.Mesh(carGeo, bodyMat);
      bodyMesh.castShadow = true;
      vGroup.add(bodyMesh);

      // Headlight
      const hl = new THREE.Mesh(hlGeo, this.materials.headlight);
      hl.position.set(0, 0.04, 0.18);
      vGroup.add(hl);

      // Taillight
      const tl = new THREE.Mesh(tlGeo, this.materials.taillight);
      tl.position.set(0, 0.04, -0.17);
      vGroup.add(tl);

      this.vehicleGroup.add(vGroup);
      this.vehiclePool.push({
        group: vGroup,
        bodyMesh,
        headlightMesh: hl,
        taillightMesh: tl,
      });
    }
  }

  // Pre-instantiated pedestrian pool for zero-allocation walking citizens
  private initPedestrianPool() {
    this.pedestrianGroup.clear();
    this.pedestrianPool = [];

    for (let i = 0; i < MAX_PEDESTRIAN_POOL; i++) {
      const pGroup = new THREE.Group();
      pGroup.visible = false;

      // Legs / Pants
      const legs = new THREE.Mesh(this.sharedGeos.pedLegs, this.materials.pedPants);
      legs.position.y = 0.035;
      legs.castShadow = true;
      pGroup.add(legs);

      // Shirt / Torso
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 });
      const body = new THREE.Mesh(this.sharedGeos.pedBody, bodyMat);
      body.position.y = 0.105;
      body.castShadow = true;
      pGroup.add(body);

      // Head
      const head = new THREE.Mesh(this.sharedGeos.pedHead, this.materials.pedSkin);
      head.position.y = 0.18;
      head.castShadow = true;
      pGroup.add(head);

      this.pedestrianGroup.add(pGroup);
      this.pedestrianPool.push({
        group: pGroup,
        bodyMesh: body,
        headMesh: head,
        legsMesh: legs,
      });
    }
  }

  public buildTerrain() {
    this.terrainGroup.clear();

    const tileGeo = new THREE.BoxGeometry(1, 0.35, 1);
    tileGeo.translate(0, -0.175, 0);

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.city.grid[x][z];
        let mat = this.materials.grass;
        let yOffset = 0;

        if (cell.terrain === 'water') {
          mat = this.materials.water;
          yOffset = -0.12;
        } else if (cell.terrain === 'sand') {
          mat = this.materials.sand;
          yOffset = -0.04;
        }

        const tileMesh = new THREE.Mesh(tileGeo, mat);
        tileMesh.position.set(x + 0.5, yOffset, z + 0.5);
        tileMesh.receiveShadow = true;
        this.terrainGroup.add(tileMesh);
      }
    }

    // Outer bedrock foundation
    const baseGeo = new THREE.BoxGeometry(GRID_SIZE + 4, 1.8, GRID_SIZE + 4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(GRID_SIZE / 2, -1.1, GRID_SIZE / 2);
    baseMesh.receiveShadow = true;
    this.terrainGroup.add(baseMesh);
  }

  public buildFoliage() {
    this.foliageGroup.clear();

    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.4, 5);
    trunkGeo.translate(0, 0.2, 0);
    const foliageGeo = new THREE.ConeGeometry(0.32, 0.7, 5);
    foliageGeo.translate(0, 0.65, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.city.grid[x][z];
        if (cell.terrain === 'grass' && !cell.road && !cell.building && !cell.service) {
          const noise = Math.sin(x * 0.45) * Math.cos(z * 0.45);
          if (noise > 0.48 && Math.random() < 0.6) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            const leaves = new THREE.Mesh(foliageGeo, leavesMat);
            trunk.castShadow = true;
            leaves.castShadow = true;
            tree.add(trunk);
            tree.add(leaves);

            const scale = 0.7 + Math.random() * 0.4;
            tree.scale.set(scale, scale, scale);
            tree.position.set(x + 0.5 + (Math.random() - 0.5) * 0.4, 0, z + 0.5 + (Math.random() - 0.5) * 0.4);
            this.foliageGroup.add(tree);
          }
        }
      }
    }
  }

  public rebuildCityScene() {
    this.roadGroup.clear();
    this.buildingGroup.clear();
    this.serviceGroup.clear();
    this.overlayGroup.clear();
    this.gatewayGroup.clear();
    this.particleGroup.clear();
    this.windTurbineRotors = [];
    this.smokeParticles = [];
    this.windowMaterials = [];
    this.streetLightMaterials = [];
    this.buildingLightMaterials = [];
    this.neonMaterials = [];
    this.antennaLights = [];
    this.parkCitizens = [];

    // Render Highway Gateway Arch
    this.createHighwayGatewaySign();

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.city.grid[x][z];

        if (cell.road) {
          this.createRoadMesh(x, z, cell);
        }

        if (cell.zone && !cell.building && !cell.service && !cell.road) {
          this.createZoneMarker(x, z, cell.zone);
        }

        if (cell.building) {
          this.createGeometricBuildingMesh(x, z, cell);
        }

        if (cell.service) {
          this.createServiceMesh(x, z, cell);
        }

        if (this.city.overlayMode !== 'none') {
          this.createOverlayTile(x, z, cell);
        }
      }
    }
  }

  // Highway Arch & Overhead Signs at the border
  private createHighwayGatewaySign() {
    const portal = this.city.highwayPortalCoord;
    const archGroup = new THREE.Group();
    archGroup.position.set(portal.x + 0.5, 0, portal.z + 0.5);

    // Twin support pillars
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-0.65, 1.1, 0);
    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.set(0.65, 1.1, 0);
    archGroup.add(postL);
    archGroup.add(postR);

    // Overhead truss beam
    const beamGeo = new THREE.BoxGeometry(1.4, 0.18, 0.2);
    const beam = new THREE.Mesh(beamGeo, postMat);
    beam.position.set(0, 2.1, 0);
    archGroup.add(beam);

    // Green highway sign board
    const signGeo = new THREE.BoxGeometry(1.2, 0.45, 0.05);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.4, 0.05);
    archGroup.add(sign);

    // Direction arrows
    const arrowIn = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.2, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    arrowIn.position.set(-0.35, 2.38, 0.09);
    arrowIn.rotation.z = Math.PI;
    archGroup.add(arrowIn);

    const arrowOut = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.2, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    arrowOut.position.set(0.35, 2.38, 0.09);
    archGroup.add(arrowOut);

    this.gatewayGroup.add(archGroup);
  }

  // 100% Continuous, Gap-Free Road Mesh with Seamless Connections & Crosswalks
  private createRoadMesh(x: number, z: number, cell: CellData) {
    const isBridge = cell.terrain === 'water';
    const isHwy = cell.road!.type === 'highway';
    const roadGroup = new THREE.Group();
    roadGroup.position.set(x + 0.5, isBridge ? 0.22 : 0.015, z + 0.5);

    const roadWidth = isHwy ? 0.94 : cell.road!.type === 'avenue' ? 0.88 : 0.78;
    const asphaltMat = isHwy ? this.materials.highwayAsphalt : this.materials.asphalt;

    // 1. Continuous Sidewalk Sub-base (Full 1.0 x 1.0 tile to prevent any ground gap)
    if (!isHwy) {
      const swGeo = new THREE.BoxGeometry(1.0, 0.02, 1.0);
      const swMesh = new THREE.Mesh(swGeo, this.materials.sidewalk);
      swMesh.position.y = -0.01;
      swMesh.receiveShadow = true;
      roadGroup.add(swMesh);
    }

    // 2. Central Road Core
    const coreGeo = new THREE.BoxGeometry(roadWidth, 0.03, roadWidth);
    const coreMesh = new THREE.Mesh(coreGeo, asphaltMat);
    coreMesh.receiveShadow = true;
    roadGroup.add(coreMesh);

    // 3. Continuous Road Arms Extending to Borders
    const conn = cell.road!.connections;
    const armThickness = 0.03;

    if (conn.north) {
      const armGeo = new THREE.BoxGeometry(roadWidth, armThickness, 0.5);
      const arm = new THREE.Mesh(armGeo, asphaltMat);
      arm.position.set(0, 0, -0.25);
      arm.receiveShadow = true;
      roadGroup.add(arm);
    }
    if (conn.south) {
      const armGeo = new THREE.BoxGeometry(roadWidth, armThickness, 0.5);
      const arm = new THREE.Mesh(armGeo, asphaltMat);
      arm.position.set(0, 0, 0.25);
      arm.receiveShadow = true;
      roadGroup.add(arm);
    }
    if (conn.east) {
      const armGeo = new THREE.BoxGeometry(0.5, armThickness, roadWidth);
      const arm = new THREE.Mesh(armGeo, asphaltMat);
      arm.position.set(0.25, 0, 0);
      arm.receiveShadow = true;
      roadGroup.add(arm);
    }
    if (conn.west) {
      const armGeo = new THREE.BoxGeometry(0.5, armThickness, roadWidth);
      const arm = new THREE.Mesh(armGeo, asphaltMat);
      arm.position.set(-0.25, 0, 0);
      arm.receiveShadow = true;
      roadGroup.add(arm);
    }

    // If isolated road without connections, extend in N-S direction so it looks clean
    const hasAnyConn = conn.north || conn.south || conn.east || conn.west;
    if (!hasAnyConn) {
      const isoArmGeo = new THREE.BoxGeometry(roadWidth, armThickness, 1.0);
      const isoArm = new THREE.Mesh(isoArmGeo, asphaltMat);
      roadGroup.add(isoArm);
    }

    // 4. Continuous Road Markings
    const lineMat = isHwy ? this.materials.highwayYellow : this.materials.roadLine;
    const isStraightNS = (conn.north || conn.south) && !conn.east && !conn.west;
    const isStraightEW = (conn.east || conn.west) && !conn.north && !conn.south;
    const numConnections = (conn.north ? 1 : 0) + (conn.south ? 1 : 0) + (conn.east ? 1 : 0) + (conn.west ? 1 : 0);

    if (isStraightNS || !hasAnyConn) {
      for (const zOffset of [-0.3, 0, 0.3]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.032, 0.18), lineMat);
        stripe.position.set(0, 0.005, zOffset);
        roadGroup.add(stripe);
      }
    } else if (isStraightEW) {
      for (const xOffset of [-0.3, 0, 0.3]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.032, 0.04), lineMat);
        stripe.position.set(xOffset, 0.005, 0);
        roadGroup.add(stripe);
      }
    } else if (numConnections >= 3) {
      // Intersection (T-Junction or 4-Way Crossroad): add cute chalk-white pedestrian zebra crosswalks!
      const addZebra = (dx: number, dz: number, rotY: number) => {
        const zebraGroup = new THREE.Group();
        zebraGroup.position.set(dx, 0.006, dz);
        zebraGroup.rotation.y = rotY;
        for (let i = -2; i <= 2; i++) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.031, 0.025), this.materials.crosswalk);
          bar.position.set(0, 0, i * 0.06);
          zebraGroup.add(bar);
        }
        roadGroup.add(zebraGroup);
      };

      if (conn.north) addZebra(0, -0.36, 0);
      if (conn.south) addZebra(0, 0.36, 0);
      if (conn.east) addZebra(0.36, 0, Math.PI / 2);
      if (conn.west) addZebra(-0.36, 0, Math.PI / 2);
    } else if (numConnections === 2) {
      const bendGeo = new THREE.RingGeometry(0.16, 0.20, 8, 1, 0, Math.PI / 2);
      bendGeo.rotateX(-Math.PI / 2);
      const bend = new THREE.Mesh(bendGeo, lineMat);
      bend.position.y = 0.02;
      if (conn.north && conn.east) bend.rotation.y = Math.PI;
      else if (conn.north && conn.west) bend.rotation.y = Math.PI / 2;
      else if (conn.south && conn.east) bend.rotation.y = -Math.PI / 2;
      else if (conn.south && conn.west) bend.rotation.y = 0;
      roadGroup.add(bend);
    }

    // 5. Bridge Piers & Railings if spanning river
    if (isBridge) {
      const pierGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.5, 6);
      const pierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
      const pier1 = new THREE.Mesh(pierGeo, pierMat);
      pier1.position.set(-0.36, -0.25, 0);
      const pier2 = new THREE.Mesh(pierGeo, pierMat);
      pier2.position.set(0.36, -0.25, 0);
      roadGroup.add(pier1);
      roadGroup.add(pier2);

      const railGeo = new THREE.BoxGeometry(0.04, 0.08, 1.0);
      const railMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
      const railL = new THREE.Mesh(railGeo, railMat);
      railL.position.set(-roadWidth / 2 - 0.02, 0.06, 0);
      const railR = new THREE.Mesh(railGeo, railMat);
      railR.position.set(roadWidth / 2 + 0.02, 0.06, 0);
      roadGroup.add(railL);
      roadGroup.add(railR);
    }

    // Street lamp
    if ((x + z) % 4 === 0 && !isHwy && !isBridge) {
      const lamp = this.createStreetLamp();
      lamp.position.set(0.44, 0, 0.44);
      roadGroup.add(lamp);
    }

    this.roadGroup.add(roadGroup);
  }

  private createStreetLamp(): THREE.Group {
    const lamp = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 0.25;
    lamp.add(post);

    const headGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffe28a,
      emissiveIntensity: 0.9,
    });
    this.streetLightMaterials.push(bulbMat);
    const head = new THREE.Mesh(headGeo, bulbMat);
    head.position.set(0, 0.5, 0);
    lamp.add(head);
    return lamp;
  }

  private createZoneMarker(x: number, z: number, zone: ZoneType) {
    const markerGeo = new THREE.PlaneGeometry(0.92, 0.92);
    markerGeo.rotateX(-Math.PI / 2);

    let color = 0xa7f3d0;
    if (zone === 'commercial') color = 0xfed7aa;
    else if (zone === 'industrial') color = 0x94a3b8;
    else if (zone === 'office') color = 0x7dd3fc;

    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 });
    const mesh = new THREE.Mesh(markerGeo, mat);
    mesh.position.set(x + 0.5, 0.02, z + 0.5);
    this.overlayGroup.add(mesh);
  }

  // Separate, Very Cute Pastel 3D Building Models (NO HIP ROOFS! Clean Minimal Details)
  private createGeometricBuildingMesh(x: number, z: number, cell: CellData) {
    const b = cell.building!;
    const group = new THREE.Group();
    group.position.set(x + 0.5, 0, z + 0.5);

    // Apply diverse orientation
    if (b.rotation !== undefined) {
      group.rotation.y = b.rotation;
    } else {
      group.rotation.y = ((b.styleSeed % 4) * Math.PI) / 2;
    }

    const actualHeight = Math.max(0.65, b.height);

    if (b.zone === 'residential') {
      this.createCuteResidentialMesh(b, actualHeight, group);
    } else if (b.zone === 'commercial') {
      this.createCuteCommercialMesh(b, actualHeight, group);
    } else if (b.zone === 'industrial') {
      this.createCuteIndustrialMesh(b, actualHeight, group, x, z);
    } else if (b.zone === 'office') {
      this.createCuteOfficeMesh(b, actualHeight, group);
    }

    // Add distinctive architectural tops on upgraded buildings!
    this.addBuildingUpgradeTop(b, actualHeight, group);

    this.buildingGroup.add(group);
  }

  // Citizen figures that gather in parks
  private createParkCitizen(x: number, y: number, z: number, shirtColorHex: number, isSitting = false): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Legs / Pants
    const legGeo = new THREE.BoxGeometry(0.06, isSitting ? 0.04 : 0.07, 0.05);
    const legs = new THREE.Mesh(legGeo, this.materials.pedPants);
    legs.position.y = isSitting ? 0.02 : 0.035;
    group.add(legs);

    // Body with colorful shirt
    const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColorHex, roughness: 0.7 });
    const bodyGeo = new THREE.BoxGeometry(0.07, 0.08, 0.05);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = isSitting ? 0.07 : 0.095;
    group.add(body);

    // Head
    const head = new THREE.Mesh(this.sharedGeos.pedHead, this.materials.pedSkin);
    head.position.y = isSitting ? 0.13 : 0.155;
    group.add(head);

    this.parkCitizens.push(group);
    return group;
  }

  // 1. Cute Scandinavian & Japanese Minimal Residential (Warm community palette: terracotta, cream, mint, sage, wood)
  private createCuteResidentialMesh(b: BuildingData, h: number, group: THREE.Group) {
    const isAb = b.isAbandoned;
    const resPalettes = [
      this.materials.resTerracotta,
      this.materials.resCream,
      this.materials.resMint,
      this.materials.resSage,
      this.materials.resBlush,
      this.materials.resPowder,
      this.materials.resLavender,
    ];
    const wallMat = isAb ? this.materials.abandonedWall : resPalettes[b.styleSeed % resPalettes.length];
    const parapetMat = isAb ? this.materials.abandonedTrim : this.materials.resParapet;
    const woodMat = isAb ? this.materials.abandonedWood : this.materials.resWood;
    const darkWoodMat = isAb ? this.materials.abandonedWood : this.materials.resDarkWood;
    const modelStyle = b.styleSeed % 4;

    if (b.level <= 2) {
      if (modelStyle === 1) {
        // Model Style 1: Split-level Modern Villa with Pergola, Balcony & Sun Lounger
        const mainW = 0.70;
        const mainH = Math.min(1.0, h * 0.82);
        const mainD = 0.50;

        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(mainW, mainH, mainD), wallMat);
        mainBody.position.set(0, mainH / 2, -0.06);
        mainBody.castShadow = true;
        group.add(mainBody);

        // Side wing block
        const wingW = 0.36;
        const wingH = mainH * 0.65;
        const wingD = 0.32;
        const wing = new THREE.Mesh(new THREE.BoxGeometry(wingW, wingH, wingD), wallMat);
        wing.position.set(-0.16, wingH / 2, 0.2);
        wing.castShadow = true;
        group.add(wing);

        // Wooden Pergola Carport / Entry
        const perg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.22), woodMat);
        perg.position.set(0.18, wingH + 0.02, 0.16);
        group.add(perg);

        // Pergola timber support posts
        const postGeo = new THREE.CylinderGeometry(0.015, 0.015, wingH, 4);
        const p1 = new THREE.Mesh(postGeo, woodMat);
        p1.position.set(0.32, wingH / 2, 0.24);
        group.add(p1);

        // Balcony on 2nd tier
        const balc = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.14), darkWoodMat);
        balc.position.set(-0.16, wingH + 0.07, 0.24);
        group.add(balc);

        // Parapet trims
        const parapet = new THREE.Mesh(new THREE.BoxGeometry(mainW + 0.03, 0.04, mainD + 0.03), parapetMat);
        parapet.position.set(0, mainH + 0.02, -0.06);
        group.add(parapet);

        // Front hedge
        if (!isAb) {
          const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.06), this.materials.resPlanter);
          hedge.position.set(0.18, 0.04, 0.32);
          group.add(hedge);
        }

        this.addGeometricWindows(group, mainW, mainH, mainD, 1, isAb);
      } else if (modelStyle === 2) {
        // Model Style 2: Two-story Contemporary Townhouse with Bay Window, Brick Chimney & Deck
        const bodyW = 0.66;
        const bodyH = Math.min(1.15, h * 0.88);
        const bodyD = 0.66;

        const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), wallMat);
        body.position.y = bodyH / 2;
        body.castShadow = true;
        group.add(body);

        // Projecting 2nd floor bay window
        const bay = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.35, 0.10), woodMat);
        bay.position.set(0, bodyH * 0.65, bodyD / 2 + 0.05);
        group.add(bay);

        // Brick chimney stack
        const chim = new THREE.Mesh(new THREE.BoxGeometry(0.12, bodyH + 0.18, 0.12), this.materials.resBrickChimney);
        chim.position.set(-bodyW / 2 + 0.06, (bodyH + 0.18) / 2, -bodyD / 2 + 0.06);
        chim.castShadow = true;
        group.add(chim);

        // Rooftop sundeck with wooden railing
        const deck = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.36), woodMat);
        deck.position.set(0.1, bodyH + 0.02, 0.1);
        group.add(deck);

        // Parapet top
        const parapet = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.04, 0.05, bodyD + 0.04), parapetMat);
        parapet.position.y = bodyH + 0.025;
        group.add(parapet);

        this.addGeometricWindows(group, bodyW, bodyH, bodyD, 2, isAb);
      } else if (modelStyle === 3) {
        // Model Style 3: Cozy Craftsman Bungalow with Porch & Chimney
        const bodyW = 0.70;
        const bodyH = Math.min(0.95, h * 0.78);
        const bodyD = 0.68;

        const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), wallMat);
        body.position.y = bodyH / 2;
        body.castShadow = true;
        group.add(body);

        // Covered front porch with wooden posts
        const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.20), darkWoodMat);
        porchRoof.position.set(0, bodyH * 0.55, bodyD / 2 + 0.10);
        group.add(porchRoof);

        const postGeo = new THREE.CylinderGeometry(0.015, 0.015, bodyH * 0.55, 4);
        const p1 = new THREE.Mesh(postGeo, woodMat);
        p1.position.set(-0.18, bodyH * 0.275, bodyD / 2 + 0.18);
        const p2 = new THREE.Mesh(postGeo, woodMat);
        p2.position.set(0.18, bodyH * 0.275, bodyD / 2 + 0.18);
        group.add(p1);
        group.add(p2);

        // Front steps
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.12), parapetMat);
        step.position.set(0, 0.02, bodyD / 2 + 0.18);
        group.add(step);

        // Brick chimney
        const chim = new THREE.Mesh(new THREE.BoxGeometry(0.12, bodyH + 0.2, 0.12), this.materials.resBrickChimney);
        chim.position.set(bodyW / 2 - 0.06, (bodyH + 0.2) / 2, 0);
        group.add(chim);

        // Parapet top
        const parapet = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.04, 0.05, bodyD + 0.04), parapetMat);
        parapet.position.y = bodyH + 0.025;
        group.add(parapet);

        this.addGeometricWindows(group, bodyW, bodyH, bodyD, 1, isAb);
      } else {
        // Model Style 0: Cute Scandinavian Minimal Cube with Entry Step, Planters & Mailbox
        const bodyH = Math.min(1.05, h * 0.85);
        const bodyW = 0.68;
        const bodyD = 0.68;

        const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), wallMat);
        body.position.y = bodyH / 2;
        body.castShadow = true;
        group.add(body);

        // Flat Roof with Parapet
        const parapet = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.04, 0.05, bodyD + 0.04), parapetMat);
        parapet.position.y = bodyH + 0.025;
        group.add(parapet);

        // Entry Step & Door
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.12), woodMat);
        step.position.set(0, 0.02, bodyD / 2 + 0.06);
        group.add(step);

        const door = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.02), darkWoodMat);
        door.position.set(0, 0.16, bodyD / 2 + 0.005);
        group.add(door);

        if (!isAb) {
          // Living Planter Box
          const planter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.08), woodMat);
          planter.position.set(0.18, 0.22, bodyD / 2 + 0.04);
          group.add(planter);

          const flower1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), this.materials.resFlower1);
          flower1.position.set(0.14, 0.27, bodyD / 2 + 0.04);
          group.add(flower1);

          const flower2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), this.materials.resFlower2);
          flower2.position.set(0.22, 0.27, bodyD / 2 + 0.04);
          group.add(flower2);

          // Front mailbox post
          const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4), darkWoodMat);
          mbPost.position.set(-0.28, 0.11, bodyD / 2 + 0.12);
          const mbBox = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.09), parapetMat);
          mbBox.position.set(-0.28, 0.22, bodyD / 2 + 0.12);
          group.add(mbPost);
          group.add(mbBox);
        }

        this.addGeometricWindows(group, bodyW, bodyH, bodyD, b.level, isAb);
      }
    } else {
      // Cute Multi-Tier Pastel Urban Apartments (Level 3-5)
      const baseH = h * 0.58;
      const baseW = 0.74;
      const baseD = 0.74;
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), wallMat);
      baseMesh.position.y = baseH / 2;
      baseMesh.castShadow = true;
      group.add(baseMesh);

      // Stepped Top Block
      const topMat = isAb ? this.materials.abandonedWall : resPalettes[(b.styleSeed + 1) % resPalettes.length];
      const topH = h * 0.42;
      const topW = 0.56;
      const topD = 0.56;
      const topMesh = new THREE.Mesh(new THREE.BoxGeometry(topW, topH, topD), topMat);
      topMesh.position.set(0.06, baseH + topH / 2, 0.06);
      topMesh.castShadow = true;
      group.add(topMesh);

      // Rooftop terrace garden on the setback
      if (!isAb) {
        const garden = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.28), this.materials.resPlanter);
        garden.position.set(-0.18, baseH + 0.02, -0.18);
        group.add(garden);

        const treePuff = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 5), this.materials.resPlanter);
        treePuff.position.set(-0.18, baseH + 0.12, -0.18);
        group.add(treePuff);

        // Glass balcony railings on 2nd and 3rd floors
        const balcGeo = new THREE.BoxGeometry(0.42, 0.12, 0.06);
        const balc1 = new THREE.Mesh(balcGeo, this.materials.comGlass);
        balc1.position.set(0.06, baseH * 0.7, baseD / 2 + 0.03);
        group.add(balc1);
      }

      // Flat roof parapets
      const topParapet = new THREE.Mesh(new THREE.BoxGeometry(topW + 0.04, 0.04, topD + 0.04), parapetMat);
      topParapet.position.set(0.06, baseH + topH + 0.02, 0.06);
      group.add(topParapet);

      this.addGeometricWindows(group, baseW, baseH, baseD, 2, isAb);
      this.addGeometricWindows(group, topW, topH, topD, 2, isAb);
    }

    if (isAb) {
      this.addAbandonedDetails(group, 0.7, 0.3);
    }
  }

  // 2. Vibrant Commercial (Storefront display window, cute striped canopy, rooftop patio, neon signs)
  private createCuteCommercialMesh(b: BuildingData, h: number, group: THREE.Group) {
    const isAb = b.isAbandoned;
    const comMats = [
      this.materials.comPeach,
      this.materials.comButter,
      this.materials.comCoral,
      this.materials.comTeal,
      this.materials.comTurquoise,
    ];
    const wallMat = isAb ? this.materials.abandonedWall : comMats[b.styleSeed % comMats.length];
    const glassMat = isAb ? this.materials.abandonedGlass : this.materials.comGlass;
    const woodMat = isAb ? this.materials.abandonedWood : this.materials.resWood;
    const style = b.styleSeed % 4;

    const bodyW = 0.74;
    const bodyD = 0.74;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, h, bodyD), wallMat);
    body.position.y = h / 2;
    body.castShadow = true;
    group.add(body);

    // Large glazed shopfront window on ground floor with warm illumination
    const windowGeo = new THREE.BoxGeometry(bodyW * 0.85, 0.32, 0.03);
    const shopWindow = new THREE.Mesh(windowGeo, isAb ? this.materials.abandonedGlass : this.materials.storefrontLit);
    shopWindow.position.set(0, 0.22, bodyD / 2 + 0.015);
    group.add(shopWindow);

    if (!isAb) {
      // 1. Striped fabric canopy awning over shopfront
      const awW = bodyW * 0.88;
      const awD = 0.22;
      const awH = 0.04;
      const awGroup = new THREE.Group();
      awGroup.position.set(0, 0.42, bodyD / 2 + awD / 2);

      const numStripes = 6;
      const stripeW = awW / numStripes;
      const isRedStripes = (b.styleSeed % 2 === 0);
      for (let i = 0; i < numStripes; i++) {
        let stripeMat = i % 2 === 0
          ? (isRedStripes ? this.materials.comAwningRed : this.materials.comAwningBlue)
          : (isRedStripes ? this.materials.comAwningWhite : this.materials.comAwningYellow);
        const stripeMesh = new THREE.Mesh(new THREE.BoxGeometry(stripeW, awH, awD), stripeMat);
        stripeMesh.position.x = -awW / 2 + (i + 0.5) * stripeW;
        awGroup.add(stripeMesh);
      }
      group.add(awGroup);

      if (style === 0) {
        // Style 0: Cafe / Bakery with outdoor sidewalk tables and A-frame menu chalkboard
        const menuStand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.08), woodMat);
        menuStand.position.set(0.38, 0.08, bodyD / 2 + 0.14);
        group.add(menuStand);

        // Cafe table & parasol on rooftop patio
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 4), woodMat);
        pole.position.set(-0.15, h + 0.16, -0.15);
        group.add(pole);

        const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.07, 6), this.materials.comAwningRed);
        umbrella.position.set(-0.15, h + 0.32, -0.15);
        group.add(umbrella);

        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 6), woodMat);
        table.position.set(-0.15, h + 0.06, -0.15);
        group.add(table);
      } else if (style === 1) {
        // Style 1: Boutique Showroom with 3D illuminated neon logo cube & bike rack
        const logoCube = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.08), this.materials.comNeonPink);
        logoCube.position.set(0, h * 0.72, bodyD / 2 + 0.05);
        group.add(logoCube);

        // Bike rack with mini bicycle
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.03), this.materials.indPipe);
        rack.position.set(-0.36, 0.05, bodyD / 2 + 0.14);
        group.add(rack);

        // Rooftop AC chiller
        const ac = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.22), this.materials.indSlate);
        ac.position.set(0.15, h + 0.08, 0.15);
        group.add(ac);
      } else if (style === 2) {
        // Style 2: Fresh Market / Grocer with sidewalk crates & neon roof trim
        const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.12), this.materials.indCrate);
        crate1.position.set(0.36, 0.05, bodyD / 2 + 0.12);
        const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.10), this.materials.indCrate);
        crate2.position.set(0.36, 0.14, bodyD / 2 + 0.12);
        group.add(crate1);
        group.add(crate2);

        // Vibrant neon roof accent trim
        const neonTrim = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.02, 0.04, 0.04), this.materials.comNeonCyan);
        neonTrim.position.set(0, h + 0.02, bodyD / 2);
        group.add(neonTrim);
      } else {
        // Style 3: Urban Bistro with rooftop fairy umbrella & string sign
        const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.04), this.materials.comNeonYellow);
        signBoard.position.set(0, h * 0.78, bodyD / 2 + 0.03);
        group.add(signBoard);

        const ac = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.2), this.materials.indSlate);
        ac.position.set(-0.15, h + 0.07, -0.15);
        group.add(ac);
      }
    }

    // Upper floor windows with warm night glow
    this.addGeometricWindows(group, bodyW, h, bodyD, Math.max(1, b.level), isAb);

    if (isAb) {
      this.addAbandonedDetails(group, bodyW, bodyD / 2);
    }
  }

  // 3. Heavy-Duty Industrial (Brick russet, corrugated iron slate, silos, pipes, shipping containers, steam)
  private createCuteIndustrialMesh(b: BuildingData, h: number, group: THREE.Group, x: number, z: number) {
    const isAb = b.isAbandoned;
    const mainH = Math.min(1.2, h * 0.75);
    const mainW = 0.76;
    const mainD = 0.76;
    const style = b.styleSeed % 4;

    const bodyMat = isAb
      ? this.materials.abandonedWall
      : style === 0
      ? this.materials.indBrick
      : style === 1
      ? this.materials.indSlate
      : this.materials.indCharcoal;

    const body = new THREE.Mesh(new THREE.BoxGeometry(mainW, mainH, mainD), bodyMat);
    body.position.y = mainH / 2;
    body.castShadow = true;
    group.add(body);

    // Saw-tooth skylight monitor roof
    const roofSaw = new THREE.Mesh(new THREE.BoxGeometry(mainW, 0.12, mainD / 2), isAb ? this.materials.abandonedTrim : this.materials.indSlate);
    roofSaw.position.set(0, mainH + 0.06, -mainD / 4);
    group.add(roofSaw);

    // Industrial Storage Silo
    const siloMat = isAb ? this.materials.abandonedTrim : this.materials.indMintSilo;
    const siloH = mainH * 0.95;
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, siloH, 8), siloMat);
    silo.position.set(0.25, siloH / 2, 0.25);
    silo.castShadow = true;
    group.add(silo);

    // Steel pipe conduit
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 4), isAb ? this.materials.abandonedTrim : this.materials.indPipe);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0.12, siloH * 0.8, 0.25);
    group.add(pipe);

    // Raised loading dock with overhead roll-up bay door
    const dock = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.16), isAb ? this.materials.abandonedTrim : this.materials.indCharcoal);
    dock.position.set(-0.16, 0.04, mainD / 2 + 0.08);
    group.add(dock);

    const bayDoor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.02), this.materials.indCautionYellow);
    bayDoor.position.set(-0.16, 0.17, mainD / 2 + 0.01);
    group.add(bayDoor);

    if (!isAb) {
      if (style === 1) {
        // High-Tech Fab Lab with tilted solar panels and electrical transformer
        const solar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.26), this.materials.indSolar);
        solar.position.set(-0.16, mainH + 0.06, 0.16);
        solar.rotation.x = Math.PI / 10;
        group.add(solar);

        const transformer = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), this.materials.indCautionYellow);
        transformer.position.set(0.28, 0.08, -mainD / 2 - 0.08);
        group.add(transformer);
      } else if (style === 2) {
        // Logistics Depot with Intermodal Shipping Containers
        const cont1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.32), this.materials.indCargoRed);
        cont1.position.set(-0.24, 0.07, -mainD / 2 - 0.16);
        group.add(cont1);

        const cont2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.32), this.materials.indCargoBlue);
        cont2.position.set(-0.06, 0.07, -mainD / 2 - 0.16);
        group.add(cont2);
      } else {
        // Wooden shipping crates
        const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), this.materials.indCrate);
        crate1.position.set(-0.36, 0.06, mainD / 2 + 0.16);
        group.add(crate1);

        const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.10), this.materials.indCrate);
        crate2.position.set(-0.36, 0.17, mainD / 2 + 0.16);
        group.add(crate2);
      }

      // Continuous clean white steam emitter from factory chimney/silo
      this.createSmokeEmitter(x + 0.5 + 0.25, siloH + 0.1, z + 0.5 + 0.25);
    } else {
      this.addAbandonedDetails(group, mainW, mainD / 2);
    }
  }

  // 4. Modern Tech & Corporate High-Rise Office (Deep sapphire & cyan glass, titanium silver frame, rooftop helipad)
  private createCuteOfficeMesh(b: BuildingData, h: number, group: THREE.Group) {
    const isAb = b.isAbandoned;
    const towerH = Math.max(1.4, h * 1.15);
    const towerW = 0.72;
    const towerD = 0.72;
    const style = b.styleSeed % 3;

    const glassMat = isAb ? this.materials.abandonedGlass : (style === 0 ? this.materials.officeGlass : this.materials.officeDeepGlass);
    const frameMat = isAb ? this.materials.abandonedTrim : this.materials.officeFrame;

    if (style === 0) {
      // Style 0: Modern Studio Office with recessed glass curtain wall & solar louvers
      const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), glassMat);
      tower.position.y = towerH / 2;
      tower.castShadow = true;
      group.add(tower);

      // Vertical architectural louvers on facade
      const louverMat = isAb ? this.materials.abandonedTrim : this.materials.officeFrame;
      for (let i = -2; i <= 2; i++) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.02, towerH * 0.75, 0.06), louverMat);
        louver.position.set(i * 0.14, towerH * 0.55, towerD / 2 + 0.03);
        group.add(louver);
      }

      // Wooden accent entry portal
      const entry = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.06), this.materials.resWood);
      entry.position.set(0, 0.16, towerD / 2 + 0.03);
      group.add(entry);

      // Rooftop HVAC chiller unit
      const chiller = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.34), this.materials.indSlate);
      chiller.position.set(0, towerH + 0.08, 0);
      group.add(chiller);

      this.addGeometricWindows(group, towerW, towerH, towerD, Math.min(5, b.level + 2), isAb);
    } else if (style === 1) {
      // Style 1: Corner Tech Incubator with cantilevered upper story & neon tech badge
      const baseH = towerH * 0.45;
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(towerW * 0.85, baseH, towerD * 0.85), glassMat);
      baseMesh.position.y = baseH / 2;
      baseMesh.castShadow = true;
      group.add(baseMesh);

      const topH = towerH * 0.55;
      const topMesh = new THREE.Mesh(new THREE.BoxGeometry(towerW, topH, towerD), glassMat);
      topMesh.position.set(0.04, baseH + topH / 2, 0.04);
      topMesh.castShadow = true;
      group.add(topMesh);

      // Illuminated Tech Brand logo on cantilever
      if (!isAb) {
        const logo = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.04), this.materials.comNeonCyan);
        logo.position.set(0.04, baseH + topH * 0.6, towerD / 2 + 0.06);
        group.add(logo);
      }

      // Rooftop communications mast with aviation beacon
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.45, 4), frameMat);
      mast.position.set(-0.12, baseH + topH + 0.22, -0.12);
      group.add(mast);

      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9 });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), beaconMat);
      beacon.position.set(-0.12, baseH + topH + 0.45, -0.12);
      group.add(beacon);
      this.antennaLights.push({ mesh: beacon, baseIntensity: 1.0 });

      this.addGeometricWindows(group, towerW, towerH, towerD, Math.min(5, b.level + 1), isAb);
    } else {
      // Style 2: High-Rise Corporate Headquarters with Steel Trusses & Rooftop Helipad
      const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), glassMat);
      tower.position.y = towerH / 2;
      tower.castShadow = true;
      group.add(tower);

      // Structural steel frame rings
      const frameGeo = new THREE.BoxGeometry(towerW + 0.02, 0.04, towerD + 0.02);
      for (let f = 1; f <= 4; f++) {
        const ring = new THREE.Mesh(frameGeo, frameMat);
        ring.position.y = (towerH / 5) * f;
        group.add(ring);
      }

      // Rooftop Helipad with green pad & white 'H'
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.48), isAb ? this.materials.abandonedTrim : this.materials.officeHelipad);
      pad.position.y = towerH + 0.025;
      group.add(pad);

      if (!isAb) {
        // Helipad 'H' marking
        const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.22), this.materials.resParapet);
        hBar1.position.set(-0.07, towerH + 0.055, 0);
        const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.22), this.materials.resParapet);
        hBar2.position.set(0.07, towerH + 0.055, 0);
        const hCross = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.04), this.materials.resParapet);
        hCross.position.set(0, towerH + 0.055, 0);
        group.add(hBar1);
        group.add(hBar2);
        group.add(hCross);
      }

      // Spire antenna on top with pulsing red warning light
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.4, 4), frameMat);
      spire.position.set(0.18, towerH + 0.22, 0.18);
      group.add(spire);

      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9 });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), beaconMat);
      beacon.position.set(0.18, towerH + 0.42, 0.18);
      group.add(beacon);
      this.antennaLights.push({ mesh: beacon, baseIntensity: 1.0 });

      this.addGeometricWindows(group, towerW, towerH, towerD, Math.min(5, b.level + 2), isAb);
    }

    if (isAb) {
      this.addAbandonedDetails(group, towerW, towerD / 2);
    }
  }

  // Weathered boarded wooden planks and "FOR LEASE / ABANDONED" plaque
  private addAbandonedDetails(group: THREE.Group, w: number, zOffset: number) {
    const plankMat = this.materials.abandonedWood;
    const signMat = this.materials.abandonedSign;

    // Criss-cross boarded planks across entryway
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.02), plankMat);
    p1.position.set(0, 0.20, zOffset + 0.015);
    p1.rotation.z = 0.25;
    group.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.02), plankMat);
    p2.position.set(0, 0.26, zOffset + 0.015);
    p2.rotation.z = -0.22;
    group.add(p2);

    // Dim weathered "FOR LEASE" badge
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.02), signMat);
    sign.position.set(0.24, 0.22, zOffset + 0.02);
    group.add(sign);
  }

  private addGeometricWindows(group: THREE.Group, w: number, h: number, d: number, floors: number, isAbandoned = false) {
    const bandGeo = new THREE.BoxGeometry(w * 0.8, 0.08, 0.015);
    const winMat = isAbandoned ? this.materials.abandonedGlass : this.materials.windowLit;
    const floorH = h / (floors + 1);

    for (let f = 1; f <= floors; f++) {
      const band = new THREE.Mesh(bandGeo, winMat);
      band.position.set(0, f * floorH, d / 2 + 0.008);
      group.add(band);
    }
  }

  private createSmokeEmitter(worldX: number, worldY: number, worldZ: number) {
    if (this.smokeParticles.length >= 20) return;
    const puffGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const puffMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.45 });
    const puff = new THREE.Mesh(puffGeo, puffMat);
    puff.position.set(worldX, worldY, worldZ);
    this.particleGroup.add(puff);
    this.smokeParticles.push({
      mesh: puff,
      initialY: worldY,
      speed: 0.4 + Math.random() * 0.3,
    });
  }

  private addBuildingUpgradeTop(b: BuildingData, h: number, group: THREE.Group) {
    if (b.level < 2) return;
    const isAb = b.isAbandoned;

    if (b.zone === 'residential') {
      if (b.level === 2) {
        // Level 2: Modern Rooftop Wooden Pergola Sunshade & Terrace Deck
        const deckMat = isAb ? this.materials.abandonedWood : this.materials.resWood;
        const deck = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.44), deckMat);
        deck.position.set(0, h + 0.02, 0);
        group.add(deck);

        // 4 Pergola timber posts with cross-slat roof
        const postMat = isAb ? this.materials.abandonedWood : this.materials.resDarkWood;
        const postGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4);
        for (const [px, pz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(px, h + 0.13, pz);
          group.add(post);
        }
        for (let s = -0.16; s <= 0.16; s += 0.08) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.03), postMat);
          slat.position.set(0, h + 0.24, s);
          group.add(slat);
        }
        if (!isAb) {
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 6), this.materials.resPlanter);
          pot.position.set(0.12, h + 0.08, 0.12);
          const bush = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 5), this.materials.resMint);
          bush.position.set(0.12, h + 0.16, 0.12);
          group.add(pot);
          group.add(bush);
        }
      } else {
        // Level 3-5: Luxury Penthouse Crown Top with Glass Solarium & Rooftop Garden
        const pentMat = isAb ? this.materials.abandonedWall : this.materials.resCream;
        const pentH = 0.32;
        const pentW = 0.48;
        const pentD = 0.48;
        const pent = new THREE.Mesh(new THREE.BoxGeometry(pentW, pentH, pentD), pentMat);
        pent.position.set(0.04, h + pentH / 2, 0.04);
        pent.castShadow = true;
        group.add(pent);

        // Glass penthouse ribbon windows
        const pGlass = new THREE.Mesh(
          new THREE.BoxGeometry(pentW + 0.01, 0.14, pentD + 0.01),
          isAb ? this.materials.abandonedGlass : this.materials.storefrontLit
        );
        pGlass.position.set(0.04, h + pentH * 0.55, 0.04);
        group.add(pGlass);

        // Parapet cap on penthouse
        const pCap = new THREE.Mesh(new THREE.BoxGeometry(pentW + 0.04, 0.03, pentD + 0.04), this.materials.resParapet);
        pCap.position.set(0.04, h + pentH + 0.015, 0.04);
        group.add(pCap);

        // Solar panel rack
        if (!isAb) {
          const solar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.18), this.materials.indSolar);
          solar.position.set(-0.16, h + 0.06, -0.16);
          solar.rotation.x = Math.PI / 12;
          group.add(solar);

          // Slender rooftop antenna with blinking red beacon
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, 0.35, 4), this.materials.officeFrame);
          ant.position.set(0.2, h + pentH + 0.18, 0.2);
          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xef4444 })
          );
          beacon.position.set(0.2, h + pentH + 0.36, 0.2);
          group.add(ant);
          group.add(beacon);
          this.antennaLights.push({ mesh: beacon, baseIntensity: 1.0 });
        }
      }
    } else if (b.zone === 'commercial') {
      if (b.level === 2) {
        // Level 2: Rooftop Cafe Patio with Colorful Parasols & Billboard
        const deck = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.55), this.materials.resWood);
        deck.position.set(0, h + 0.015, 0);
        group.add(deck);

        // Umbrella parasol & table
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 4), this.materials.resWood);
        pole.position.set(-0.12, h + 0.14, -0.12);
        const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.07, 6), this.materials.comAwningRed);
        umbrella.position.set(-0.12, h + 0.28, -0.12);
        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 6), this.materials.resWood);
        table.position.set(-0.12, h + 0.06, -0.12);
        group.add(pole);
        group.add(umbrella);
        group.add(table);

        // Illuminated Billboard sign frame
        if (!isAb) {
          const board = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.03), this.materials.comNeonYellow);
          board.position.set(0.08, h + 0.20, 0.18);
          const bPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.20, 4), this.materials.indPipe);
          bPostL.position.set(-0.06, h + 0.10, 0.18);
          const bPostR = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.20, 4), this.materials.indPipe);
          bPostR.position.set(0.22, h + 0.10, 0.18);
          group.add(board);
          group.add(bPostL);
          group.add(bPostR);
        }
      } else {
        // Level 3+: Commercial Center Glass Skylight Atrium & Neon Logo Crown Top
        const atrium = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.48), isAb ? this.materials.abandonedGlass : this.materials.comGlass);
        atrium.position.set(0, h + 0.12, 0);
        atrium.castShadow = true;
        group.add(atrium);

        // Heavy HVAC Chiller
        const hvac = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.26), this.materials.indSlate);
        hvac.position.set(0.20, h + 0.09, -0.20);
        group.add(hvac);

        // Glowing Neon Logo Cube Top
        if (!isAb) {
          const neonCube = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), this.materials.comNeonCyan);
          neonCube.position.set(0, h + 0.32, 0);
          group.add(neonCube);
        }
      }
    } else if (b.zone === 'industrial') {
      if (b.level === 2) {
        // Level 2: Industrial Exhaust Piping & Twin Silos Top
        const flue1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 6), this.materials.indPipe);
        flue1.position.set(-0.2, h + 0.175, 0.2);
        const flue2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 6), this.materials.indPipe);
        flue2.position.set(-0.06, h + 0.225, 0.2);
        group.add(flue1);
        group.add(flue2);
        if (!isAb) {
          this.createSmokeEmitter(group.position.x - 0.06, h + 0.48, group.position.z + 0.2);
        }
      } else {
        // Level 3+: Heavy Factory Gantry Crane & Rooftop Cooling Tower Top
        const craneArm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.06), this.materials.indCautionYellow);
        craneArm.position.set(0, h + 0.28, -0.1);
        const craneTower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), this.materials.indCautionYellow);
        craneTower.position.set(-0.2, h + 0.14, -0.1);
        group.add(craneArm);
        group.add(craneTower);

        // Cooling Tower
        const coolingTower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.28, 8), this.materials.indMintSilo);
        coolingTower.position.set(0.18, h + 0.14, 0.18);
        group.add(coolingTower);
        if (!isAb) {
          this.createSmokeEmitter(group.position.x + 0.18, h + 0.32, group.position.z + 0.18);
        }
      }
    } else if (b.zone === 'office') {
      if (b.level === 2) {
        // Level 2: Tech Penthouse with Satellite Uplink Dish & Louvered Canopy
        const pent = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.5), isAb ? this.materials.abandonedGlass : this.materials.officeGlass);
        pent.position.set(0, h + 0.13, 0);
        group.add(pent);

        // Satellite dish
        const dish = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.officeFrame);
        dish.position.set(0.16, h + 0.32, 0.16);
        dish.rotation.x = -Math.PI / 4;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 4), this.materials.officeFrame);
        mast.position.set(0.16, h + 0.20, 0.16);
        group.add(dish);
        group.add(mast);
      } else {
        // Level 3+: Skyscraper Spire Crown Top with Illuminated Architectural Tip & Helipad
        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.55, 4), isAb ? this.materials.abandonedGlass : this.materials.officeDeepGlass);
        crown.position.set(0, h + 0.275, 0);
        crown.rotation.y = Math.PI / 4;
        group.add(crown);

        // Spire needle
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.025, 0.55, 4), this.materials.officeFrame);
        spire.position.set(0, h + 0.55 + 0.275, 0);
        group.add(spire);

        // Red aviation beacon light at peak
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        beacon.position.set(0, h + 1.12, 0);
        group.add(beacon);
        this.antennaLights.push({ mesh: beacon, baseIntensity: 1.2 });
      }
    }
  }

  private createServiceMesh(x: number, z: number, cell: CellData) {
    const s = cell.service!;
    const group = new THREE.Group();
    group.position.set(x + 0.5, 0, z + 0.5);

    // Apply diverse orientation
    if (s.rotation !== undefined) {
      group.rotation.y = s.rotation;
    } else {
      group.rotation.y = ((s.styleSeed % 4) * Math.PI) / 2;
    }

    switch (s.type) {
      case 'wind_turbine': {
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.1, 2.2, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 1.1;
        pole.castShadow = true;
        group.add(pole);

        const rotor = new THREE.Group();
        rotor.position.set(0, 2.2, 0.15);
        for (let i = 0; i < 3; i++) {
          const bladeGeo = new THREE.BoxGeometry(0.06, 0.9, 0.02);
          bladeGeo.translate(0, 0.45, 0);
          const blade = new THREE.Mesh(bladeGeo, poleMat);
          blade.rotation.z = (i * Math.PI * 2) / 3;
          rotor.add(blade);
        }
        group.add(rotor);
        this.windTurbineRotors.push(rotor);
        break;
      }

      case 'solar_farm': {
        for (let r = -0.3; r <= 0.3; r += 0.3) {
          const pGeo = new THREE.BoxGeometry(0.8, 0.04, 0.22);
          const pMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 });
          const panel = new THREE.Mesh(pGeo, pMat);
          panel.rotation.x = Math.PI / 8;
          panel.position.set(0, 0.18, r);
          panel.castShadow = true;
          group.add(panel);
        }
        break;
      }

      case 'water_tower': {
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
        for (let i = 0; i < 4; i++) {
          const leg = new THREE.Mesh(legGeo, legMat);
          const ang = (i * Math.PI) / 2;
          leg.position.set(Math.cos(ang) * 0.25, 0.7, Math.sin(ang) * 0.25);
          group.add(leg);
        }

        const tankGeo = new THREE.SphereGeometry(0.38, 10, 8);
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.y = 1.6;
        tank.castShadow = true;
        group.add(tank);
        break;
      }

      case 'clinic': {
        // High-Detail Modern 2-Story Medical Clinic
        const clinicW = 0.74;
        const clinicH = 0.72;
        const clinicD = 0.68;

        const mainBld = new THREE.Mesh(
          new THREE.BoxGeometry(clinicW, clinicH, clinicD),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
        );
        mainBld.position.set(0, clinicH / 2, -0.04);
        mainBld.castShadow = true;
        group.add(mainBld);

        // Teal / Emerald base trim foundation
        const baseTrim = new THREE.Mesh(
          new THREE.BoxGeometry(clinicW + 0.02, 0.08, clinicD + 0.02),
          new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.4 })
        );
        baseTrim.position.set(0, 0.04, -0.04);
        group.add(baseTrim);

        // Projecting Glass Entrance Canopy
        const canopy = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.04, 0.18),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 })
        );
        canopy.position.set(0, 0.38, clinicD / 2 - 0.04 + 0.09);
        group.add(canopy);

        // Entrance sliding glass doors
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.02), this.materials.storefrontLit);
        door.position.set(0, 0.16, clinicD / 2 - 0.04 + 0.01);
        group.add(door);

        // Red Medical Cross Crest above entrance
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        crossH.position.set(0, 0.52, clinicD / 2 - 0.04 + 0.015);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        crossV.position.set(0, 0.52, clinicD / 2 - 0.04 + 0.015);
        group.add(crossH);
        group.add(crossV);

        // Mini Parked Ambulance in dedicated bay
        const ambGroup = new THREE.Group();
        ambGroup.position.set(0.28, 0, 0.24);
        const ambBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.13, 0.11, 0.24),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        ambBody.position.y = 0.08;
        ambGroup.add(ambBody);

        const ambStripe = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.03, 0.245), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        ambStripe.position.y = 0.08;
        ambGroup.add(ambStripe);

        const ambSiren = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        ambSiren.position.y = 0.15;
        ambGroup.add(ambSiren);
        group.add(ambGroup);

        // Rooftop HVAC unit
        const ac = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), this.materials.indSlate);
        ac.position.set(-0.16, clinicH + 0.06, -0.16);
        group.add(ac);

        this.addGeometricWindows(group, clinicW, clinicH, clinicD, 2, false);
        break;
      }

      case 'hospital': {
        // High-Detail Metropolitan Hospital Center with Helipad & ER Bay
        const towerW = 0.68;
        const towerH = 1.48;
        const towerD = 0.56;

        // 1. Main Inpatient Ward Tower
        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(towerW, towerH, towerD),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
        );
        tower.position.set(-0.06, towerH / 2, -0.06);
        tower.castShadow = true;
        group.add(tower);

        // 2. Connected 2-Story Emergency Room (ER) Wing
        const erW = 0.42;
        const erH = 0.65;
        const erD = 0.46;
        const erWing = new THREE.Mesh(
          new THREE.BoxGeometry(erW, erH, erD),
          new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
        );
        erWing.position.set(0.22, erH / 2, 0.18);
        erWing.castShadow = true;
        group.add(erWing);

        // Red ER Drop-off Awning
        const erAwning = new THREE.Mesh(
          new THREE.BoxGeometry(erW * 0.9, 0.04, 0.16),
          new THREE.MeshStandardMaterial({ color: 0xdc2626 })
        );
        erAwning.position.set(0.22, 0.36, 0.18 + erD / 2 + 0.08);
        group.add(erAwning);

        // Parked Mini Ambulance vehicle in bay
        const ambGroup = new THREE.Group();
        ambGroup.position.set(0.22, 0, 0.18 + erD / 2 + 0.10);
        const ambBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.11, 0.25),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        ambBody.position.y = 0.08;
        ambGroup.add(ambBody);
        const ambStripe = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.03, 0.255), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        ambStripe.position.y = 0.08;
        ambGroup.add(ambStripe);
        group.add(ambGroup);

        // Red Crosses on Facades
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        crossH.position.set(-0.06, towerH * 0.85, towerD / 2 - 0.06 + 0.015);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        crossV.position.set(-0.06, towerH * 0.85, towerD / 2 - 0.06 + 0.015);
        group.add(crossH);
        group.add(crossV);

        // 3. Rooftop Emergency Helicopter Landing Pad (Helipad)
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(0.48, 0.05, 0.48),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
        );
        pad.position.set(-0.06, towerH + 0.025, -0.06);
        group.add(pad);

        // Yellow Helipad Boundary Ring
        const ring = new THREE.Mesh(
          new THREE.BoxGeometry(0.44, 0.055, 0.44),
          new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        ring.position.set(-0.06, towerH + 0.026, -0.06);
        group.add(ring);

        // Red Cross inside Helipad
        const hCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        hCrossH.position.set(-0.06, towerH + 0.056, -0.06);
        const hCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.24), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        hCrossV.position.set(-0.06, towerH + 0.056, -0.06);
        group.add(hCrossH);
        group.add(hCrossV);

        // Aviation Beacon at Helipad corner
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        beacon.position.set(-0.06 + 0.22, towerH + 0.12, -0.06 + 0.22);
        group.add(beacon);
        this.antennaLights.push({ mesh: beacon, baseIntensity: 1.0 });

        this.addGeometricWindows(group, towerW, towerH, towerD, 4, false);
        this.addGeometricWindows(group, erW, erH, erD, 2, false);
        break;
      }

      case 'fire_station': {
        // Classic 2-Bay Red Brick Firehouse with Hose Drying Tower & Miniature Fire Engine
        const fireW = 0.78;
        const fireH = 0.76;
        const fireD = 0.70;

        // Main apparatus bay building (classic brick)
        const firehouse = new THREE.Mesh(
          new THREE.BoxGeometry(fireW, fireH, fireD),
          this.materials.indBrick
        );
        firehouse.position.set(0, fireH / 2, -0.04);
        firehouse.castShadow = true;
        group.add(firehouse);

        // Stone lintels and rooftop parapet cap
        const parapet = new THREE.Mesh(
          new THREE.BoxGeometry(fireW + 0.03, 0.05, fireD + 0.03),
          this.materials.resParapet
        );
        parapet.position.set(0, fireH + 0.025, -0.04);
        group.add(parapet);

        // Two Roll-up Garage Bay Doors for Fire Trucks
        for (const bx of [-0.18, 0.18]) {
          const bayDoor = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.38, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 })
          );
          bayDoor.position.set(bx, 0.19, fireD / 2 - 0.04 + 0.01);
          group.add(bayDoor);

          // Glass windows on roll-up door
          const glassStrip = new THREE.Mesh(
            new THREE.BoxGeometry(0.20, 0.08, 0.025),
            this.materials.storefrontLit
          );
          glassStrip.position.set(bx, 0.28, fireD / 2 - 0.04 + 0.015);
          group.add(glassStrip);
        }

        // Hose Drying Tower rising at rear corner
        const towerW = 0.24;
        const towerH = 1.25;
        const towerD = 0.24;
        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(towerW, towerH, towerD),
          this.materials.indBrick
        );
        tower.position.set(-fireW / 2 + towerW / 2, towerH / 2, -fireD / 2 + towerD / 2);
        tower.castShadow = true;
        group.add(tower);

        // Tower copper roof pyramid
        const towerCap = new THREE.Mesh(
          new THREE.ConeGeometry(0.20, 0.22, 4),
          this.materials.comTeal
        );
        towerCap.position.set(-fireW / 2 + towerW / 2, towerH + 0.11, -fireD / 2 + towerD / 2);
        towerCap.rotation.y = Math.PI / 4;
        group.add(towerCap);

        // Rooftop Brass Bell / Siren Cupola
        const siren = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.08, 0.12, 6),
          this.materials.comNeonYellow
        );
        siren.position.set(0.12, fireH + 0.08, 0);
        group.add(siren);

        // Parked Red Fire Engine Truck outside ready on apron
        const engineGroup = new THREE.Group();
        engineGroup.position.set(0.20, 0, 0.28);
        const eBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.14, 0.34),
          new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 })
        );
        eBody.position.y = 0.09;
        engineGroup.add(eBody);

        // White equipment stripe & ladder
        const eStripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.165, 0.03, 0.345),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        eStripe.position.y = 0.09;
        engineGroup.add(eStripe);

        const ladder = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.02, 0.26),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6 })
        );
        ladder.position.set(0, 0.18, -0.02);
        engineGroup.add(ladder);

        const eSiren = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.025, 0.04),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        eSiren.position.set(0, 0.18, 0.12);
        engineGroup.add(eSiren);
        group.add(engineGroup);

        this.addGeometricWindows(group, fireW, fireH, fireD, 2, false);
        break;
      }

      case 'police_station': {
        // 2-Story Municipal Police Headquarters with Radio Antenna & Patrol Squad Car
        const precW = 0.76;
        const precH = 0.82;
        const precD = 0.70;

        // Main station building (clean off-white municipal limestone)
        const precinct = new THREE.Mesh(
          new THREE.BoxGeometry(precW, precH, precD),
          new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 })
        );
        precinct.position.set(0, precH / 2, -0.04);
        precinct.castShadow = true;
        group.add(precinct);

        // Deep Navy Blue architectural accent band & base
        const navyTrim = new THREE.Mesh(
          new THREE.BoxGeometry(precW + 0.02, 0.12, precD + 0.02),
          new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 })
        );
        navyTrim.position.set(0, 0.06, -0.04);
        group.add(navyTrim);

        const roofBand = new THREE.Mesh(
          new THREE.BoxGeometry(precW + 0.03, 0.06, precD + 0.03),
          new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 })
        );
        roofBand.position.set(0, precH + 0.03, -0.04);
        group.add(roofBand);

        // Glass entrance lobby with blue canopy
        const canopy = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.04, 0.18),
          new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3 })
        );
        canopy.position.set(0, 0.36, precD / 2 - 0.04 + 0.09);
        group.add(canopy);

        const door = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.30, 0.02), this.materials.storefrontLit);
        door.position.set(0, 0.15, precD / 2 - 0.04 + 0.01);
        group.add(door);

        // Police gold shield badge above entrance
        const badge = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.14, 0.02),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.3 })
        );
        badge.position.set(0, 0.52, precD / 2 - 0.04 + 0.015);
        group.add(badge);

        // Rooftop Communications Mast Tower with alternating flashing Blue/Red beacons
        const mastGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.55, 4);
        const mast = new THREE.Mesh(mastGeo, this.materials.indPipe);
        mast.position.set(-0.22, precH + 0.275, -0.2);
        group.add(mast);

        const redBeacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        redBeacon.position.set(-0.25, precH + 0.56, -0.2);
        const blueBeacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
        );
        blueBeacon.position.set(-0.19, precH + 0.56, -0.2);
        group.add(redBeacon);
        group.add(blueBeacon);
        this.antennaLights.push({ mesh: redBeacon, baseIntensity: 1.2 });
        this.antennaLights.push({ mesh: blueBeacon, baseIntensity: 1.2 });

        // Parked Police Cruiser Interceptor in designated stall
        const cruiser = new THREE.Group();
        cruiser.position.set(0.28, 0, 0.22);
        const cBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.09, 0.26),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
        );
        cBody.position.y = 0.07;
        cruiser.add(cBody);
        const cRoof = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.05, 0.14),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        cRoof.position.set(0, 0.13, -0.01);
        cruiser.add(cRoof);
        const lightbar = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.02, 0.04),
          new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
        );
        lightbar.position.set(0, 0.165, -0.01);
        cruiser.add(lightbar);
        group.add(cruiser);

        this.addGeometricWindows(group, precW, precH, precD, 2, false);
        break;
      }

      case 'elementary_school': {
        // High-Detail Brick & Pastel Elementary Academy with Clock Tower & Schoolyard
        const bldW = 0.74;
        const bldH = 0.65;
        const bldD = 0.68;

        const bld = new THREE.Mesh(new THREE.BoxGeometry(bldW, bldH, bldD), this.materials.resCream);
        bld.position.set(0, bldH / 2, -0.06);
        bld.castShadow = true;
        group.add(bld);

        // Terracotta brick base
        const brickBase = new THREE.Mesh(new THREE.BoxGeometry(bldW + 0.02, 0.12, bldD + 0.02), this.materials.resTerracotta);
        brickBase.position.set(0, 0.06, -0.06);
        group.add(brickBase);

        // Crisp white parapet
        const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(bldW + 0.04, 0.04, bldD + 0.04), this.materials.resParapet);
        roofTrim.position.set(0, bldH + 0.02, -0.06);
        group.add(roofTrim);

        // Central Bell / Clock Tower Spire
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.24), this.materials.resMint);
        tower.position.set(0, bldH + 0.18, 0.12);
        group.add(tower);

        // Clock face
        const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 8), this.materials.resParapet);
        clock.rotation.x = Math.PI / 2;
        clock.position.set(0, bldH + 0.22, 0.25);
        group.add(clock);

        // Copper peaked spire roof
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.25, 4), this.materials.comTeal);
        spire.position.set(0, bldH + 0.48, 0.12);
        spire.rotation.y = Math.PI / 4;
        group.add(spire);

        // Schoolyard Corner Playground: Slide & student benches
        const slideBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), this.materials.indCautionYellow);
        slideBase.position.set(0.32, 0.08, 0.30);
        group.add(slideBase);
        const slideRamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.20), this.materials.indCautionYellow);
        slideRamp.position.set(0.32, 0.09, 0.22);
        slideRamp.rotation.x = -Math.PI / 6;
        group.add(slideRamp);

        // 2 gathered student figures
        group.add(this.createParkCitizen(0.18, 0.02, 0.32, 0x3b82f6, false));
        group.add(this.createParkCitizen(-0.24, 0.02, 0.32, 0xec4899, false));

        this.addGeometricWindows(group, bldW, bldH, bldD, 2, false);
        break;
      }

      case 'university': {
        // High-Detail Grand Classical University Campus Quad
        const mainW = 0.78;
        const mainH = 1.05;
        const mainD = 0.74;

        const main = new THREE.Mesh(new THREE.BoxGeometry(mainW, mainH, mainD), this.materials.resCream);
        main.position.set(0, mainH / 2, -0.04);
        main.castShadow = true;
        group.add(main);

        // Classical Neoclassical Columns Portico
        const portico = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.16), this.materials.resParapet);
        portico.position.set(0, 0.26, mainD / 2 - 0.04 + 0.08);
        group.add(portico);

        // Triangular Pediment over Portico
        const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.18, 4), this.materials.resParapet);
        pediment.position.set(0, 0.58, mainD / 2 - 0.04 + 0.08);
        pediment.rotation.y = Math.PI / 4;
        group.add(pediment);

        // Central Astronomical Observatory Dome
        const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.12, 12), this.materials.resParapet);
        domeBase.position.set(0, mainH + 0.06, 0);
        group.add(domeBase);

        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), this.materials.comTeal);
        dome.position.set(0, mainH + 0.22, 0);
        group.add(dome);

        // Golden Spire Finial
        const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.20, 4), this.materials.comNeonYellow);
        finial.position.set(0, mainH + 0.44, 0);
        group.add(finial);

        // Quad Courtyard trees & scholars
        const oakTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.25, 4), this.materials.resDarkWood);
        oakTrunk.position.set(-0.34, 0.125, 0.32);
        const oakFoliage = new THREE.Mesh(new THREE.SphereGeometry(0.14, 5, 5), this.materials.resSage);
        oakFoliage.position.set(-0.34, 0.32, 0.32);
        group.add(oakTrunk);
        group.add(oakFoliage);

        // 2 gathered scholars
        group.add(this.createParkCitizen(0.24, 0.02, 0.30, 0x8b5cf6, false));
        group.add(this.createParkCitizen(0.08, 0.02, 0.32, 0x10b981, true));

        this.addGeometricWindows(group, mainW, mainH, mainD, 3, false);
        break;
      }

      case 'small_park': {
        // 4 Distinct Models of Small Parks with Gathered Citizens!
        const parkModel = s.styleSeed % 4;
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.96), this.materials.grass);
        base.position.y = 0.02;
        group.add(base);

        if (parkModel === 0) {
          // Model 0: Town Fountain Plaza Park (tiered stone fountain, cobblestone paths, benches, cherry blossom, 4 gathering citizens)
          const plaza = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16), this.materials.sidewalk);
          plaza.position.set(0, 0.03, 0);
          group.add(plaza);

          // Tier 1 fountain basin
          const fBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.10, 12), this.materials.resParapet);
          fBasin.position.set(0, 0.08, 0);
          group.add(fBasin);

          const fWater = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.11, 12), this.materials.water);
          fWater.position.set(0, 0.09, 0);
          group.add(fWater);

          // Tier 2 fountain bowl
          const fBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.08, 8), this.materials.resParapet);
          fBowl.position.set(0, 0.16, 0);
          group.add(fBowl);

          // 2 Ornate wooden benches
          const bench1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.08), this.materials.resWood);
          bench1.position.set(-0.32, 0.06, 0);
          bench1.rotation.y = Math.PI / 2;
          group.add(bench1);

          const bench2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.08), this.materials.resWood);
          bench2.position.set(0.32, 0.06, 0);
          bench2.rotation.y = -Math.PI / 2;
          group.add(bench2);

          // Blooming cherry blossom tree
          const treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 4), this.materials.resDarkWood);
          treeTrunk.position.set(0.32, 0.16, 0.32);
          group.add(treeTrunk);

          const treePuff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.materials.resBlush);
          treePuff.position.set(0.32, 0.38, 0.32);
          group.add(treePuff);

          // 4 GATHERED CITIZENS in the park!
          // Citizen 1: sitting on west bench
          group.add(this.createParkCitizen(-0.32, 0.06, 0, 0x3b82f6, true));
          // Citizen 2: sitting on east bench
          group.add(this.createParkCitizen(0.32, 0.06, 0, 0xec4899, true));
          // Citizen 3: standing near fountain tossing coin
          group.add(this.createParkCitizen(-0.08, 0.04, 0.28, 0x10b981, false));
          // Citizen 4: chatting with friend
          group.add(this.createParkCitizen(0.12, 0.04, 0.28, 0xf59e0b, false));

        } else if (parkModel === 1) {
          // Model 1: Botanical Pond & Footbridge Garden (koi pond, arched wooden bridge, picnic blanket, weeping tree, 4 citizens)
          const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.05, 12), this.materials.water);
          pond.position.set(-0.12, 0.04, -0.12);
          group.add(pond);

          const stoneRim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 6, 12), this.materials.resParapet);
          stoneRim.rotation.x = Math.PI / 2;
          stoneRim.position.set(-0.12, 0.05, -0.12);
          group.add(stoneRim);

          // Arched wooden footbridge across pond
          const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.14), this.materials.resWood);
          bridge.position.set(-0.12, 0.09, -0.12);
          group.add(bridge);

          const railL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.02), this.materials.resDarkWood);
          railL.position.set(-0.12, 0.13, -0.18);
          const railR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.02), this.materials.resDarkWood);
          railR.position.set(-0.12, 0.13, -0.06);
          group.add(railL);
          group.add(railR);

          // Picnic blanket and basket
          const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.24), this.materials.comAwningRed);
          blanket.position.set(0.24, 0.04, 0.22);
          group.add(blanket);

          const basket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.05), this.materials.resWood);
          basket.position.set(0.24, 0.06, 0.22);
          group.add(basket);

          // Weeping willow tree
          const treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.34, 4), this.materials.resDarkWood);
          treeTrunk.position.set(0.28, 0.17, -0.25);
          group.add(treeTrunk);

          const treePuff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.materials.resSage);
          treePuff.position.set(0.28, 0.38, -0.25);
          group.add(treePuff);

          // 4 GATHERED CITIZENS!
          // Citizen on the bridge looking at koi
          group.add(this.createParkCitizen(-0.12, 0.10, -0.12, 0x8b5cf6, false));
          // Two citizens lounging on the picnic blanket
          group.add(this.createParkCitizen(0.18, 0.04, 0.22, 0xf97316, true));
          group.add(this.createParkCitizen(0.30, 0.04, 0.22, 0x06b6d4, true));
          // Strolling visitor
          group.add(this.createParkCitizen(0.05, 0.04, 0.35, 0xec4899, false));

        } else if (parkModel === 2) {
          // Model 2: Community Playground & Picnic Pavilion (play turf, swing set, slide, picnic gazebo shelter, 4 citizens)
          const playTurf = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), this.materials.comPeach);
          playTurf.position.set(-0.20, 0.03, -0.20);
          group.add(playTurf);

          // Swing set frame
          const swingFrame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.03), this.materials.comAwningRed);
          swingFrame.position.set(-0.20, 0.13, -0.26);
          group.add(swingFrame);

          // Playground slide (angled ramp)
          const slideRamp = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.03, 0.24), this.materials.comAwningYellow);
          slideRamp.rotation.x = Math.PI / 6;
          slideRamp.position.set(-0.28, 0.10, -0.12);
          group.add(slideRamp);

          // Timber gazebo pavilion
          const gazeboRoof = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.12, 4), this.materials.resDarkWood);
          gazeboRoof.position.set(0.22, 0.32, 0.20);
          group.add(gazeboRoof);

          for (let i = 0; i < 4; i++) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 4), this.materials.resWood);
            const ang = (i * Math.PI) / 2 + Math.PI / 4;
            post.position.set(0.22 + Math.cos(ang) * 0.16, 0.14, 0.20 + Math.sin(ang) * 0.16);
            group.add(post);
          }

          const picnicTable = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.10), this.materials.resWood);
          picnicTable.position.set(0.22, 0.06, 0.20);
          group.add(picnicTable);

          // Pine tree
          const pineTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 4), this.materials.resDarkWood);
          pineTrunk.position.set(0.30, 0.10, -0.30);
          const pineCone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 5), this.materials.resPlanter);
          pineCone.position.set(0.30, 0.32, -0.30);
          group.add(pineTrunk);
          group.add(pineCone);

          // 4 GATHERED CITIZENS!
          group.add(this.createParkCitizen(0.16, 0.04, 0.20, 0xef4444, true));
          group.add(this.createParkCitizen(0.28, 0.04, 0.20, 0x3b82f6, true));
          group.add(this.createParkCitizen(-0.16, 0.04, -0.16, 0x10b981, false));
          group.add(this.createParkCitizen(-0.28, 0.04, -0.28, 0xf59e0b, false));

        } else {
          // Model 3: Zen Rock Garden & Pagoda Tea Pavilion (raked sand, river stones, pagoda, stone lantern, bamboo, 3 citizens)
          const sandGarden = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.46), this.materials.sand);
          sandGarden.position.set(-0.18, 0.03, -0.18);
          group.add(sandGarden);

          // River boulders in sand
          const stone1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06), this.materials.indSlate);
          stone1.position.set(-0.24, 0.06, -0.24);
          const stone2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04), this.materials.indSlate);
          stone2.position.set(-0.12, 0.05, -0.14);
          group.add(stone1);
          group.add(stone2);

          // Pagoda tea pavilion
          const pagRoof1 = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.08, 4), this.materials.resRoofShingle);
          pagRoof1.position.set(0.20, 0.24, 0.20);
          const pagRoof2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.08, 4), this.materials.resRoofShingle);
          pagRoof2.position.set(0.20, 0.32, 0.20);
          group.add(pagRoof1);
          group.add(pagRoof2);

          for (let i = 0; i < 4; i++) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.20, 4), this.materials.resDarkWood);
            const ang = (i * Math.PI) / 2 + Math.PI / 4;
            post.position.set(0.20 + Math.cos(ang) * 0.15, 0.10, 0.20 + Math.sin(ang) * 0.15);
            group.add(post);
          }

          // Stone lantern (tōrō)
          const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.06), this.materials.resParapet);
          lantern.position.set(0.32, 0.09, -0.18);
          group.add(lantern);

          // Japanese maple tree with pink foliage
          const mapleTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.28, 4), this.materials.resDarkWood);
          mapleTrunk.position.set(-0.28, 0.14, 0.28);
          const maplePuff = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), this.materials.comCoral);
          maplePuff.position.set(-0.28, 0.34, 0.28);
          group.add(mapleTrunk);
          group.add(maplePuff);

          // 3 GATHERED CITIZENS enjoying peaceful zen!
          group.add(this.createParkCitizen(0.20, 0.04, 0.20, 0x14b8a6, true));
          group.add(this.createParkCitizen(0.06, 0.04, -0.06, 0x8b5cf6, false));
          group.add(this.createParkCitizen(-0.22, 0.04, 0.14, 0xfacc15, false));
        }
        break;
      }

      case 'large_park': {
        // Grand Metropolitan Central Park: Scenic lake with wooden deck, gazebo pavilion, bandshell stage, food cart, and 10 citizens gathered!
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.96), this.materials.grass);
        base.position.y = 0.02;
        group.add(base);

        // Scenic lake
        const lake = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.40, 0.06, 16), this.materials.water);
        lake.position.set(-0.14, 0.04, -0.14);
        group.add(lake);

        // Wooden boardwalk viewing deck
        const deck = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.18), this.materials.resWood);
        deck.position.set(-0.14, 0.08, 0.08);
        group.add(deck);

        const deckRail = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.02), this.materials.resDarkWood);
        deckRail.position.set(-0.14, 0.13, -0.01);
        group.add(deckRail);

        // Open-air amphitheater bandshell stage
        const stage = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.08, 12, 1, false, 0, Math.PI), this.materials.resParapet);
        stage.position.set(0.24, 0.06, -0.22);
        stage.rotation.y = Math.PI / 4;
        group.add(stage);

        const shell = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8, 0, Math.PI, 0, Math.PI / 2), this.materials.comButter);
        shell.position.set(0.24, 0.10, -0.22);
        shell.rotation.x = -Math.PI / 4;
        shell.rotation.y = Math.PI / 4;
        group.add(shell);

        // Food truck / Ice cream stand with colorful umbrella
        const foodCart = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.10), this.materials.comPeach);
        foodCart.position.set(0.26, 0.08, 0.24);
        group.add(foodCart);

        const cartUmbrella = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.06, 6), this.materials.comAwningRed);
        cartUmbrella.position.set(0.26, 0.24, 0.24);
        group.add(cartUmbrella);

        // Tree cluster
        const tree1Trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 4), this.materials.resDarkWood);
        tree1Trunk.position.set(-0.34, 0.16, 0.32);
        const tree1Puff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.materials.resBlush);
        tree1Puff.position.set(-0.34, 0.38, 0.32);
        group.add(tree1Trunk);
        group.add(tree1Puff);

        const tree2Trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.30, 4), this.materials.resDarkWood);
        tree2Trunk.position.set(-0.36, 0.15, -0.34);
        const tree2Puff = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), this.materials.resSage);
        tree2Puff.position.set(-0.36, 0.36, -0.34);
        group.add(tree2Trunk);
        group.add(tree2Puff);

        // 10 GATHERED CITIZENS enjoying the grand central park!
        // 2 on the lake boardwalk looking at water
        group.add(this.createParkCitizen(-0.20, 0.09, 0.05, 0x3b82f6, false));
        group.add(this.createParkCitizen(-0.08, 0.09, 0.05, 0xec4899, false));
        // 3 watching amphitheater performance
        group.add(this.createParkCitizen(0.18, 0.04, -0.06, 0x10b981, true));
        group.add(this.createParkCitizen(0.28, 0.04, -0.06, 0xf59e0b, true));
        group.add(this.createParkCitizen(0.22, 0.04, 0.02, 0x8b5cf6, false));
        // 2 near food cart ordering snacks
        group.add(this.createParkCitizen(0.18, 0.04, 0.24, 0x06b6d4, false));
        group.add(this.createParkCitizen(0.35, 0.04, 0.24, 0xf97316, false));
        // 3 strolling through tree paths
        group.add(this.createParkCitizen(-0.22, 0.04, 0.30, 0x14b8a6, false));
        group.add(this.createParkCitizen(0.02, 0.04, 0.32, 0xf43f5e, false));
        group.add(this.createParkCitizen(-0.02, 0.04, -0.32, 0x6366f1, false));
        break;
      }

      default: {
        const bld = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
        bld.position.y = 0.4;
        group.add(bld);
        break;
      }
    }

    this.serviceGroup.add(group);
  }

  private createOverlayTile(x: number, z: number, cell: CellData) {
    const tileGeo = new THREE.PlaneGeometry(0.96, 0.96);
    tileGeo.rotateX(-Math.PI / 2);
    let color = 0x000000;
    let opacity = 0.4;

    switch (this.city.overlayMode) {
      case 'electricity':
        color = cell.hasPower ? 0xfacc15 : 0x475569;
        opacity = cell.hasPower ? 0.45 : 0.2;
        break;
      case 'water':
        color = cell.hasWater ? 0x38bdf8 : 0x475569;
        opacity = cell.hasWater ? 0.45 : 0.2;
        break;
      case 'land_value': {
        const hue = (cell.landValue / 100) * 0.33;
        color = new THREE.Color().setHSL(hue, 0.9, 0.5).getHex();
        opacity = 0.45;
        break;
      }
      case 'pollution': {
        const p = cell.pollution / 100;
        color = new THREE.Color().setHSL(0.08, 0.8, 0.5 * (1 - p * 0.5)).getHex();
        opacity = Math.max(0.1, p * 0.6);
        break;
      }
      case 'traffic': {
        const d = cell.road?.trafficDensity || 0;
        color = new THREE.Color().setHSL(0.33 - d * 0.33, 0.9, 0.5).getHex();
        opacity = cell.road ? 0.5 : 0;
        break;
      }
    }

    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    const mesh = new THREE.Mesh(tileGeo, mat);
    mesh.position.set(x + 0.5, 0.03, z + 0.5);
    this.overlayGroup.add(mesh);
  }

  // Optimized Vehicle Pool updates with Right-hand side lane discipline
  public updateVehiclesRendering() {
    const vehicles = this.city.vehicles;
    const isNight = this.city.stats.dayTime < 6 || this.city.stats.dayTime > 18.5;

    for (let i = 0; i < MAX_VEHICLE_POOL; i++) {
      const poolItem = this.vehiclePool[i];
      if (i < vehicles.length) {
        const v = vehicles[i];
        poolItem.group.visible = true;

        // Base coordinate along road
        const rawX = v.x + (v.targetX - v.x) * v.progress + 0.5;
        const rawZ = v.z + (v.targetZ - v.z) * v.progress + 0.5;

        // Right-hand lane offset: calculate perpendicular vector
        const dx = v.targetX - v.x;
        const dz = v.targetZ - v.z;
        const len = Math.hypot(dx, dz) || 1;
        const perpX = (-dz / len) * v.laneOffset;
        const perpZ = (dx / len) * v.laneOffset;

        poolItem.group.position.set(rawX + perpX, 0.06, rawZ + perpZ);
        poolItem.group.rotation.y = v.rotation;

        (poolItem.bodyMesh.material as THREE.MeshStandardMaterial).color.setStyle(v.color);
        poolItem.headlightMesh.visible = isNight;

        // Brake lights: bright red when stopped in traffic block or during night
        poolItem.taillightMesh.visible = isNight || !!v.isBlocked;
        if (v.isBlocked) {
          poolItem.taillightMesh.material = this.materials.brakeLight;
        } else {
          poolItem.taillightMesh.material = this.materials.taillight;
        }
      } else {
        poolItem.group.visible = false;
      }
    }
  }

  // 60 FPS Pedestrians walking along sidewalks ("side box") and crosswalks
  public updatePedestriansRendering() {
    const peds = this.city.pedestrians;

    for (let i = 0; i < MAX_PEDESTRIAN_POOL; i++) {
      const poolItem = this.pedestrianPool[i];
      if (i < peds.length) {
        const p = peds[i];
        poolItem.group.visible = true;

        // Base world coordinate along road
        const rawX = p.x + (p.targetX - p.x) * p.progress + 0.5;
        const rawZ = p.z + (p.targetZ - p.z) * p.progress + 0.5;

        // Sidewalk curb offset (perpendicular to road direction)
        const dx = p.targetX - p.x;
        const dz = p.targetZ - p.z;
        const len = Math.hypot(dx, dz) || 1;
        const perpX = (-dz / len) * p.sidewalkSide;
        const perpZ = (dx / len) * p.sidewalkSide;

        // Walking gait animation (natural cute vertical bounce and slight hip swing)
        const walkBob = Math.abs(Math.sin(p.progress * Math.PI * 14)) * 0.022;
        const bodyLean = Math.sin(p.progress * Math.PI * 14) * 0.06;

        poolItem.group.position.set(rawX + perpX, 0.025 + walkBob, rawZ + perpZ);
        poolItem.group.rotation.y = p.rotation;
        poolItem.group.rotation.z = bodyLean;

        (poolItem.bodyMesh.material as THREE.MeshStandardMaterial).color.setStyle(p.shirtColor);
      } else {
        poolItem.group.visible = false;
      }
    }
  }

  private updateDayNightCycle() {
    const time = this.city.stats.dayTime;
    const sunAngle = ((time - 6) / 24) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const sunDist = 32;

    this.sunLight.position.set(
      GRID_SIZE / 2 + Math.cos(sunAngle) * sunDist,
      Math.max(1, sunHeight * sunDist),
      GRID_SIZE / 2 + Math.sin(sunAngle) * sunDist * 0.6
    );

    let nightFactor = 0;
    if (time >= 19.5 || time < 5.0) {
      nightFactor = 1.0;
    } else if (time >= 17.5 && time < 19.5) {
      nightFactor = (time - 17.5) / 2.0;
    } else if (time >= 5.0 && time < 7.0) {
      nightFactor = 1.0 - (time - 5.0) / 2.0;
    }

    if (sunHeight > 0.15) {
      this.scene.background = new THREE.Color(0xdbeafe);
      (this.scene.fog as THREE.FogExp2).color.setHex(0xdbeafe);
      this.sunLight.intensity = 1.4;
      this.ambientLight.intensity = 0.72;
    } else if (sunHeight > -0.15) {
      this.scene.background = new THREE.Color(0xfdba74);
      (this.scene.fog as THREE.FogExp2).color.setHex(0xfdba74);
      this.sunLight.intensity = 1.1;
      this.ambientLight.intensity = 0.55;
    } else {
      this.scene.background = new THREE.Color(0x05070f);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x05070f);
      this.sunLight.intensity = 0.22;
      this.ambientLight.intensity = 0.38;
    }

    // Dynamic Night Building Lights & Storefront Illumination
    const winEmissive = 0.2 + nightFactor * 1.6;
    for (let i = 0; i < this.windowMaterials.length; i++) {
      this.windowMaterials[i].emissiveIntensity = winEmissive;
    }

    const bldEmissive = 0.3 + nightFactor * 2.0;
    for (let i = 0; i < this.buildingLightMaterials.length; i++) {
      this.buildingLightMaterials[i].emissiveIntensity = bldEmissive;
    }

    const neonEmissive = 0.5 + nightFactor * 2.2;
    for (let i = 0; i < this.neonMaterials.length; i++) {
      this.neonMaterials[i].emissiveIntensity = neonEmissive;
    }

    const streetEmissive = nightFactor * 2.2;
    for (let i = 0; i < this.streetLightMaterials.length; i++) {
      this.streetLightMaterials[i].emissiveIntensity = streetEmissive;
    }

    // Pulse red aviation beacon on skyscraper antenna spires
    const blink = Math.sin(performance.now() * 0.006) > 0 ? 1 : 0.2;
    for (let i = 0; i < this.antennaLights.length; i++) {
      (this.antennaLights[i].mesh.material as THREE.MeshBasicMaterial).opacity = nightFactor > 0.1 ? blink : 0.3;
    }
  }

  // Ground plane at y=0 for instantaneous, bulletproof raycasting
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private hitPoint = new THREE.Vector3();

  // Instant mathematical coordinate lookup
  public getCoordFromClient(clientX: number, clientY: number): { x: number; z: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    if (this.raycaster.ray.intersectPlane(this.groundPlane, this.hitPoint)) {
      const gx = Math.floor(this.hitPoint.x);
      const gz = Math.floor(this.hitPoint.z);

      if (gx >= 0 && gx < GRID_SIZE && gz >= 0 && gz < GRID_SIZE) {
        return { x: gx, z: gz };
      }
    }
    return null;
  }

  private touchStartTime: number = 0;

  // Flash confirmation effect when a tile is tapped/built
  public flashTile(x: number, z: number, colorHex = 0x22c55e) {
    const flashGeo = new THREE.PlaneGeometry(0.96, 0.96);
    flashGeo.rotateX(-Math.PI / 2);
    const flashMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.set(x + 0.5, 0.08, z + 0.5);
    this.scene.add(flashMesh);

    let progress = 0;
    const animateFlash = () => {
      progress += 0.08;
      flashMesh.position.y += 0.02;
      const s = 1 + progress * 0.2;
      flashMesh.scale.set(s, s, s);
      flashMat.opacity = Math.max(0, 0.85 - progress * 0.85);
      if (progress < 1) {
        requestAnimationFrame(animateFlash);
      } else {
        this.scene.remove(flashMesh);
        flashGeo.dispose();
        flashMat.dispose();
      }
    };
    requestAnimationFrame(animateFlash);
  }

  // Selection and tile marker helpers
  public selectTile(x: number, z: number) {
    if (x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE) return;
    this.selectedTileCoord = { x, z };
    this.selectedTileMesh.position.set(x + 0.5, 0.08, z + 0.5);
    this.selectedTileMesh.visible = true;
    this.hoverPlane.position.set(x + 0.5, 0.05, z + 0.5);
    this.hoverPlane.visible = true;
  }

  public clearSelectedTile() {
    this.selectedTileCoord = null;
    this.selectedTileMesh.visible = false;
    this.hoverPlane.visible = false;
  }

  // Bresenham 2D grid line interpolation to guarantee gap-free continuous painting
  private getLinePath(x0: number, z0: number, x1: number, z1: number): { x: number; z: number }[] {
    const points: { x: number; z: number }[] = [];
    const dx = Math.abs(x1 - x0);
    const dz = Math.abs(z1 - z0);
    const sx = x0 < x1 ? 1 : -1;
    const sz = z0 < z1 ? 1 : -1;
    let err = dx - dz;

    let cx = x0;
    let cz = z0;

    while (true) {
      if (cx >= 0 && cx < GRID_SIZE && cz >= 0 && cz < GRID_SIZE) {
        points.push({ x: cx, z: cz });
      }
      if (cx === x1 && cz === z1) break;
      const e2 = 2 * err;
      if (e2 > -dz) {
        err -= dz;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cz += sz;
      }
    }
    return points;
  }

  // Full Touchscreen and Pointer Integration
  private bindTouchAndPointerEvents() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';

    // Touch Start
    el.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.isPointerDown = true;
        this.isTwoFingerTouch = false;
        const t = e.touches[0];
        this.touchStartPos = { x: t.clientX, y: t.clientY };
        this.lastTouchPos = { x: t.clientX, y: t.clientY };
        this.touchMovedDistance = 0;
        this.lastBuiltCoord = null;

        const coord = this.getCoordFromClient(t.clientX, t.clientY);
        if (coord) {
          this.hoveredCoord = coord;
          this.selectTile(coord.x, coord.z);

          // Only in Rapid Mode do we place immediately on touchstart
          if (this.buildModeActive && this.placementMode === 'rapid' && this.onCellClicked) {
            this.onCellClicked(coord.x, coord.z);
            this.flashTile(coord.x, coord.z, 0x22c55e);
            this.lastBuiltCoord = { x: coord.x, z: coord.z };
          }
        }
      } else if (e.touches.length === 2) {
        this.isTwoFingerTouch = true;
        this.isPointerDown = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDist = Math.hypot(dx, dy);
        this.lastTouchPos = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    }, { passive: false });

    // Touch Move: pan camera smoothly without accidental building in Confirm Mode, or paint in Rapid Mode
    el.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.isPointerDown) {
        const t = e.touches[0];
        const dx = t.clientX - this.lastTouchPos.x;
        const dy = t.clientY - this.lastTouchPos.y;
        const netDist = Math.hypot(t.clientX - this.touchStartPos.x, t.clientY - this.touchStartPos.y);
        this.touchMovedDistance = Math.max(this.touchMovedDistance, netDist);

        const coord = this.getCoordFromClient(t.clientX, t.clientY);
        if (coord) {
          this.hoveredCoord = coord;
        }

        if (this.buildModeActive && this.placementMode === 'rapid' && this.onCellClicked && coord) {
          // Rapid Place Mode: drag continuously paints tiles
          this.selectTile(coord.x, coord.z);
          if (!this.lastBuiltCoord) {
            this.onCellClicked(coord.x, coord.z);
            this.flashTile(coord.x, coord.z, 0x22c55e);
            this.lastBuiltCoord = { x: coord.x, z: coord.z };
          } else if (this.lastBuiltCoord.x !== coord.x || this.lastBuiltCoord.z !== coord.z) {
            const path = this.getLinePath(this.lastBuiltCoord.x, this.lastBuiltCoord.z, coord.x, coord.z);
            for (let i = 1; i < path.length; i++) {
              const pt = path[i];
              this.onCellClicked(pt.x, pt.z);
              this.flashTile(pt.x, pt.z, 0x22c55e);
            }
            this.lastBuiltCoord = { x: coord.x, z: coord.z };
          }
        } else {
          // Confirm Mode OR Pan Mode: scrolling/dragging ALWAYS pans the camera safely without placing anything!
          if (netDist > 6) {
            this.panCameraTarget(dx, dy);
          }
        }

        this.lastTouchPos = { x: t.clientX, y: t.clientY };
      } else if (e.touches.length === 2 && this.isTwoFingerTouch) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);

        // Pinch zoom
        const pinchDelta = currentDist - this.initialPinchDist;
        this.cameraRadius = Math.max(10, Math.min(70, this.cameraRadius - pinchDelta * 0.08));
        this.initialPinchDist = currentDist;

        // Two-finger rotation
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const rotDx = (midX - this.lastTouchPos.x) * 0.01;
        this.cameraTheta -= rotDx;
        this.lastTouchPos = { x: midX, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };

        this.updateCameraTransform();
      }
    }, { passive: false });

    // Touch End: handle deliberate taps without dragging
    el.addEventListener('touchend', (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t && !this.isTwoFingerTouch) {
        // If movement was minimal, this was an intentional tap!
        if (this.touchMovedDistance < 12) {
          const coord = this.getCoordFromClient(t.clientX, t.clientY) || this.hoveredCoord;
          if (coord) {
            this.selectTile(coord.x, coord.z);
            if (this.onCellClicked) {
              this.onCellClicked(coord.x, coord.z);
            }
          }
        }
      }
      this.isPointerDown = false;
      this.isTwoFingerTouch = false;
      this.lastBuiltCoord = null;
    }, { passive: false });

    // Desktop Mouse Pointer Events
    el.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 0) {
        this.isPointerDown = true;
        this.touchStartPos = { x: e.clientX, y: e.clientY };
        this.lastTouchPos = { x: e.clientX, y: e.clientY };
        this.touchMovedDistance = 0;
        this.lastBuiltCoord = null;

        const coord = this.getCoordFromClient(e.clientX, e.clientY);
        if (coord) {
          this.hoveredCoord = coord;
          this.selectTile(coord.x, coord.z);

          // Only in Rapid mode does mousedown immediately place
          if (this.buildModeActive && this.placementMode === 'rapid' && this.onCellClicked) {
            this.onCellClicked(coord.x, coord.z);
            this.flashTile(coord.x, coord.z, 0x22c55e);
            this.lastBuiltCoord = { x: coord.x, z: coord.z };
          }
        }
      } else if (e.button === 2) {
        this.isRightDragging = true;
        this.lastTouchPos = { x: e.clientX, y: e.clientY };
      }
    });

    el.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e: MouseEvent) => {
      const coord = this.getCoordFromClient(e.clientX, e.clientY);
      if (coord) {
        this.hoveredCoord = coord;
        this.hoverPlane.position.set(coord.x + 0.5, 0.05, coord.z + 0.5);
        this.hoverPlane.visible = true;

        if (this.buildModeActive && this.placementMode === 'rapid' && this.isPointerDown && this.onCellClicked) {
          this.selectTile(coord.x, coord.z);
          if (!this.lastBuiltCoord) {
            this.onCellClicked(coord.x, coord.z);
            this.flashTile(coord.x, coord.z, 0x22c55e);
            this.lastBuiltCoord = { x: coord.x, z: coord.z };
          } else if (this.lastBuiltCoord.x !== coord.x || this.lastBuiltCoord.z !== coord.z) {
            const path = this.getLinePath(this.lastBuiltCoord.x, this.lastBuiltCoord.z, coord.x, coord.z);
            for (let i = 1; i < path.length; i++) {
              const pt = path[i];
              this.onCellClicked(pt.x, pt.z);
              this.flashTile(pt.x, pt.z, 0x22c55e);
            }
            this.lastBuiltCoord = { x: coord.x, z: coord.z };
          }
        }
      }

      if (this.isRightDragging || (this.isPointerDown && e.shiftKey)) {
        const dx = (e.clientX - this.lastTouchPos.x) * 0.008;
        const dy = (e.clientY - this.lastTouchPos.y) * 0.008;
        this.cameraTheta -= dx;
        this.cameraPhi = Math.max(0.2, Math.min(Math.PI / 2.2, this.cameraPhi + dy));
        this.updateCameraTransform();
      } else if (this.isPointerDown && (this.placementMode === 'confirm' || !this.buildModeActive)) {
        // Safe navigation: panning while scrolling around does NOT place buildings!
        const dx = e.clientX - this.lastTouchPos.x;
        const dy = e.clientY - this.lastTouchPos.y;
        const netDist = Math.hypot(e.clientX - this.touchStartPos.x, e.clientY - this.touchStartPos.y);
        this.touchMovedDistance = Math.max(this.touchMovedDistance, netDist);

        if (netDist > 6) {
          this.panCameraTarget(dx, dy);
        }
      }

      this.lastTouchPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0) {
        const netDist = Math.hypot(e.clientX - this.touchStartPos.x, e.clientY - this.touchStartPos.y);
        // If it was an intentional click (not a camera scroll/pan)
        if (netDist < 12) {
          const coord = this.getCoordFromClient(e.clientX, e.clientY);
          if (coord) {
            this.selectTile(coord.x, coord.z);
            if (this.onCellClicked) {
              this.onCellClicked(coord.x, coord.z);
            }
          }
        }
        this.isPointerDown = false;
        this.lastBuiltCoord = null;
      } else if (e.button === 2) {
        this.isRightDragging = false;
      }
    });

    el.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.cameraRadius = Math.max(10, Math.min(70, this.cameraRadius + e.deltaY * 0.04));
      this.updateCameraTransform();
    }, { passive: false });

    window.addEventListener('resize', this.onResize);
  }

  // Mathematically accurate ground-plane camera panning relative to current camera yaw angle
  public panCameraTarget(dx: number, dy: number) {
    const factor = (this.cameraRadius / 32) * 0.035;
    const sinT = Math.sin(this.cameraTheta);
    const cosT = Math.cos(this.cameraTheta);
    // Screen right vector along X-Z plane
    const rightX = cosT;
    const rightZ = -sinT;
    // Screen up/forward vector along X-Z plane
    const fwdX = -sinT;
    const fwdZ = -cosT;

    this.cameraTarget.x += (-dx * rightX + dy * fwdX) * factor;
    this.cameraTarget.z += (-dx * rightZ + dy * fwdZ) * factor;

    this.cameraTarget.x = Math.max(1, Math.min(GRID_SIZE - 1, this.cameraTarget.x));
    this.cameraTarget.z = Math.max(1, Math.min(GRID_SIZE - 1, this.cameraTarget.z));
    this.updateCameraTransform();
  }

  // Directional Pan helper for UI buttons
  public panCameraDirection(dir: 'up' | 'down' | 'left' | 'right', distance = 5) {
    const sinT = Math.sin(this.cameraTheta);
    const cosT = Math.cos(this.cameraTheta);
    let dx = 0;
    let dz = 0;

    if (dir === 'up') {
      dx -= sinT * distance;
      dz -= cosT * distance;
    } else if (dir === 'down') {
      dx += sinT * distance;
      dz += cosT * distance;
    } else if (dir === 'left') {
      dx -= cosT * distance;
      dz += sinT * distance;
    } else if (dir === 'right') {
      dx += cosT * distance;
      dz -= sinT * distance;
    }

    this.cameraTarget.x = Math.max(1, Math.min(GRID_SIZE - 1, this.cameraTarget.x + dx));
    this.cameraTarget.z = Math.max(1, Math.min(GRID_SIZE - 1, this.cameraTarget.z + dz));
    this.updateCameraTransform();
  }

  // Zoom Overview helper
  public zoomOverview() {
    this.cameraTarget.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    this.cameraRadius = 55;
    this.updateCameraTransform();
  }

  public setHoverColor(hexColor: number) {
    (this.hoverPlane.material as THREE.MeshBasicMaterial).color.setHex(hexColor);
    (this.selectedTileMesh.material as THREE.LineBasicMaterial).color.setHex(hexColor);
  }

  private updateCameraTransform() {
    const x = this.cameraTarget.x + this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    const y = this.cameraTarget.y + this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraTarget.z + this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  public setContactShadows(enabled: boolean) {
    this.renderer.shadowMap.enabled = enabled;
    this.sunLight.castShadow = enabled;
  }

  public resetCamera() {
    this.cameraTarget.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    this.cameraRadius = 36;
    this.cameraTheta = Math.PI / 4;
    this.cameraPhi = Math.PI / 3.4;
    this.updateCameraTransform();
  }

  public zoomCamera(delta: number) {
    this.cameraRadius = Math.max(10, Math.min(70, this.cameraRadius + delta));
    this.updateCameraTransform();
  }

  public rotateCamera(deltaTheta: number) {
    this.cameraTheta += deltaTheta;
    this.updateCameraTransform();
  }

  public panCamera(dx: number, dz: number) {
    this.cameraTarget.x = Math.max(1, Math.min(GRID_SIZE - 1, this.cameraTarget.x + dx));
    this.cameraTarget.z = Math.max(1, Math.min(GRID_SIZE - 1, this.cameraTarget.z + dz));
    this.updateCameraTransform();
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / (h || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private startLoop() {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Rotate windmill blades
      this.windTurbineRotors.forEach((rotor) => {
        rotor.rotation.z += delta * 2.8;
      });

      // Animate smoke particles
      this.smokeParticles.forEach((sp) => {
        sp.mesh.position.y += delta * sp.speed;
        const age = sp.mesh.position.y - sp.initialY;
        const scale = 1 + age * 1.5;
        sp.mesh.scale.set(scale, scale, scale);
        (sp.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.45 - age * 0.3);

        if (age > 1.4) {
          sp.mesh.position.y = sp.initialY;
          sp.mesh.scale.set(1, 1, 1);
        }
      });

      // Advance lively entities (cars and pedestrians) smoothly at 60 FPS!
      this.city.updateLivelyEntities(delta);

      // Subtle breathing / idle sway for citizens gathered in the parks!
      if (this.parkCitizens.length > 0) {
        const t = currentTime * 0.0025;
        for (let i = 0; i < this.parkCitizens.length; i++) {
          const c = this.parkCitizens[i];
          c.rotation.y += Math.sin(t + i * 1.3) * 0.003;
          c.position.y += Math.sin(t * 2 + i * 0.9) * 0.0002;
        }
      }

      this.updateDayNightCycle();
      this.updateVehiclesRendering();
      this.updatePedestriansRendering();

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public dispose() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
