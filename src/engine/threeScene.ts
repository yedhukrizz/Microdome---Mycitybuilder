import * as THREE from 'three';
import { ActiveTool, BuildingData, CellData, OverlayMode, ServiceType, Vehicle, ZoneType, RaiderEntity, MilitiaEntity, CombatShot } from '../types/city';
import { CityManager, GRID_SIZE } from './cityGrid';

const MAX_VEHICLE_POOL = 45;
const MAX_PEDESTRIAN_POOL = 60;

interface VehicleSubModel {
  container: THREE.Group;
  bodyMeshes: THREE.Mesh[];
  wheels: THREE.Mesh[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  taxiSign?: THREE.Mesh;
}

interface VehiclePoolItem {
  group: THREE.Group;
  models: {
    sedan: VehicleSubModel;
    suv: VehicleSubModel;
    hatchback: VehicleSubModel;
    race_car: VehicleSubModel;
    bus: VehicleSubModel;
    tram: VehicleSubModel;
  };
}

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
  private raiderGroup: THREE.Group;
  private militiaGroup: THREE.Group;
  private combatFXGroup: THREE.Group;

  // Interaction
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoverPlane: THREE.Mesh;
  private selectedTileMesh: THREE.LineSegments;
  public hoveredCoord: { x: number; z: number } | null = null;
  public selectedTileCoord: { x: number; z: number } | null = null;
  public onCellClicked?: (x: number, z: number) => void;
  public onCrash?: () => void;
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

  // Vehicle Object Pool (Zero Allocation Lag Elimination)
  private vehiclePool: VehiclePoolItem[] = [];

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
  private defenseTurretMeshes: { group: THREE.Group; turretHead: THREE.Group; x: number; z: number }[] = [];
  private tollPlazaMeshes: { group: THREE.Group; barrierArms: THREE.Mesh[]; beaconLights: THREE.Mesh[]; x: number; z: number }[] = [];
  private raiderMeshMap: Map<string, THREE.Group> = new Map();
  private militiaMeshMap: Map<string, THREE.Group> = new Map();
  private activeTracerLines: THREE.Line[] = [];
  private explosionParticles: { mesh: THREE.Mesh; life: number; maxLife: number; vx: number; vy: number; vz: number }[] = [];

  // Frustum Culling for high-performance rendering of large cities
  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();

  // Stored event handlers for clean unbinding
  private boundOnMouseMove?: (e: MouseEvent) => void;
  private boundOnMouseUp?: (e: MouseEvent) => void;
  private boundOnWheel?: (e: WheelEvent) => void;
  private boundOnTouchStart?: (e: TouchEvent) => void;
  private boundOnTouchMove?: (e: TouchEvent) => void;
  private boundOnTouchEnd?: (e: TouchEvent) => void;
  private boundOnMouseDown?: (e: MouseEvent) => void;
  private boundOnContextMenu?: (e: Event) => void;

  constructor(container: HTMLElement, city: CityManager) {
    this.container = container;
    this.city = city;

    // 1. Scene & Atmosphere (Minimal pastel aesthetic)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe8f2f8);
    this.scene.fog = new THREE.FogExp2(0xe8f2f8, 0.0065);

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 2000);
    this.updateCameraTransform();

    // 3. Renderer with multi-tier fallback & GPU context protection
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    let renderer: THREE.WebGLRenderer | null = null;
    const clientW = Math.max(container.clientWidth, 320);
    const clientH = Math.max(container.clientHeight, 240);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
        precision: 'mediump',
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (e1) {
      console.warn('Primary WebGLRenderer creation failed, trying fallback...', e1);
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: false,
          powerPreference: 'default',
          precision: 'lowp',
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: true,
          failIfMajorPerformanceCaveat: false,
        });
      } catch (e2) {
        console.error('All WebGLRenderer creation attempts failed:', e2);
        throw new Error('WEBGL_CONTEXT_BLOCKED');
      }
    }

    this.renderer = renderer;
    this.renderer.setSize(clientW, clientH);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Prevent graphic glitches and handle context loss on mobile / MediaTek devices
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('WebGL context lost. Pausing render loop and notifying app...');
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (this.onCrash) {
        this.onCrash();
      }
    }, false);

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.info('WebGL context restored. Rebuilding scene & restarting render loop...');
      try {
        this.initSharedResources();
        this.buildTerrain();
        this.buildFoliage();
        this.rebuildCityScene();
        this.startLoop();
      } catch (err) {
        console.error('Failed to restore after contextrestored:', err);
        if (this.onCrash) this.onCrash();
      }
    }, false);

    // 4. Warm Soft Isometric Lights
    this.ambientLight = new THREE.AmbientLight(0xfffdf7, 0.82);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xfefcf6, 0x93c5fd, 0.5);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff8ed, 1.1);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 512;
    this.sunLight.shadow.mapSize.height = 512;
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
    this.raiderGroup = new THREE.Group();
    this.militiaGroup = new THREE.Group();
    this.combatFXGroup = new THREE.Group();

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
    this.scene.add(this.raiderGroup);
    this.scene.add(this.militiaGroup);
    this.scene.add(this.combatFXGroup);

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

  private createProceduralTexture(type: 'asphalt' | 'brick' | 'roof' | 'concrete' | 'windowGrid'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (type === 'asphalt') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 1500; i++) {
          const x = Math.random() * 128;
          const y = Math.random() * 128;
          ctx.fillStyle = Math.random() > 0.5 ? '#334155' : '#64748b';
          ctx.fillRect(x, y, 1, 1);
        }
      } else if (type === 'brick') {
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#7c2d12';
        for (let y = 0; y < 128; y += 16) {
          ctx.fillRect(0, y, 128, 2);
        }
      } else if (type === 'roof') {
        ctx.fillStyle = '#78716c';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#44403c';
        for (let x = 0; x < 128; x += 16) {
          ctx.fillRect(x, 0, 3, 128);
        }
      } else if (type === 'concrete') {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 1000; i++) {
          const x = Math.random() * 128;
          const y = Math.random() * 128;
          ctx.fillStyle = Math.random() > 0.5 ? '#94a3b8' : '#e2e8f0';
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      } else if (type === 'windowGrid') {
        const grad = ctx.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#312e81');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        
        ctx.fillStyle = 'rgba(129, 140, 248, 0.25)';
        for (let x = 16; x < 128; x += 32) {
          ctx.fillRect(x, 0, 2, 128);
        }
        for (let y = 16; y < 128; y += 32) {
          ctx.fillRect(0, y, 128, 2);
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  private initSharedResources() {
    const asphaltTex = this.createProceduralTexture('asphalt');
    const brickTex = this.createProceduralTexture('brick');
    const roofTex = this.createProceduralTexture('roof');
    const concreteTex = this.createProceduralTexture('concrete');
    const windowGridTex = this.createProceduralTexture('windowGrid');

    // Geometries
    this.sharedGeos.car = new THREE.BoxGeometry(0.18, 0.1, 0.32);
    this.sharedGeos.bus = new THREE.BoxGeometry(0.24, 0.16, 0.55);
    this.sharedGeos.headlight = new THREE.SphereGeometry(0.026, 4, 4);
    this.sharedGeos.taillight = new THREE.BoxGeometry(0.035, 0.025, 0.01);

    // Modular Vehicle Geometries (Tires, Rims, Windows, Bodies, Accessories)
    const makeWheelGeo = (r: number, w: number, segs = 10) => {
      const g = new THREE.CylinderGeometry(r, r, w, segs);
      g.rotateZ(Math.PI / 2);
      return g;
    };

    // Wheels (Tires & Hubcap Rims)
    this.sharedGeos.tireCar = makeWheelGeo(0.040, 0.024, 10);
    this.sharedGeos.tireSuv = makeWheelGeo(0.048, 0.030, 10);
    this.sharedGeos.tireRace = makeWheelGeo(0.042, 0.036, 10);
    this.sharedGeos.tireBus = makeWheelGeo(0.052, 0.034, 10);
    this.sharedGeos.tireTram = makeWheelGeo(0.038, 0.024, 10);

    this.sharedGeos.rimCar = makeWheelGeo(0.024, 0.026, 8);
    this.sharedGeos.rimSuv = makeWheelGeo(0.028, 0.032, 8);
    this.sharedGeos.rimRace = makeWheelGeo(0.026, 0.038, 8);
    this.sharedGeos.rimBus = makeWheelGeo(0.030, 0.036, 8);
    this.sharedGeos.rimTram = makeWheelGeo(0.022, 0.026, 8);

    // Sedan Geometries
    this.sharedGeos.sedanChassis = new THREE.BoxGeometry(0.18, 0.045, 0.38);
    this.sharedGeos.sedanCabin = new THREE.BoxGeometry(0.155, 0.045, 0.19);
    this.sharedGeos.sedanWindshield = new THREE.BoxGeometry(0.152, 0.042, 0.03);
    this.sharedGeos.sedanSideWin = new THREE.BoxGeometry(0.012, 0.036, 0.15);
    this.sharedGeos.sedanGrille = new THREE.BoxGeometry(0.12, 0.02, 0.01);
    this.sharedGeos.taxiSign = new THREE.BoxGeometry(0.07, 0.022, 0.035);

    // SUV Geometries
    this.sharedGeos.suvChassis = new THREE.BoxGeometry(0.20, 0.055, 0.42);
    this.sharedGeos.suvCabin = new THREE.BoxGeometry(0.175, 0.065, 0.26);
    this.sharedGeos.suvWindshield = new THREE.BoxGeometry(0.172, 0.055, 0.03);
    this.sharedGeos.suvTailgate = new THREE.BoxGeometry(0.172, 0.055, 0.02);
    this.sharedGeos.suvSideWin = new THREE.BoxGeometry(0.012, 0.050, 0.22);
    this.sharedGeos.suvRoofRail = new THREE.BoxGeometry(0.01, 0.012, 0.24);
    this.sharedGeos.suvGrille = new THREE.BoxGeometry(0.14, 0.032, 0.01);

    // Hatchback Geometries
    this.sharedGeos.hatchChassis = new THREE.BoxGeometry(0.18, 0.048, 0.35);
    this.sharedGeos.hatchCabin = new THREE.BoxGeometry(0.155, 0.055, 0.21);
    this.sharedGeos.hatchWindshield = new THREE.BoxGeometry(0.152, 0.048, 0.03);
    this.sharedGeos.hatchRearWin = new THREE.BoxGeometry(0.152, 0.046, 0.03);
    this.sharedGeos.hatchSideWin = new THREE.BoxGeometry(0.012, 0.042, 0.17);
    this.sharedGeos.hatchSpoiler = new THREE.BoxGeometry(0.15, 0.01, 0.035);

    // Race Car Geometries
    this.sharedGeos.raceChassis = new THREE.BoxGeometry(0.20, 0.034, 0.44);
    this.sharedGeos.raceSplitter = new THREE.BoxGeometry(0.21, 0.008, 0.06);
    this.sharedGeos.raceCanopy = new THREE.BoxGeometry(0.13, 0.038, 0.17);
    this.sharedGeos.raceStripe = new THREE.BoxGeometry(0.04, 0.002, 0.40);
    this.sharedGeos.raceWingBlade = new THREE.BoxGeometry(0.21, 0.012, 0.045);
    this.sharedGeos.raceWingStrut = new THREE.BoxGeometry(0.008, 0.055, 0.02);

    // Bus Geometries
    this.sharedGeos.busChassis = new THREE.BoxGeometry(0.23, 0.15, 0.66);
    this.sharedGeos.busWindshield = new THREE.BoxGeometry(0.22, 0.082, 0.02);
    this.sharedGeos.busBanner = new THREE.BoxGeometry(0.18, 0.022, 0.01);
    this.sharedGeos.busSideWin = new THREE.BoxGeometry(0.01, 0.065, 0.52);
    this.sharedGeos.busRearWin = new THREE.BoxGeometry(0.19, 0.06, 0.01);
    this.sharedGeos.busAc = new THREE.BoxGeometry(0.15, 0.025, 0.13);

    // Tram Geometries
    this.sharedGeos.tramChassis = new THREE.BoxGeometry(0.21, 0.14, 0.76);
    this.sharedGeos.tramWindshield = new THREE.BoxGeometry(0.19, 0.075, 0.02);
    this.sharedGeos.tramSideWin = new THREE.BoxGeometry(0.01, 0.058, 0.62);
    this.sharedGeos.tramRoofPod = new THREE.BoxGeometry(0.15, 0.025, 0.30);
    this.sharedGeos.tramPantographBase = new THREE.BoxGeometry(0.08, 0.015, 0.08);
    this.sharedGeos.tramPantographArm = new THREE.BoxGeometry(0.01, 0.06, 0.01);
    this.sharedGeos.tramPantographBar = new THREE.BoxGeometry(0.14, 0.01, 0.015);

    // Pedestrian Shared Geometries (Scaled down for realistic proportions)
    this.sharedGeos.pedHead = new THREE.SphereGeometry(0.03, 6, 6);
    this.sharedGeos.pedBody = new THREE.BoxGeometry(0.05, 0.06, 0.04);
    this.sharedGeos.pedLegs = new THREE.BoxGeometry(0.04, 0.045, 0.035);

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
    this.materials.asphalt = new THREE.MeshStandardMaterial({
      color: 0x505d6e,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    this.materials.highwayAsphalt = new THREE.MeshStandardMaterial({
      color: 0x414d5e,
      roughness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    this.materials.roadLine = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5,
    });
    this.materials.crosswalk = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5,
    });
    this.materials.highwayYellow = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5,
    });
    this.materials.sidewalk = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.materials.curb = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    // 1. Residential Palette: Warm community neighborhood tones (terracotta, cream, mint, sage, blush, cedar wood)
    this.materials.resMint = new THREE.MeshStandardMaterial({ color: 0xa7f3d0, roughness: 0.65 });
    this.materials.resCream = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.65 });
    this.materials.resBlush = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.65 });
    this.materials.resLavender = new THREE.MeshStandardMaterial({ color: 0xe9d5ff, roughness: 0.65 });
    this.materials.resPowder = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.65 });
    this.materials.resTerracotta = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.75,
      map: roofTex,
      bumpMap: roofTex,
      bumpScale: 0.03,
    });
    this.materials.resSage = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.7 });
    this.materials.resWood = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
    this.materials.resDarkWood = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    this.materials.resParapet = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    this.materials.resBrickChimney = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85, map: brickTex, bumpMap: brickTex, bumpScale: 0.03 });
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
      map: windowGridTex,
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
    this.materials.indBrick = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.9,
      map: brickTex,
      bumpMap: brickTex,
      bumpScale: 0.04,
    });
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

    // Shared Vehicle Materials
    this.materials.wheelRubber = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.9,
    });
    this.materials.wheelRim = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.35,
      metalness: 0.75,
    });
    this.materials.wheelGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.8,
    });
    this.materials.carGlass = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.12,
      metalness: 0.75,
    });
    this.materials.carGrille = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.85,
    });
    this.materials.roofRail = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.4,
      metalness: 0.6,
    });
    this.materials.raceSpoiler = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.5,
    });
    this.materials.raceStripe = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
    });
    this.materials.tramPantograph = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.85,
    });
    this.materials.busBanner = new THREE.MeshStandardMaterial({
      color: 0x111827,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.75,
      roughness: 0.4,
    });
    this.materials.taxiSign = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });

    // Pedestrian Materials
    this.materials.pedSkin = new THREE.MeshStandardMaterial({ color: 0xfbd0b8, roughness: 0.8 });
    this.materials.pedPants = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });

    // Weathered & Dimmed Abandoned Building Materials (Preserves model structure in dim colors)
    this.materials.abandonedWall = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
    this.materials.abandonedTrim = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.98 });
    this.materials.abandonedWood = new THREE.MeshStandardMaterial({ color: 0x3f352e, roughness: 0.98 });
    this.materials.abandonedGlass = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.1 });
    this.materials.abandonedSign = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 });

    // Shared Building Base Geometries
    this.sharedGeos.frontWalk = new THREE.BoxGeometry(0.9, 0.02, 0.35);
    this.sharedGeos.sidePebble = new THREE.BoxGeometry(0.35, 0.022, 0.45);
    this.sharedGeos.bush = new THREE.SphereGeometry(0.05, 5, 5);
    this.sharedGeos.smallTrunk = new THREE.CylinderGeometry(0.012, 0.015, 0.22, 4);
    this.sharedGeos.smallFoliage = new THREE.ConeGeometry(0.1, 0.26, 5);
    this.sharedGeos.lampPost = new THREE.CylinderGeometry(0.006, 0.006, 0.1, 4);
    this.sharedGeos.lampBulb = new THREE.SphereGeometry(0.018, 6, 6);

    // Shared Building Base Materials
    this.materials.walkMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 });
    this.materials.pebbleMat = new THREE.MeshStandardMaterial({ color: 0xc8b6a6, roughness: 0.9 });
    this.materials.bushMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
    this.materials.smallTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    this.materials.smallFoliageMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.75 });
    this.materials.lampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    this.materials.bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfde047,
      emissiveIntensity: 0.8,
    });
    this.streetLightMaterials.push(this.materials.bulbMat as THREE.MeshStandardMaterial);
  }

  private isSharedGeometry(geo: THREE.BufferGeometry): boolean {
    return Object.values(this.sharedGeos).includes(geo);
  }

  private isSharedMaterial(mat: THREE.Material): boolean {
    return Object.values(this.materials).includes(mat);
  }

  public disposeHierarchy(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh || (child as THREE.LineSegments).isLineSegments) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry && !this.isSharedGeometry(mesh.geometry)) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              if (m && !this.isSharedMaterial(m)) {
                if ('map' in m && m.map && !Object.values(this.materials).some(sm => 'map' in sm && (sm as any).map === m.map)) {
                  (m.map as THREE.Texture).dispose();
                }
                m.dispose();
              }
            });
          } else {
            const m = mesh.material;
            if (m && !this.isSharedMaterial(m)) {
              if ('map' in m && m.map && !Object.values(this.materials).some(sm => 'map' in sm && (sm as any).map === m.map)) {
                (m.map as THREE.Texture).dispose();
              }
              m.dispose();
            }
          }
        }
      }
    });
    obj.clear();
  }

  private createWheelMesh(
    tireGeo: THREE.BufferGeometry,
    rimGeo: THREE.BufferGeometry,
    tireMat: THREE.Material,
    rimMat: THREE.Material
  ): THREE.Mesh {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    tire.add(rim);
    return tire;
  }

  private buildSedanModel(): VehicleSubModel {
    const container = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.45 });

    // Chassis & Cabin
    const chassis = new THREE.Mesh(this.sharedGeos.sedanChassis, bodyMat);
    chassis.position.set(0, 0.045, 0);
    chassis.castShadow = true;
    container.add(chassis);

    const cabin = new THREE.Mesh(this.sharedGeos.sedanCabin, bodyMat);
    cabin.position.set(0, 0.082, -0.015);
    cabin.castShadow = true;
    container.add(cabin);

    // Windows
    const windshield = new THREE.Mesh(this.sharedGeos.sedanWindshield, this.materials.carGlass);
    windshield.position.set(0, 0.078, 0.082);
    windshield.rotation.x = 0.28;
    container.add(windshield);

    const rearWin = new THREE.Mesh(this.sharedGeos.sedanWindshield, this.materials.carGlass);
    rearWin.position.set(0, 0.078, -0.11);
    rearWin.rotation.x = -0.28;
    container.add(rearWin);

    const leftWin = new THREE.Mesh(this.sharedGeos.sedanSideWin, this.materials.carGlass);
    leftWin.position.set(0.076, 0.082, -0.015);
    container.add(leftWin);

    const rightWin = new THREE.Mesh(this.sharedGeos.sedanSideWin, this.materials.carGlass);
    rightWin.position.set(-0.076, 0.082, -0.015);
    container.add(rightWin);

    // Front Grille
    const grille = new THREE.Mesh(this.sharedGeos.sedanGrille, this.materials.carGrille);
    grille.position.set(0, 0.040, 0.191);
    container.add(grille);

    // Wheels
    const wheels: THREE.Mesh[] = [];
    const wFL = this.createWheelMesh(this.sharedGeos.tireCar, this.sharedGeos.rimCar, this.materials.wheelRubber, this.materials.wheelRim);
    wFL.position.set(0.095, 0.038, 0.11);
    container.add(wFL);
    wheels.push(wFL);

    const wFR = this.createWheelMesh(this.sharedGeos.tireCar, this.sharedGeos.rimCar, this.materials.wheelRubber, this.materials.wheelRim);
    wFR.position.set(-0.095, 0.038, 0.11);
    container.add(wFR);
    wheels.push(wFR);

    const wRL = this.createWheelMesh(this.sharedGeos.tireCar, this.sharedGeos.rimCar, this.materials.wheelRubber, this.materials.wheelRim);
    wRL.position.set(0.095, 0.038, -0.11);
    container.add(wRL);
    wheels.push(wRL);

    const wRR = this.createWheelMesh(this.sharedGeos.tireCar, this.sharedGeos.rimCar, this.materials.wheelRubber, this.materials.wheelRim);
    wRR.position.set(-0.095, 0.038, -0.11);
    container.add(wRR);
    wheels.push(wRR);

    // Headlights
    const hl1 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl1.position.set(0.06, 0.044, 0.192);
    container.add(hl1);

    const hl2 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl2.position.set(-0.06, 0.044, 0.192);
    container.add(hl2);

    // Taillights
    const tl1 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl1.position.set(0.06, 0.046, -0.191);
    container.add(tl1);

    const tl2 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl2.position.set(-0.06, 0.046, -0.191);
    container.add(tl2);

    // Taxi Sign
    const taxiSign = new THREE.Mesh(this.sharedGeos.taxiSign, this.materials.taxiSign);
    taxiSign.position.set(0, 0.115, -0.015);
    taxiSign.visible = false;
    container.add(taxiSign);

    return {
      container,
      bodyMeshes: [chassis, cabin],
      wheels,
      headlights: [hl1, hl2],
      taillights: [tl1, tl2],
      taxiSign,
    };
  }

  private buildSuvModel(): VehicleSubModel {
    const container = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });

    // Chassis & Tall Cabin
    const chassis = new THREE.Mesh(this.sharedGeos.suvChassis, bodyMat);
    chassis.position.set(0, 0.055, 0);
    chassis.castShadow = true;
    container.add(chassis);

    const cabin = new THREE.Mesh(this.sharedGeos.suvCabin, bodyMat);
    cabin.position.set(0, 0.108, -0.03);
    cabin.castShadow = true;
    container.add(cabin);

    // Roof Rails
    const railL = new THREE.Mesh(this.sharedGeos.suvRoofRail, this.materials.roofRail);
    railL.position.set(0.075, 0.146, -0.03);
    container.add(railL);

    const railR = new THREE.Mesh(this.sharedGeos.suvRoofRail, this.materials.roofRail);
    railR.position.set(-0.075, 0.146, -0.03);
    container.add(railR);

    // Windows
    const windshield = new THREE.Mesh(this.sharedGeos.suvWindshield, this.materials.carGlass);
    windshield.position.set(0, 0.105, 0.102);
    windshield.rotation.x = 0.22;
    container.add(windshield);

    const tailgate = new THREE.Mesh(this.sharedGeos.suvTailgate, this.materials.carGlass);
    tailgate.position.set(0, 0.105, -0.161);
    container.add(tailgate);

    const leftWin = new THREE.Mesh(this.sharedGeos.suvSideWin, this.materials.carGlass);
    leftWin.position.set(0.086, 0.108, -0.03);
    container.add(leftWin);

    const rightWin = new THREE.Mesh(this.sharedGeos.suvSideWin, this.materials.carGlass);
    rightWin.position.set(-0.086, 0.108, -0.03);
    container.add(rightWin);

    // Front Rugged Grille
    const grille = new THREE.Mesh(this.sharedGeos.suvGrille, this.materials.carGrille);
    grille.position.set(0, 0.055, 0.211);
    container.add(grille);

    // Wheels (4 SUV wheels)
    const wheels: THREE.Mesh[] = [];
    const wFL = this.createWheelMesh(this.sharedGeos.tireSuv, this.sharedGeos.rimSuv, this.materials.wheelRubber, this.materials.wheelRim);
    wFL.position.set(0.106, 0.046, 0.125);
    container.add(wFL);
    wheels.push(wFL);

    const wFR = this.createWheelMesh(this.sharedGeos.tireSuv, this.sharedGeos.rimSuv, this.materials.wheelRubber, this.materials.wheelRim);
    wFR.position.set(-0.106, 0.046, 0.125);
    container.add(wFR);
    wheels.push(wFR);

    const wRL = this.createWheelMesh(this.sharedGeos.tireSuv, this.sharedGeos.rimSuv, this.materials.wheelRubber, this.materials.wheelRim);
    wRL.position.set(0.106, 0.046, -0.125);
    container.add(wRL);
    wheels.push(wRL);

    const wRR = this.createWheelMesh(this.sharedGeos.tireSuv, this.sharedGeos.rimSuv, this.materials.wheelRubber, this.materials.wheelRim);
    wRR.position.set(-0.106, 0.046, -0.125);
    container.add(wRR);
    wheels.push(wRR);

    // Headlights
    const hl1 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl1.position.set(0.072, 0.060, 0.212);
    container.add(hl1);

    const hl2 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl2.position.set(-0.072, 0.060, 0.212);
    container.add(hl2);

    // Taillights
    const tl1 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl1.position.set(0.072, 0.066, -0.211);
    container.add(tl1);

    const tl2 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl2.position.set(-0.072, 0.066, -0.211);
    container.add(tl2);

    return {
      container,
      bodyMeshes: [chassis, cabin],
      wheels,
      headlights: [hl1, hl2],
      taillights: [tl1, tl2],
    };
  }

  private buildHatchbackModel(): VehicleSubModel {
    const container = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.45 });

    // Chassis & Cabin
    const chassis = new THREE.Mesh(this.sharedGeos.hatchChassis, bodyMat);
    chassis.position.set(0, 0.048, 0);
    chassis.castShadow = true;
    container.add(chassis);

    const cabin = new THREE.Mesh(this.sharedGeos.hatchCabin, bodyMat);
    cabin.position.set(0, 0.092, -0.02);
    cabin.castShadow = true;
    container.add(cabin);

    // Rear Roof Spoiler
    const spoiler = new THREE.Mesh(this.sharedGeos.hatchSpoiler, this.materials.carGrille);
    spoiler.position.set(0, 0.122, -0.128);
    container.add(spoiler);

    // Windows
    const windshield = new THREE.Mesh(this.sharedGeos.hatchWindshield, this.materials.carGlass);
    windshield.position.set(0, 0.088, 0.082);
    windshield.rotation.x = 0.32;
    container.add(windshield);

    const hatchRear = new THREE.Mesh(this.sharedGeos.hatchRearWin, this.materials.carGlass);
    hatchRear.position.set(0, 0.086, -0.126);
    hatchRear.rotation.x = -0.38;
    container.add(hatchRear);

    const leftWin = new THREE.Mesh(this.sharedGeos.hatchSideWin, this.materials.carGlass);
    leftWin.position.set(0.076, 0.092, -0.02);
    container.add(leftWin);

    const rightWin = new THREE.Mesh(this.sharedGeos.hatchSideWin, this.materials.carGlass);
    rightWin.position.set(-0.076, 0.092, -0.02);
    container.add(rightWin);

    // Wheels
    const wheels: THREE.Mesh[] = [];
    const wFL = this.createWheelMesh(this.sharedGeos.tireCar, this.sharedGeos.rimCar, this.materials.wheelRubber, this.materials.wheelRim);
    wFL.position.set(0.094, 0.038, 0.10);
    container.add(wFL);
    wheels.push(wFL);

    const wFR = this.createWheelMesh(this.sharedGeos.tireCar, this.sharedGeos.rimCar, this.materials.wheelRubber, this.materials.wheelRim);
    wFR.position.set(-0.094, 0.038, 0.10);
    container.add(wFR);
    wheels.push(wFR);

    const wRL = this.createWheelMesh(this.sharedGeos.tireCar, this.sharedGeos.rimCar, this.materials.wheelRubber, this.materials.wheelRim);
    wRL.position.set(0.094, 0.038, -0.10);
    container.add(wRL);
    wheels.push(wRL);

    const wRR = this.createWheelMesh(this.sharedGeos.tireCar, this.sharedGeos.rimCar, this.materials.wheelRubber, this.materials.wheelRim);
    wRR.position.set(-0.094, 0.038, -0.10);
    container.add(wRR);
    wheels.push(wRR);

    // Headlights
    const hl1 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl1.position.set(0.06, 0.046, 0.176);
    container.add(hl1);

    const hl2 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl2.position.set(-0.06, 0.046, 0.176);
    container.add(hl2);

    // Taillights
    const tl1 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl1.position.set(0.06, 0.052, -0.176);
    container.add(tl1);

    const tl2 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl2.position.set(-0.06, 0.052, -0.176);
    container.add(tl2);

    return {
      container,
      bodyMeshes: [chassis, cabin],
      wheels,
      headlights: [hl1, hl2],
      taillights: [tl1, tl2],
    };
  }

  private buildRaceCarModel(): VehicleSubModel {
    const container = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.25 });

    // Low Aerodynamic Chassis & Splitter
    const chassis = new THREE.Mesh(this.sharedGeos.raceChassis, bodyMat);
    chassis.position.set(0, 0.036, 0);
    chassis.castShadow = true;
    container.add(chassis);

    const splitter = new THREE.Mesh(this.sharedGeos.raceSplitter, this.materials.carGrille);
    splitter.position.set(0, 0.022, 0.20);
    container.add(splitter);

    // Streamlined Cockpit Canopy (Tinted Visor Glass)
    const canopy = new THREE.Mesh(this.sharedGeos.raceCanopy, this.materials.carGlass);
    canopy.position.set(0, 0.062, -0.02);
    canopy.rotation.x = 0.15;
    container.add(canopy);

    // Center Racing Stripe
    const stripe = new THREE.Mesh(this.sharedGeos.raceStripe, this.materials.raceStripe);
    stripe.position.set(0, 0.054, 0);
    container.add(stripe);

    // High Downforce Rear Spoiler / Wing
    const wingBlade = new THREE.Mesh(this.sharedGeos.raceWingBlade, this.materials.raceSpoiler);
    wingBlade.position.set(0, 0.092, -0.185);
    container.add(wingBlade);

    const strutL = new THREE.Mesh(this.sharedGeos.raceWingStrut, this.materials.raceSpoiler);
    strutL.position.set(0.065, 0.064, -0.185);
    container.add(strutL);

    const strutR = new THREE.Mesh(this.sharedGeos.raceWingStrut, this.materials.raceSpoiler);
    strutR.position.set(-0.065, 0.064, -0.185);
    container.add(strutR);

    // Wheels (4 wide racing slicks with gold alloy rims)
    const wheels: THREE.Mesh[] = [];
    const wFL = this.createWheelMesh(this.sharedGeos.tireRace, this.sharedGeos.rimRace, this.materials.wheelRubber, this.materials.wheelGold);
    wFL.position.set(0.106, 0.038, 0.13);
    container.add(wFL);
    wheels.push(wFL);

    const wFR = this.createWheelMesh(this.sharedGeos.tireRace, this.sharedGeos.rimRace, this.materials.wheelRubber, this.materials.wheelGold);
    wFR.position.set(-0.106, 0.038, 0.13);
    container.add(wFR);
    wheels.push(wFR);

    const wRL = this.createWheelMesh(this.sharedGeos.tireRace, this.sharedGeos.rimRace, this.materials.wheelRubber, this.materials.wheelGold);
    wRL.position.set(0.106, 0.038, -0.12);
    container.add(wRL);
    wheels.push(wRL);

    const wRR = this.createWheelMesh(this.sharedGeos.tireRace, this.sharedGeos.rimRace, this.materials.wheelRubber, this.materials.wheelGold);
    wRR.position.set(-0.106, 0.038, -0.12);
    container.add(wRR);
    wheels.push(wRR);

    // Racing LED Headlights
    const hl1 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl1.position.set(0.075, 0.038, 0.222);
    container.add(hl1);

    const hl2 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl2.position.set(-0.075, 0.038, 0.222);
    container.add(hl2);

    // Center Rain/Brake Light
    const tl1 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl1.position.set(0, 0.036, -0.221);
    container.add(tl1);

    return {
      container,
      bodyMeshes: [chassis],
      wheels,
      headlights: [hl1, hl2],
      taillights: [tl1],
    };
  }

  private buildBusModel(): VehicleSubModel {
    const container = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 });

    // Main Transit Bus Chassis
    const chassis = new THREE.Mesh(this.sharedGeos.busChassis, bodyMat);
    chassis.position.set(0, 0.098, 0);
    chassis.castShadow = true;
    container.add(chassis);

    // Panoramic Front Windshield
    const windshield = new THREE.Mesh(this.sharedGeos.busWindshield, this.materials.carGlass);
    windshield.position.set(0, 0.105, 0.331);
    container.add(windshield);

    // Amber Route Destination Display
    const banner = new THREE.Mesh(this.sharedGeos.busBanner, this.materials.busBanner);
    banner.position.set(0, 0.156, 0.332);
    container.add(banner);

    // Panoramic Side Windows
    const leftWin = new THREE.Mesh(this.sharedGeos.busSideWin, this.materials.carGlass);
    leftWin.position.set(0.116, 0.108, -0.02);
    container.add(leftWin);

    const rightWin = new THREE.Mesh(this.sharedGeos.busSideWin, this.materials.carGlass);
    rightWin.position.set(-0.116, 0.108, -0.02);
    container.add(rightWin);

    // Rear Window
    const rearWin = new THREE.Mesh(this.sharedGeos.busRearWin, this.materials.carGlass);
    rearWin.position.set(0, 0.108, -0.331);
    container.add(rearWin);

    // Rooftop AC Pods
    const ac1 = new THREE.Mesh(this.sharedGeos.busAc, this.materials.roofRail);
    ac1.position.set(0, 0.185, 0.09);
    container.add(ac1);

    const ac2 = new THREE.Mesh(this.sharedGeos.busAc, this.materials.roofRail);
    ac2.position.set(0, 0.185, -0.12);
    container.add(ac2);

    // Heavy Duty Bus Wheels
    const wheels: THREE.Mesh[] = [];
    const wFL = this.createWheelMesh(this.sharedGeos.tireBus, this.sharedGeos.rimBus, this.materials.wheelRubber, this.materials.wheelRim);
    wFL.position.set(0.118, 0.048, 0.20);
    container.add(wFL);
    wheels.push(wFL);

    const wFR = this.createWheelMesh(this.sharedGeos.tireBus, this.sharedGeos.rimBus, this.materials.wheelRubber, this.materials.wheelRim);
    wFR.position.set(-0.118, 0.048, 0.20);
    container.add(wFR);
    wheels.push(wFR);

    const wRL = this.createWheelMesh(this.sharedGeos.tireBus, this.sharedGeos.rimBus, this.materials.wheelRubber, this.materials.wheelRim);
    wRL.position.set(0.118, 0.048, -0.18);
    container.add(wRL);
    wheels.push(wRL);

    const wRR = this.createWheelMesh(this.sharedGeos.tireBus, this.sharedGeos.rimBus, this.materials.wheelRubber, this.materials.wheelRim);
    wRR.position.set(-0.118, 0.048, -0.18);
    container.add(wRR);
    wheels.push(wRR);

    // Headlights
    const hl1 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl1.position.set(0.08, 0.046, 0.332);
    container.add(hl1);

    const hl2 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl2.position.set(-0.08, 0.046, 0.332);
    container.add(hl2);

    // Taillights
    const tl1 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl1.position.set(0.08, 0.055, -0.332);
    container.add(tl1);

    const tl2 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl2.position.set(-0.08, 0.055, -0.332);
    container.add(tl2);

    return {
      container,
      bodyMeshes: [chassis],
      wheels,
      headlights: [hl1, hl2],
      taillights: [tl1, tl2],
    };
  }

  private buildTramModel(): VehicleSubModel {
    const container = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.45 });

    // Streamlined Streetcar Tram Body
    const chassis = new THREE.Mesh(this.sharedGeos.tramChassis, bodyMat);
    chassis.position.set(0, 0.092, 0);
    chassis.castShadow = true;
    container.add(chassis);

    // Driver Cab Windshields (Front & Rear)
    const frontWindshield = new THREE.Mesh(this.sharedGeos.tramWindshield, this.materials.carGlass);
    frontWindshield.position.set(0, 0.100, 0.381);
    container.add(frontWindshield);

    const rearWindshield = new THREE.Mesh(this.sharedGeos.tramWindshield, this.materials.carGlass);
    rearWindshield.position.set(0, 0.100, -0.381);
    container.add(rearWindshield);

    // Panoramic Side Windows
    const leftWin = new THREE.Mesh(this.sharedGeos.tramSideWin, this.materials.carGlass);
    leftWin.position.set(0.106, 0.100, 0);
    container.add(leftWin);

    const rightWin = new THREE.Mesh(this.sharedGeos.tramSideWin, this.materials.carGlass);
    rightWin.position.set(-0.106, 0.100, 0);
    container.add(rightWin);

    // Rooftop Inverter Pod
    const roofPod = new THREE.Mesh(this.sharedGeos.tramRoofPod, this.materials.roofRail);
    roofPod.position.set(0, 0.174, 0);
    container.add(roofPod);

    // Rooftop Pantograph (Electrical Power Collector)
    const pBase = new THREE.Mesh(this.sharedGeos.tramPantographBase, this.materials.tramPantograph);
    pBase.position.set(0, 0.188, 0.10);
    container.add(pBase);

    const pArm1 = new THREE.Mesh(this.sharedGeos.tramPantographArm, this.materials.tramPantograph);
    pArm1.position.set(0, 0.218, 0.08);
    pArm1.rotation.x = -0.4;
    container.add(pArm1);

    const pArm2 = new THREE.Mesh(this.sharedGeos.tramPantographArm, this.materials.tramPantograph);
    pArm2.position.set(0, 0.238, 0.11);
    pArm2.rotation.x = 0.4;
    container.add(pArm2);

    const pBar = new THREE.Mesh(this.sharedGeos.tramPantographBar, this.materials.tramPantograph);
    pBar.position.set(0, 0.258, 0.10);
    container.add(pBar);

    // Bogey Wheels under skirts
    const wheels: THREE.Mesh[] = [];
    const wFL = this.createWheelMesh(this.sharedGeos.tireTram, this.sharedGeos.rimTram, this.materials.wheelRubber, this.materials.wheelRim);
    wFL.position.set(0.098, 0.035, 0.22);
    container.add(wFL);
    wheels.push(wFL);

    const wFR = this.createWheelMesh(this.sharedGeos.tireTram, this.sharedGeos.rimTram, this.materials.wheelRubber, this.materials.wheelRim);
    wFR.position.set(-0.098, 0.035, 0.22);
    container.add(wFR);
    wheels.push(wFR);

    const wRL = this.createWheelMesh(this.sharedGeos.tireTram, this.sharedGeos.rimTram, this.materials.wheelRubber, this.materials.wheelRim);
    wRL.position.set(0.098, 0.035, -0.22);
    container.add(wRL);
    wheels.push(wRL);

    const wRR = this.createWheelMesh(this.sharedGeos.tireTram, this.sharedGeos.rimTram, this.materials.wheelRubber, this.materials.wheelRim);
    wRR.position.set(-0.098, 0.035, -0.22);
    container.add(wRR);
    wheels.push(wRR);

    // Front Headlights
    const hl1 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl1.position.set(0.065, 0.046, 0.382);
    container.add(hl1);

    const hl2 = new THREE.Mesh(this.sharedGeos.headlight, this.materials.headlight);
    hl2.position.set(-0.065, 0.046, 0.382);
    container.add(hl2);

    // Rear Taillights
    const tl1 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl1.position.set(0.065, 0.052, -0.382);
    container.add(tl1);

    const tl2 = new THREE.Mesh(this.sharedGeos.taillight, this.materials.taillight);
    tl2.position.set(-0.065, 0.052, -0.382);
    container.add(tl2);

    return {
      container,
      bodyMeshes: [chassis],
      wheels,
      headlights: [hl1, hl2],
      taillights: [tl1, tl2],
    };
  }

  // Pre-instantiated vehicle pool for zero-allocation performance
  private initVehiclePool() {
    this.vehicleGroup.clear();
    this.vehiclePool = [];

    for (let i = 0; i < MAX_VEHICLE_POOL; i++) {
      const vGroup = new THREE.Group();
      vGroup.visible = false;

      const sedan = this.buildSedanModel();
      const suv = this.buildSuvModel();
      const hatchback = this.buildHatchbackModel();
      const race_car = this.buildRaceCarModel();
      const bus = this.buildBusModel();
      const tram = this.buildTramModel();

      vGroup.add(sedan.container);
      vGroup.add(suv.container);
      vGroup.add(hatchback.container);
      vGroup.add(race_car.container);
      vGroup.add(bus.container);
      vGroup.add(tram.container);

      // Default sedan visible, others hidden
      sedan.container.visible = true;
      suv.container.visible = false;
      hatchback.container.visible = false;
      race_car.container.visible = false;
      bus.container.visible = false;
      tram.container.visible = false;

      this.vehicleGroup.add(vGroup);
      this.vehiclePool.push({
        group: vGroup,
        models: {
          sedan,
          suv,
          hatchback,
          race_car,
          bus,
          tram,
        },
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
      legs.position.y = 0.022;
      legs.castShadow = true;
      pGroup.add(legs);

      // Shirt / Torso
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 });
      const body = new THREE.Mesh(this.sharedGeos.pedBody, bodyMat);
      body.position.y = 0.068;
      body.castShadow = true;
      pGroup.add(body);

      // Head
      const head = new THREE.Mesh(this.sharedGeos.pedHead, this.materials.pedSkin);
      head.position.y = 0.115;
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
    this.disposeHierarchy(this.terrainGroup);

    const tileGeo = new THREE.BoxGeometry(1, 0.8, 1);
    tileGeo.translate(0, -0.4, 0);

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

    // Outer bedrock foundation (positioned deeply below terrain bottom)
    const baseGeo = new THREE.BoxGeometry(GRID_SIZE + 6, 4.0, GRID_SIZE + 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(GRID_SIZE / 2, -2.6, GRID_SIZE / 2);
    baseMesh.receiveShadow = true;
    this.terrainGroup.add(baseMesh);
  }

  public buildFoliage() {
    this.disposeHierarchy(this.foliageGroup);

    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.4, 5);
    trunkGeo.translate(0, 0.2, 0);
    const foliageGeo = new THREE.ConeGeometry(0.32, 0.7, 5);
    foliageGeo.translate(0, 0.65, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.city.grid[x][z];
        if (cell.terrain === 'grass' && !cell.road && !cell.building && !cell.service && cell.hasTree !== false) {
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
    this.disposeHierarchy(this.roadGroup);
    this.disposeHierarchy(this.buildingGroup);
    this.disposeHierarchy(this.serviceGroup);
    this.disposeHierarchy(this.overlayGroup);
    this.disposeHierarchy(this.gatewayGroup);
    this.disposeHierarchy(this.particleGroup);
    this.windTurbineRotors = [];
    this.smokeParticles = [];
    this.windowMaterials = [];
    this.streetLightMaterials = [];
    this.buildingLightMaterials = [];
    this.neonMaterials = [];
    this.antennaLights = [];
    this.parkCitizens = [];
    this.defenseTurretMeshes = [];
    this.tollPlazaMeshes = [];

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
  // Simple 1*1 Two-Lane Road Mesh (Zero clipping, zero 3-lane avenues, clean seamless junctions)
  private createRoadMesh(x: number, z: number, cell: CellData) {
    const isBridge = cell.terrain === 'water';
    const rType = cell.road!.type;
    const isHwy = rType === 'highway';
    const isMud = rType === 'mud';
    const isRural = rType === 'rural';
    const isPavement = rType === 'pavement';
    const isPedestrian = rType === 'pedestrian';
    const isToll = rType === 'toll_booth';

    const roadGroup = new THREE.Group();
    // Elevation: on land y = 0.02, on bridge y = 0.08
    roadGroup.position.set(x + 0.5, isBridge ? 0.08 : 0.02, z + 0.5);

    // Standard 1x1 two-lane road geometry parameters:
    // Roadway is 0.76 wide, leaving two 0.12 sidewalk borders (0.12 + 0.76 + 0.12 = 1.0)
    const roadWidth = 0.76;
    const halfW = 0.38; // half width of asphalt
    const curbW = 0.12; // width of sidewalk curb
    const roadThickness = 0.02;
    const roadY = 0.04; // asphalt sits on top of sidewalk
    const sidewalkY = 0.02; // sidewalk base

    const asphaltMat = isHwy || isToll
      ? this.materials.highwayAsphalt 
      : isMud
      ? new THREE.MeshStandardMaterial({ color: 0x85573b, roughness: 0.9 }) 
      : isRural
      ? new THREE.MeshStandardMaterial({ color: 0xa39171, roughness: 0.8 }) 
      : isPavement
      ? new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 }) 
      : isPedestrian
      ? new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 }) 
      : this.materials.asphalt;

    const curbMat = this.materials.sidewalk;
    const conn = cell.road!.connections;
    const hasAnyConn = conn.north || conn.south || conn.east || conn.west;
    const isStraightNS = (conn.north || conn.south) && !conn.east && !conn.west;
    const isStraightEW = (conn.east || conn.west) && !conn.north && !conn.south;

    // 1. Non-overlapping 1*1 Clean Partition Geometry
    if (!isBridge && (isStraightNS || !hasAnyConn)) {
      // Clean straight North-South 2-lane road
      const roadSlab = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, roadThickness, 1.0), asphaltMat);
      roadSlab.position.set(0, roadY, 0);
      roadSlab.receiveShadow = true;
      roadGroup.add(roadSlab);

      // West & East continuous sidewalk borders (no overlap with asphalt)
      const curbWest = new THREE.Mesh(new THREE.BoxGeometry(curbW, roadThickness, 1.0), curbMat);
      curbWest.position.set(-0.44, sidewalkY, 0);
      curbWest.receiveShadow = true;
      roadGroup.add(curbWest);

      const curbEast = new THREE.Mesh(new THREE.BoxGeometry(curbW, roadThickness, 1.0), curbMat);
      curbEast.position.set(0.44, sidewalkY, 0);
      curbEast.receiveShadow = true;
      roadGroup.add(curbEast);

    } else if (!isBridge && isStraightEW) {
      // Clean straight East-West 2-lane road
      const roadSlab = new THREE.Mesh(new THREE.BoxGeometry(1.0, roadThickness, roadWidth), asphaltMat);
      roadSlab.position.set(0, roadY, 0);
      roadSlab.receiveShadow = true;
      roadGroup.add(roadSlab);

      // North & South continuous sidewalk borders
      const curbNorth = new THREE.Mesh(new THREE.BoxGeometry(1.0, roadThickness, curbW), curbMat);
      curbNorth.position.set(0, sidewalkY, -0.44);
      curbNorth.receiveShadow = true;
      roadGroup.add(curbNorth);

      const curbSouth = new THREE.Mesh(new THREE.BoxGeometry(1.0, roadThickness, curbW), curbMat);
      curbSouth.position.set(0, sidewalkY, 0.44);
      curbSouth.receiveShadow = true;
      roadGroup.add(curbSouth);

    } else {
      // Junction / Intersection / Turn or Bridge: Non-overlapping 3x3 partitioned geometry
      // Center intersection box
      const centerSlab = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, roadThickness, roadWidth), asphaltMat);
      centerSlab.position.set(0, roadY, 0);
      centerSlab.receiveShadow = true;
      roadGroup.add(centerSlab);

      // North section
      const armLen = 0.5 - halfW; // 0.12
      const armCenter = (halfW + 0.5) / 2; // 0.44
      if (conn.north) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, roadThickness, armLen), asphaltMat);
        arm.position.set(0, roadY, -armCenter);
        arm.receiveShadow = true;
        roadGroup.add(arm);
      } else if (!isBridge) {
        const curbN = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, roadThickness, curbW), curbMat);
        curbN.position.set(0, sidewalkY, -0.44);
        curbN.receiveShadow = true;
        roadGroup.add(curbN);
      }

      // South section
      if (conn.south) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, roadThickness, armLen), asphaltMat);
        arm.position.set(0, roadY, armCenter);
        arm.receiveShadow = true;
        roadGroup.add(arm);
      } else if (!isBridge) {
        const curbS = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, roadThickness, curbW), curbMat);
        curbS.position.set(0, sidewalkY, 0.44);
        curbS.receiveShadow = true;
        roadGroup.add(curbS);
      }

      // East section
      if (conn.east) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, roadThickness, roadWidth), asphaltMat);
        arm.position.set(armCenter, roadY, 0);
        arm.receiveShadow = true;
        roadGroup.add(arm);
      } else if (!isBridge) {
        const curbE = new THREE.Mesh(new THREE.BoxGeometry(curbW, roadThickness, roadWidth), curbMat);
        curbE.position.set(0.44, sidewalkY, 0);
        curbE.receiveShadow = true;
        roadGroup.add(curbE);
      }

      // West section
      if (conn.west) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, roadThickness, roadWidth), asphaltMat);
        arm.position.set(-armCenter, roadY, 0);
        arm.receiveShadow = true;
        roadGroup.add(arm);
      } else if (!isBridge) {
        const curbW = new THREE.Mesh(new THREE.BoxGeometry(curbW, roadThickness, roadWidth), curbMat);
        curbW.position.set(-0.44, sidewalkY, 0);
        curbW.receiveShadow = true;
        roadGroup.add(curbW);
      }

      // 4 Corners (NW, NE, SW, SE)
      if (!isBridge) {
        const corners = [
          [-0.44, -0.44],
          [0.44, -0.44],
          [-0.44, 0.44],
          [0.44, 0.44],
        ];
        corners.forEach(([cx, cz]) => {
          const cPad = new THREE.Mesh(new THREE.BoxGeometry(curbW, roadThickness, curbW), curbMat);
          cPad.position.set(cx, sidewalkY, cz);
          cPad.receiveShadow = true;
          roadGroup.add(cPad);
        });
      }
    }

    // Toll Plaza
    if (isToll) {
      this.createTollPlazaMesh(roadGroup, conn, isBridge, x, z);
    }

    // Bridge Abutments if meeting shoreline
    const touchesNorthLand = isBridge && conn.north && this.city.getCell(x, z - 1)?.terrain !== 'water';
    const touchesSouthLand = isBridge && conn.south && this.city.getCell(x, z + 1)?.terrain !== 'water';
    const touchesEastLand = isBridge && conn.east && this.city.getCell(x + 1, z)?.terrain !== 'water';
    const touchesWestLand = isBridge && conn.west && this.city.getCell(x - 1, z)?.terrain !== 'water';

    const abutmentMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    if (touchesNorthLand) {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, roadThickness, 0.5), asphaltMat);
      ramp.position.set(0, roadY - 0.03, -0.25);
      ramp.rotation.x = -0.12;
      ramp.receiveShadow = true;
      roadGroup.add(ramp);

      const block = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 0.14, 0.24, 0.20), abutmentMat);
      block.position.set(0, -0.06, -0.40);
      roadGroup.add(block);
    }
    if (touchesSouthLand) {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, roadThickness, 0.5), asphaltMat);
      ramp.position.set(0, roadY - 0.03, 0.25);
      ramp.rotation.x = 0.12;
      ramp.receiveShadow = true;
      roadGroup.add(ramp);

      const block = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 0.14, 0.24, 0.20), abutmentMat);
      block.position.set(0, -0.06, 0.40);
      roadGroup.add(block);
    }
    if (touchesEastLand) {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.5, roadThickness, roadWidth), asphaltMat);
      ramp.position.set(0.25, roadY - 0.03, 0);
      ramp.rotation.z = -0.12;
      ramp.receiveShadow = true;
      roadGroup.add(ramp);

      const block = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.24, roadWidth + 0.14), abutmentMat);
      block.position.set(0.40, -0.06, 0);
      roadGroup.add(block);
    }
    if (touchesWestLand) {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.5, roadThickness, roadWidth), asphaltMat);
      ramp.position.set(-0.25, roadY - 0.03, 0);
      ramp.rotation.z = 0.12;
      ramp.receiveShadow = true;
      roadGroup.add(ramp);

      const block = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.24, roadWidth + 0.14), abutmentMat);
      block.position.set(-0.40, -0.06, 0);
      roadGroup.add(block);
    }

    // 2. Pure Two-Lane Road Markings (Simple dashed centerline down the middle, NO 3 lanes)
    const lineMat = isHwy ? this.materials.highwayYellow : this.materials.roadLine;
    const stripeY = roadY + (roadThickness / 2) + 0.003;

    if (isStraightNS || !hasAnyConn) {
      // 2 dashed lines dividing the two lanes
      for (const oz of [-0.22, 0.22]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.003, 0.26), lineMat);
        stripe.position.set(0, stripeY, oz);
        roadGroup.add(stripe);
      }
    } else if (isStraightEW) {
      for (const ox of [-0.22, 0.22]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.003, 0.024), lineMat);
        stripe.position.set(ox, stripeY, 0);
        roadGroup.add(stripe);
      }
    } else {
      // Two-lane junction: clean crosswalk stripes at connected branches
      if (conn.north) {
        for (let zx = -0.26; zx <= 0.26; zx += 0.13) {
          const zebra = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.003, 0.08), lineMat);
          zebra.position.set(zx, stripeY, -0.42);
          roadGroup.add(zebra);
        }
      }
      if (conn.south) {
        for (let zx = -0.26; zx <= 0.26; zx += 0.13) {
          const zebra = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.003, 0.08), lineMat);
          zebra.position.set(zx, stripeY, 0.42);
          roadGroup.add(zebra);
        }
      }
      if (conn.east) {
        for (let zz = -0.26; zz <= 0.26; zz += 0.13) {
          const zebra = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.003, 0.06), lineMat);
          zebra.position.set(0.42, stripeY, zz);
          roadGroup.add(zebra);
        }
      }
      if (conn.west) {
        for (let zz = -0.26; zz <= 0.26; zz += 0.13) {
          const zebra = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.003, 0.06), lineMat);
          zebra.position.set(-0.42, stripeY, zz);
          roadGroup.add(zebra);
        }
      }
    }

    // 3. Bridge Railings if on water
    if (isBridge) {
      const pierGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.22, 6);
      const pierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
      const railMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });

      if (isStraightEW) {
        const pier1 = new THREE.Mesh(pierGeo, pierMat);
        pier1.position.set(0, -0.1, -0.36);
        const pier2 = new THREE.Mesh(pierGeo, pierMat);
        pier2.position.set(0, -0.1, 0.36);
        roadGroup.add(pier1);
        roadGroup.add(pier2);

        const railLen = (touchesEastLand || touchesWestLand) ? 0.84 : 1.0;
        const railX = touchesEastLand ? -0.08 : touchesWestLand ? 0.08 : 0;
        const railGeo = new THREE.BoxGeometry(railLen, 0.08, 0.04);
        const railTop = new THREE.Mesh(railGeo, railMat);
        railTop.position.set(railX, 0.06, -roadWidth / 2 - 0.02);
        const railBottom = new THREE.Mesh(railGeo, railMat);
        railBottom.position.set(railX, 0.06, roadWidth / 2 + 0.02);
        roadGroup.add(railTop);
        roadGroup.add(railBottom);
      } else {
        const pier1 = new THREE.Mesh(pierGeo, pierMat);
        pier1.position.set(-0.36, -0.1, 0);
        const pier2 = new THREE.Mesh(pierGeo, pierMat);
        pier2.position.set(0.36, -0.1, 0);
        roadGroup.add(pier1);
        roadGroup.add(pier2);

        const railLen = (touchesNorthLand || touchesSouthLand) ? 0.84 : 1.0;
        const railZ = touchesNorthLand ? 0.08 : touchesSouthLand ? -0.08 : 0;
        const railGeo = new THREE.BoxGeometry(0.04, 0.08, railLen);
        const railL = new THREE.Mesh(railGeo, railMat);
        railL.position.set(-roadWidth / 2 - 0.02, 0.06, railZ);
        const railR = new THREE.Mesh(railGeo, railMat);
        railR.position.set(roadWidth / 2 + 0.02, 0.06, railZ);
        roadGroup.add(railL);
        roadGroup.add(railR);
      }
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

  // Separate, Very Cute Pastel 3D Building Models (1x1, 2x2, and 4x4 Multi-Tile Architectures)
  private createGeometricBuildingMesh(x: number, z: number, cell: CellData) {
    const b = cell.building!;
    if (b.footprint && b.footprint > 1) {
      if (b.masterCoord && (b.masterCoord.x !== x || b.masterCoord.z !== z)) {
        return; // Only render multi-tile complex from master root tile!
      }
    }

    const group = new THREE.Group();
    const halfFP = (b.footprint || 1) * 0.5;
    group.position.set(x + halfFP, 0, z + halfFP);

    // Apply diverse orientation
    if (b.rotation !== undefined) {
      group.rotation.y = b.rotation;
    } else {
      group.rotation.y = ((b.styleSeed % 4) * Math.PI) / 2;
    }

    const actualHeight = Math.max(0.65, b.height);

    // Distinct 2x2 and 4x4 Multi-Tile Architectures
    if (b.footprint === 2) {
      this.create2x2BuildingMesh(b, actualHeight, group);
      this.buildingGroup.add(group);
      return;
    }

    if (b.footprint === 4) {
      this.create4x4MegaplexMesh(b, actualHeight, group);
      this.buildingGroup.add(group);
      return;
    }

    // Standard 1x1 Models
    this.createBuildingBaseEnvironment(group, b.zone);

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

  // 2x2 Multi-Tile Complex Meshes
  private create2x2BuildingMesh(b: BuildingData, h: number, group: THREE.Group) {
    // 1. Shared 2x2 Ground Podium / Landscaped Base
    const baseGeo = new THREE.BoxGeometry(1.94, 0.04, 1.94);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.sidewalk);
    baseMesh.position.y = 0.02;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    if (b.zone === 'residential') {
      // 2x2 Luxury Condo Complex with internal landscaped garden courtyard & swimming pool
      const wallMat = this.materials.resWallCream;
      const accentMat = this.materials.resWallMint;

      // Tower Wing A (Main high wing)
      const wingA = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.7, 1.45), wallMat);
      wingA.position.set(-0.46, 0.85, 0.1);
      wingA.castShadow = true;
      group.add(wingA);

      // Tower Wing B (Perpendicular terraced wing)
      const wingB = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.25, 0.68), accentMat);
      wingB.position.set(0.35, 0.625, -0.46);
      wingB.castShadow = true;
      group.add(wingB);

      // Glass Balconies wrap-around
      for (let floor = 1; floor <= 4; floor++) {
        const balGeo = new THREE.BoxGeometry(0.76, 0.08, 0.16);
        const bal1 = new THREE.Mesh(balGeo, this.materials.resBalcony);
        bal1.position.set(-0.46, floor * 0.35, 0.86);
        group.add(bal1);

        const bal2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.60), this.materials.resBalcony);
        bal2.position.set(0.80, floor * 0.28, -0.46);
        group.add(bal2);
      }

      // Sunken Turquoise Swimming Pool in courtyard
      const poolRim = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.03, 0.52), this.materials.sidewalk);
      poolRim.position.set(0.32, 0.035, 0.38);
      group.add(poolRim);

      const poolWater = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.02, 0.44), this.materials.water);
      poolWater.position.set(0.32, 0.045, 0.38);
      group.add(poolWater);

      // Poolside Umbrellas & Sun loungers
      const umbrellaGeo = new THREE.ConeGeometry(0.12, 0.06, 6);
      const umbrellaMat = this.materials.comPeach;
      const umb1 = new THREE.Mesh(umbrellaGeo, umbrellaMat);
      umb1.position.set(0.64, 0.18, 0.22);
      group.add(umb1);

      // Courtyard Garden Blossom Tree
      const treeTrunk = new THREE.Mesh(this.sharedGeos.smallTrunk, this.materials.smallTrunkMat);
      treeTrunk.position.set(0.12, 0.12, -0.05);
      group.add(treeTrunk);
      const treeFoliage = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.materials.comCoral);
      treeFoliage.position.set(0.12, 0.32, -0.05);
      group.add(treeFoliage);

      // Rooftop Pergola & Solar Panels
      const pergola = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.65), this.materials.resWood);
      pergola.position.set(-0.46, 1.73, -0.3);
      group.add(pergola);

    } else if (b.zone === 'commercial') {
      // 2x2 Mega Shopping Galleria & Atrium
      const mallMat = this.materials.comButter;
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.15, 1.6), mallMat);
      wingL.position.set(-0.58, 0.575, 0);
      wingL.castShadow = true;
      group.add(wingL);

      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.15, 1.6), mallMat);
      wingR.position.set(0.58, 0.575, 0);
      wingR.castShadow = true;
      group.add(wingR);

      // Central Translucent Barrel Vault Glass Atrium Skylight
      const barrelGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.5, 14, 1, false, 0, Math.PI);
      barrelGeo.rotateX(Math.PI / 2);
      barrelGeo.rotateZ(Math.PI / 2);
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        roughness: 0.1,
        metalness: 0.4,
        transparent: true,
        opacity: 0.65,
      });
      const barrel = new THREE.Mesh(barrelGeo, glassMat);
      barrel.position.set(0, 0.95, 0);
      group.add(barrel);

      // Entrance Promenade with Grand Canopy & Logo
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.35), this.materials.comAwningRed);
      canopy.position.set(0, 0.42, 0.88);
      group.add(canopy);

      // Digital Advertising Pylon
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.12), this.materials.offMetalTrim);
      pylon.position.set(-0.80, 0.425, 0.82);
      group.add(pylon);
      const pylonSign = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.16), this.materials.comSignGold);
      pylonSign.position.set(-0.80, 0.65, 0.82);
      group.add(pylonSign);

      // Promenade café umbrellas & planters
      for (let i = 0; i < 2; i++) {
        const cx = i === 0 ? -0.28 : 0.28;
        const cafeUmb = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.08, 6), this.materials.comAwningTeal);
        cafeUmb.position.set(cx, 0.22, 0.72);
        group.add(cafeUmb);
      }

    } else if (b.zone === 'office') {
      // 2x2 Corporate Plaza with Twin Glass Towers & High-Level Skybridge
      const towerMat = this.materials.offWhiteFacade;
      const glassMat = this.materials.offGlass;

      // Tower 1 (Left Tall Tower)
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.3, 0.68), towerMat);
      t1.position.set(-0.46, 1.15, -0.32);
      t1.castShadow = true;
      group.add(t1);

      const t1Glass = new THREE.Mesh(new THREE.BoxGeometry(0.70, 2.15, 0.55), glassMat);
      t1Glass.position.set(-0.46, 1.15, -0.32);
      group.add(t1Glass);

      // Tower 2 (Right Tower)
      const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.9, 0.68), towerMat);
      t2.position.set(0.46, 0.95, 0.32);
      t2.castShadow = true;
      group.add(t2);

      const t2Glass = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.75, 0.70), glassMat);
      t2Glass.position.set(0.46, 0.95, 0.32);
      group.add(t2Glass);

      // High-Level Connecting Glass Skybridge
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.76), glassMat);
      bridge.position.set(0, 1.55, 0);
      group.add(bridge);

      const bridgeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.78), this.materials.offMetalTrim);
      bridgeTrim.position.set(0, 1.45, 0);
      group.add(bridgeTrim);

      // Reflecting Pool with central fountain in the plaza
      const poolRim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.72), this.materials.offWhiteFacade);
      poolRim.position.set(-0.35, 0.035, 0.42);
      group.add(poolRim);

      const poolWater = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.02, 0.64), this.materials.water);
      poolWater.position.set(-0.35, 0.045, 0.42);
      group.add(poolWater);

      const fountainSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.15, 8), this.materials.water);
      fountainSpout.position.set(-0.35, 0.12, 0.42);
      group.add(fountainSpout);

      // Modern geometric sculpture in brass/gold
      const sculpture = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), this.materials.comSignGold);
      sculpture.position.set(0.42, 0.22, -0.42);
      group.add(sculpture);

    } else {
      // 2x2 Industrial Logistics Hub & High-Capacity Freight Terminal
      const whMat = this.materials.indWarehouse;
      const mainWarehouse = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 1.05), whMat);
      mainWarehouse.position.set(0, 0.375, -0.32);
      mainWarehouse.castShadow = true;
      group.add(mainWarehouse);

      // Sawtooth industrial roof skylights
      for (let s = -0.6; s <= 0.6; s += 0.4) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.16, 4), this.materials.indSlate);
        tooth.position.set(s, 0.82, -0.32);
        group.add(tooth);
      }

      // Recessed loading docks with yellow safety stripes
      for (let d = -0.55; d <= 0.55; d += 0.36) {
        const dockDoor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.04), this.materials.indCorrugated);
        dockDoor.position.set(d, 0.14, 0.22);
        group.add(dockDoor);
      }

      // Cylindrical bulk storage silos with connecting pipes
      const silo1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 14), this.materials.indTank);
      silo1.position.set(-0.62, 0.55, 0.58);
      group.add(silo1);
      const silo2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 14), this.materials.indTank);
      silo2.position.set(-0.16, 0.55, 0.58);
      group.add(silo2);

      const siloPipe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.04), this.materials.indPipe);
      siloPipe.position.set(-0.39, 0.95, 0.58);
      group.add(siloPipe);

      // Stacked colorful intermodal cargo shipping containers
      const containerColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
      const positions = [
        [0.45, 0.12, 0.55],
        [0.45, 0.12, 0.78],
        [0.45, 0.28, 0.66],
      ];
      positions.forEach(([cx, cy, cz], idx) => {
        const cont = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.15, 0.20),
          new THREE.MeshStandardMaterial({ color: containerColors[idx % containerColors.length], roughness: 0.6 })
        );
        cont.position.set(cx, cy, cz);
        group.add(cont);
      });
    }
  }

  // 4x4 Mega Iconic City Landmark: Tech Megaplex & Civic Headquarters
  private create4x4MegaplexMesh(b: BuildingData, h: number, group: THREE.Group) {
    // 1. Sprawling 4x4 Civic Plaza Base (approx 3.92 x 3.92)
    const baseGeo = new THREE.BoxGeometry(3.92, 0.06, 3.92);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.sidewalk);
    baseMesh.position.y = 0.03;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // 2. Soaring Central High-Tech Skyscraper Tower
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.75,
      roughness: 0.15,
    });
    const coreTower = new THREE.Mesh(new THREE.BoxGeometry(1.35, 4.4, 1.35), towerMat);
    coreTower.position.set(0, 2.2, 0);
    coreTower.castShadow = true;
    group.add(coreTower);

    // Illuminated Spire Needle
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.10, 1.4, 8), this.materials.offMetalTrim);
    spire.position.set(0, 5.1, 0);
    group.add(spire);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    beacon.position.set(0, 5.8, 0);
    group.add(beacon);

    // 3. Four Stepped Aerodynamic Wing Towers
    const wingHeights = [3.2, 2.6, 2.0, 1.6];
    const wingOffsets = [
      [-1.05, -1.05],
      [1.05, -1.05],
      [1.05, 1.05],
      [-1.05, 1.05],
    ];

    wingOffsets.forEach(([wx, wz], idx) => {
      const wh = wingHeights[idx];
      const wingMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, wh, 0.85), this.materials.offWhiteFacade);
      wingMesh.position.set(wx, wh / 2, wz);
      wingMesh.castShadow = true;
      group.add(wingMesh);

      // Glass facade accents
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.88, wh - 0.2, 0.70), this.materials.offGlass);
      glass.position.set(wx, wh / 2, wz);
      group.add(glass);

      // Enclosed Skybridge to central core
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.45), this.materials.offGlass);
      bridge.position.set(wx * 0.55, wh * 0.75, wz * 0.55);
      group.add(bridge);
    });

    // 4. Rooftop Helipad on South-West Wing (idx 3)
    const heliPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    heliPad.position.set(-1.05, 1.625, 1.05);
    group.add(heliPad);

    const heliRing = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.28, 16),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    heliRing.rotateX(-Math.PI / 2);
    heliRing.position.set(-1.05, 1.66, 1.05);
    group.add(heliRing);

    // 5. Grand Plaza Fountains & Promenade Parks
    const fountainRim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.60, 0.08, 16), this.materials.offWhiteFacade);
    fountainRim.position.set(0, 0.07, 1.25);
    group.add(fountainRim);

    const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.50, 0.06, 16), this.materials.water);
    fountainWater.position.set(0, 0.09, 1.25);
    group.add(fountainWater);

    const fountainJet = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 8), this.materials.water);
    fountainJet.position.set(0, 0.28, 1.25);
    group.add(fountainJet);

    // Plaza Trees and Greenery
    const treeCoords = [
      [-1.65, 0], [1.65, 0], [0, -1.65], [-1.65, -1.65], [1.65, -1.65]
    ];
    treeCoords.forEach(([tx, tz]) => {
      const trunk = new THREE.Mesh(this.sharedGeos.smallTrunk, this.materials.smallTrunkMat);
      trunk.position.set(tx, 0.12, tz);
      group.add(trunk);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), this.materials.resRoofTeal);
      puff.position.set(tx, 0.36, tz);
      group.add(puff);
    });

    // Holographic digital billboards
    const screen1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.04), this.materials.comSignGold);
    screen1.position.set(0, 0.85, 0.70);
    group.add(screen1);
  }

  private createBuildingBaseEnvironment(group: THREE.Group, zone: string) {
    // 1. Half-tile pedestrian walkway / alleyway pad
    const frontWalk = new THREE.Mesh(this.sharedGeos.frontWalk, this.materials.walkMat);
    frontWalk.position.set(0, 0.01, 0.28);
    frontWalk.receiveShadow = true;
    group.add(frontWalk);

    const sidePebble = new THREE.Mesh(this.sharedGeos.sidePebble, this.materials.pebbleMat);
    sidePebble.position.set(-0.28, 0.012, -0.02);
    sidePebble.receiveShadow = true;
    group.add(sidePebble);

    // 2. Small Bushes along the alleyway
    const b1 = new THREE.Mesh(this.sharedGeos.bush, this.materials.bushMat);
    b1.position.set(-0.35, 0.04, 0.42);
    group.add(b1);

    const b2 = new THREE.Mesh(this.sharedGeos.bush, this.materials.bushMat);
    b2.position.set(0.35, 0.04, 0.42);
    group.add(b2);

    // 3. Small Tree in the alleyway recess
    const trunk = new THREE.Mesh(this.sharedGeos.smallTrunk, this.materials.smallTrunkMat);
    trunk.position.set(-0.32, 0.11, -0.25);
    group.add(trunk);

    const foliage = new THREE.Mesh(this.sharedGeos.smallFoliage, this.materials.smallFoliageMat);
    foliage.position.set(-0.32, 0.28, -0.25);
    group.add(foliage);

    // 4. Small Pathway Lights (Bollard Lamps) along the alleyway path
    const lampPost = new THREE.Mesh(this.sharedGeos.lampPost, this.materials.lampMat);
    lampPost.position.set(0.28, 0.05, 0.42);
    group.add(lampPost);

    const lampBulb = new THREE.Mesh(this.sharedGeos.lampBulb, this.materials.bulbMat);
    lampBulb.position.set(0.28, 0.10, 0.42);
    group.add(lampBulb);
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
    if (s.footprint && s.footprint > 1) {
      if (s.masterCoord && (s.masterCoord.x !== x || s.masterCoord.z !== z)) {
        return; // Only render multi-tile service complex from master root tile!
      }
    }

    const group = new THREE.Group();
    const halfFP = (s.footprint || 1) * 0.5;
    group.position.set(x + halfFP, 0, z + halfFP);

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

      case 'parking_lot': {
        // High-Quality Multi-Level 3D Parking Garage & Deck Structure
        const pW = 0.82;
        const pH1 = 0.35;
        const pH2 = 0.35;
        const pD = 0.82;

        const deck1 = new THREE.Mesh(new THREE.BoxGeometry(pW, pH1, pD), this.materials.indSlate);
        deck1.position.set(0, pH1 / 2, 0);
        deck1.castShadow = true;
        group.add(deck1);

        const deck2 = new THREE.Mesh(new THREE.BoxGeometry(pW * 0.95, pH2, pD * 0.95), this.materials.indSlate);
        deck2.position.set(0, pH1 + pH2 / 2, 0);
        deck2.castShadow = true;
        group.add(deck2);

        for (const px of [-pW / 2 + 0.08, pW / 2 - 0.08]) {
          for (const pz of [-pD / 2 + 0.08, pD / 2 - 0.08]) {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, pH1 + pH2, 6), this.materials.indPipe);
            pillar.position.set(px, (pH1 + pH2) / 2, pz);
            group.add(pillar);
          }
        }

        const gateBooth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 0.18), this.materials.comPeach);
        gateBooth.position.set(0.25, 0.10, pD / 2 - 0.04);
        group.add(gateBooth);

        const barrierArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.03), this.materials.indCautionYellow);
        barrierArm.position.set(0.05, 0.18, pD / 2 - 0.04);
        group.add(barrierArm);

        for (const [cx, cz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
          const carMini = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.24), new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 }));
          carMini.position.set(cx, pH1 + pH2 + 0.045, cz);
          group.add(carMini);
        }

        const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4), this.materials.indPipe);
        signPost.position.set(0, pH1 + pH2 + 0.18, -0.28);
        const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.03), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.2 }));
        signBoard.position.set(0, pH1 + pH2 + 0.32, -0.28);
        group.add(signPost);
        group.add(signBoard);
        break;
      }

      case 'bus_station': {
        const bsBase = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.04, 0.86), this.materials.sidewalk);
        bsBase.position.y = 0.02;
        group.add(bsBase);

        const shelterRoof = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 0.42), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 }));
        shelterRoof.position.set(0, 0.36, 0);
        group.add(shelterRoof);

        for (const px of [-0.30, 0.30]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 4), this.materials.indPipe);
          post.position.set(px, 0.18, 0.18);
          group.add(post);
        }

        const scheduleBoard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.03), this.materials.indSlate);
        scheduleBoard.position.set(0, 0.20, -0.24);
        group.add(scheduleBoard);

        const transitBus = new THREE.Group();
        transitBus.position.set(0.24, 0, 0.28);
        const bBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.58), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }));
        bBody.position.y = 0.14;
        transitBus.add(bBody);
        const bWin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.50), this.materials.comGlass);
        bWin.position.set(0, 0.19, 0);
        transitBus.add(bWin);
        group.add(transitBus);

        // 6 waiting passengers under the bus shelter
        group.add(this.createParkCitizen(-0.18, 0.04, -0.05, 0x3b82f6, true));
        group.add(this.createParkCitizen(-0.06, 0.04, -0.05, 0xec4899, true));
        group.add(this.createParkCitizen(0.06, 0.04, -0.05, 0x10b981, true));
        group.add(this.createParkCitizen(0.18, 0.04, -0.05, 0xf59e0b, true));
        group.add(this.createParkCitizen(-0.12, 0.04, 0.10, 0x8b5cf6, false));
        group.add(this.createParkCitizen(0.12, 0.04, 0.10, 0x06b6d4, false));
        break;
      }

      case 'forest': {
        const forestBase = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.96), this.materials.grass);
        forestBase.position.y = 0.02;
        group.add(forestBase);

        for (let i = 0; i < 7; i++) {
          const angle = (i / 7) * Math.PI * 2 + (s.styleSeed % 3);
          const dist = 0.22 + (i % 3) * 0.08;
          const fx = Math.cos(angle) * dist;
          const fz = Math.sin(angle) * dist;

          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 5), this.materials.resDarkWood);
          trunk.position.set(fx, 0.18, fz);
          trunk.castShadow = true;
          group.add(trunk);

          const isPine = i % 2 === 0;
          if (isPine) {
            const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 6), this.materials.resPlanter);
            foliage.position.set(fx, 0.46, fz);
            foliage.castShadow = true;
            group.add(foliage);
          } else {
            const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), this.materials.resSage);
            foliage.position.set(fx, 0.42, fz);
            foliage.castShadow = true;
            group.add(foliage);
          }
        }
        break;
      }

      case 'nuclear_plant': {
        const nW = 0.84; const nD = 0.84;
        const base = new THREE.Mesh(new THREE.BoxGeometry(nW, 0.12, nD), this.materials.indSlate);
        base.position.y = 0.06; group.add(base);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 }));
        dome.position.set(-0.16, 0.12, 0); group.add(dome);
        for (const tz of [-0.22, 0.22]) {
          const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }));
          tower.position.set(0.24, 0.275, tz); group.add(tower);
        }
        break;
      }
      case 'geothermal_plant': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.10, 0.82), this.materials.indSlate);
        base.position.y = 0.05; group.add(base);
        for (const px of [-0.2, 0.2]) {
          const turbine = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.35, 8), this.materials.indPipe);
          turbine.position.set(px, 0.25, 0); group.add(turbine);
        }
        const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), this.materials.indPipe);
        pipe.position.set(0, 0.32, 0); group.add(pipe);
        break;
      }
      case 'fusion_reactor': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.12, 0.88), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 }));
        base.position.y = 0.06; group.add(base);
        const torus = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.09, 12, 24), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8, metalness: 0.9 }));
        torus.rotation.x = Math.PI / 2;
        torus.position.set(0, 0.38, 0); group.add(torus);
        break;
      }
      case 'desalination_plant': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.10, 0.84), this.materials.indSlate);
        base.position.y = 0.05; group.add(base);
        for (const pz of [-0.2, 0.2]) {
          const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.35, 10), this.materials.water);
          tank.rotation.z = Math.PI / 2;
          tank.position.set(0, 0.22, pz); group.add(tank);
        }
        break;
      }
      case 'recycling_center': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.84), this.materials.sidewalk);
        base.position.y = 0.04; group.add(base);
        const shed = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.32, 0.5), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 }));
        shed.position.set(0, 0.20, 0); group.add(shed);
        const bin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), new THREE.MeshStandardMaterial({ color: 0x047857 }));
        bin.position.set(0.25, 0.11, 0.25); group.add(bin);
        break;
      }
      case 'incinerator': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.12, 0.84), this.materials.indSlate);
        base.position.y = 0.06; group.add(base);
        const furnace = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.45), this.materials.indBrick);
        furnace.position.set(0, 0.26, 0); group.add(furnace);
        const smokestack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.75, 8), this.materials.indPipe);
        smokestack.position.set(0.2, 0.55, 0.2); group.add(smokestack);
        break;
      }
      case 'subway_station': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.04, 0.86), this.materials.sidewalk);
        base.position.y = 0.02; group.add(base);
        const kiosk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }));
        kiosk.position.set(0, 0.15, 0); group.add(kiosk);
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.04), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
        sign.position.set(0, 0.32, 0.2); group.add(sign);
        break;
      }
      case 'tram_depot': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.04, 0.86), this.materials.sidewalk);
        base.position.y = 0.02; group.add(base);
        const shed = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.6), this.materials.comTeal);
        shed.position.set(0, 0.17, 0); group.add(shed);
        const tram = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.48), new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3 }));
        tram.position.set(0.22, 0.11, 0); group.add(tram);
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

      case 'medium_park': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.96), this.materials.grass);
        base.position.y = 0.02; group.add(base);
        const gazebo = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.14, 6), this.materials.resWood);
        gazebo.position.set(0, 0.15, 0); group.add(gazebo);
        group.add(this.createParkCitizen(-0.25, 0.04, 0.25, 0x3b82f6, true));
        group.add(this.createParkCitizen(0.25, 0.04, -0.25, 0xec4899, true));
        break;
      }
      case 'stadium': {
        const fp = s.footprint || 2;
        const baseW = fp === 4 ? 3.92 : 1.94;
        const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, 0.04, baseW), this.materials.sidewalk);
        base.position.y = 0.02;
        group.add(base);

        // Outer Oval Stadium Grandstand Bowl
        const bowlRadius = fp === 4 ? 1.6 : 0.85;
        const bowlHeight = fp === 4 ? 0.85 : 0.45;
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(bowlRadius, bowlRadius * 1.08, bowlHeight, 24),
          new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.4 })
        );
        bowl.position.y = bowlHeight / 2 + 0.04;
        group.add(bowl);

        // Inner seating tier
        const seatTier = new THREE.Mesh(
          new THREE.CylinderGeometry(bowlRadius * 0.88, bowlRadius * 0.95, bowlHeight * 0.9, 24),
          this.materials.comCoral
        );
        seatTier.position.y = bowlHeight / 2 + 0.05;
        group.add(seatTier);

        // Sunken green pitch with field markings
        const pitchW = fp === 4 ? 1.6 : 0.82;
        const pitchD = fp === 4 ? 1.0 : 0.52;
        const pitch = new THREE.Mesh(
          new THREE.BoxGeometry(pitchW, 0.02, pitchD),
          new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
        );
        pitch.position.y = bowlHeight + 0.02;
        group.add(pitch);

        // Center circle line
        const centerLine = new THREE.Mesh(
          new THREE.RingGeometry(0.08, 0.09, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        );
        centerLine.rotateX(-Math.PI / 2);
        centerLine.position.set(0, bowlHeight + 0.035, 0);
        group.add(centerLine);

        // 4 Corner Floodlight Towers
        const lightOffsets = fp === 4 
          ? [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]] 
          : [[-0.85, -0.85], [0.85, -0.85], [0.85, 0.85], [-0.85, 0.85]];

        lightOffsets.forEach(([lx, lz]) => {
          const tower = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.025, 0.9, 4),
            this.materials.offMetalTrim
          );
          tower.position.set(lx, 0.45, lz);
          group.add(tower);

          const lampHead = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.06, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffbeb, emissiveIntensity: 0.9 })
          );
          lampHead.position.set(lx, 0.9, lz);
          group.add(lampHead);
        });
        break;
      }

      case 'grand_park': {
        const fp = s.footprint || 2;
        const baseW = fp === 4 ? 3.92 : 1.94;
        const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, 0.04, baseW), this.materials.grass);
        base.position.y = 0.02;
        group.add(base);

        // Serpentine Lake
        const lake = new THREE.Mesh(
          new THREE.CylinderGeometry(baseW * 0.28, baseW * 0.32, 0.05, 16),
          this.materials.water
        );
        lake.position.set(-0.25, 0.04, -0.2);
        group.add(lake);

        // Arched wooden footbridge across pond
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.16), this.materials.resWood);
        bridge.position.set(-0.25, 0.09, -0.2);
        group.add(bridge);

        // Botanical Gazebo Pavilion
        const gazebo = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.18, 6), this.materials.comPeach);
        gazebo.position.set(0.45, 0.24, 0.35);
        group.add(gazebo);

        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3;
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4), this.materials.resWood);
          post.position.set(0.45 + Math.cos(ang) * 0.22, 0.12, 0.35 + Math.sin(ang) * 0.22);
          group.add(post);
        }

        // Flowering Trees & Citizens
        const treeOffsets = [[-0.65, 0.55], [0.65, -0.55], [0.1, 0.65], [-0.7, -0.65]];
        treeOffsets.forEach(([tx, tz]) => {
          const trunk = new THREE.Mesh(this.sharedGeos.smallTrunk, this.materials.smallTrunkMat);
          trunk.position.set(tx, 0.12, tz);
          group.add(trunk);
          const puff = new THREE.Mesh(new THREE.SphereGeometry(0.20, 6, 6), this.materials.resRoofTeal);
          puff.position.set(tx, 0.32, tz);
          group.add(puff);
        });

        for (let i = 0; i < 8; i++) {
          const col = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4, 0xec4899, 0x14b8a6][i];
          const px = (i % 3 - 1) * 0.35;
          const pz = (Math.floor(i / 3) - 1) * 0.35;
          group.add(this.createParkCitizen(px, 0.04, pz, col, i % 2 === 0));
        }
        break;
      }

      case 'defense_tower': {
        this.createDefenseTowerMesh(x, z, s, group);
        break;
      }

      case 'army_barracks': {
        this.createArmyBarracksMesh(x, z, s, group);
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

  // -------------------------------------------------------------
  // REDESIGNED TOLL BOOTH PLAZA & DEFENSIVE CHECKPOINT
  // -------------------------------------------------------------
  private createTollPlazaMesh(
    roadGroup: THREE.Group,
    conn: { north: boolean; south: boolean; east: boolean; west: boolean },
    isBridge: boolean,
    x: number,
    z: number
  ) {
    const plaza = new THREE.Group();
    const isEW = conn.east || conn.west;

    const islandMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.8 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const glassMat = this.materials.storefrontLit || new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });

    const barrierArms: THREE.Mesh[] = [];
    const beaconLights: THREE.Mesh[] = [];

    const islandWidth = 0.14;
    const islandLength = 0.82;
    const islandHeight = 0.08;

    const islandOffsets = [-0.34, 0, 0.34];
    islandOffsets.forEach((offset, idx) => {
      const island = new THREE.Mesh(
        new THREE.BoxGeometry(
          isEW ? islandLength : islandWidth,
          islandHeight,
          isEW ? islandWidth : islandLength
        ),
        islandMat
      );
      island.position.set(
        isEW ? 0 : offset,
        islandHeight / 2 + 0.016,
        isEW ? offset : 0
      );
      island.receiveShadow = true;
      plaza.add(island);

      // Yellow/black crash cushions at ends
      for (const endSign of [-1, 1]) {
        const cushion = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, islandHeight * 1.1, 8),
          hazardMat
        );
        cushion.position.set(
          isEW ? endSign * 0.38 : offset,
          islandHeight / 2 + 0.02,
          isEW ? offset : endSign * 0.38
        );
        plaza.add(cushion);
      }

      // Center Toll Operator Kiosk
      if (idx === 1) {
        const boothW = isEW ? 0.34 : 0.12;
        const boothD = isEW ? 0.12 : 0.34;
        const boothH = 0.28;
        const booth = new THREE.Mesh(new THREE.BoxGeometry(boothW, boothH, boothD), steelMat);
        booth.position.set(0, islandHeight + boothH / 2 + 0.016, 0);
        booth.castShadow = true;
        plaza.add(booth);

        const win = new THREE.Mesh(
          new THREE.BoxGeometry(
            isEW ? 0.32 : 0.125,
            0.12,
            isEW ? 0.125 : 0.32
          ),
          glassMat
        );
        win.position.set(0, islandHeight + boothH * 0.65 + 0.016, 0);
        plaza.add(win);
      }
    });

    // Space-frame Overhead Truss Gantry & Architectural Modern Canopy
    const canopyY = 0.62;
    const canopyPillars = [
      [-0.42, -0.32],
      [-0.42, 0.32],
      [0.42, -0.32],
      [0.42, 0.32],
    ];

    canopyPillars.forEach(([px, pz]) => {
      const colX = isEW ? pz : px;
      const colZ = isEW ? px : pz;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.028, canopyY, 8),
        steelMat
      );
      pillar.position.set(colX, canopyY / 2, colZ);
      pillar.castShadow = true;
      plaza.add(pillar);
    });

    const canopyRoof = new THREE.Mesh(
      new THREE.BoxGeometry(isEW ? 0.72 : 0.94, 0.06, isEW ? 0.94 : 0.72),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.4, roughness: 0.3 })
    );
    canopyRoof.position.set(0, canopyY + 0.03, 0);
    canopyRoof.castShadow = true;
    plaza.add(canopyRoof);

    // Architectural colored fascia trim
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(isEW ? 0.74 : 0.96, 0.04, isEW ? 0.96 : 0.74),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
    );
    fascia.position.set(0, canopyY + 0.05, 0);
    plaza.add(fascia);

    // Articulated Barrier Arms & LED Signs for both lanes
    const laneOffsets = [-0.17, 0.17];
    laneOffsets.forEach((laneOff) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(isEW ? 0.08 : 0.06, 0.14, isEW ? 0.06 : 0.08),
        hazardMat
      );
      box.position.set(
        isEW ? 0.18 : (laneOff < 0 ? -0.07 : 0.07),
        0.14 / 2 + 0.08,
        isEW ? (laneOff < 0 ? -0.07 : 0.07) : 0.18
      );
      plaza.add(box);

      const armLength = 0.30;
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(
          isEW ? 0.025 : armLength,
          0.025,
          isEW ? armLength : 0.025
        ),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
      );
      arm.position.set(
        isEW ? 0.18 : (laneOff < 0 ? -0.17 : 0.17),
        0.18,
        isEW ? (laneOff < 0 ? -0.17 : 0.17) : 0.18
      );
      arm.rotation.z = Math.PI / 6;
      plaza.add(arm);
      barrierArms.push(arm);

      // Digital Overhead LED Sign ("TOLL $5" / Lane Status)
      const ledSign = new THREE.Mesh(
        new THREE.BoxGeometry(isEW ? 0.02 : 0.16, 0.07, isEW ? 0.16 : 0.02),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.8,
        })
      );
      ledSign.position.set(
        isEW ? 0.34 : laneOff,
        canopyY - 0.02,
        isEW ? laneOff : 0.34
      );
      plaza.add(ledSign);
    });

    // Rooftop Automated Perimeter Defense Turret on Toll Canopy
    const turretBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.10, 0.06, 8),
      steelMat
    );
    turretBase.position.set(0, canopyY + 0.09, 0);
    plaza.add(turretBase);

    const turretGun = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.18),
      steelMat
    );
    turretGun.position.set(0, canopyY + 0.14, 0);
    plaza.add(turretGun);

    const barrels = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6),
      steelMat
    );
    barrels.rotation.x = Math.PI / 2;
    barrels.position.set(0, canopyY + 0.14, 0.14);
    plaza.add(barrels);

    // Emergency Flashing Beacons on Canopy Ends
    for (const bSign of [-1, 1]) {
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.03, 0.06, 6),
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xef4444,
          emissiveIntensity: 0.3,
        })
      );
      beacon.position.set(
        isEW ? 0 : bSign * 0.40,
        canopyY + 0.08,
        isEW ? bSign * 0.40 : 0
      );
      plaza.add(beacon);
      beaconLights.push(beacon);
    }

    roadGroup.add(plaza);
    this.tollPlazaMeshes.push({ group: plaza, barrierArms, beaconLights, x, z });
  }

  // -------------------------------------------------------------
  // DEFENSE TOWER & ARMY BARRACKS 3D MODELS
  // -------------------------------------------------------------
  private createDefenseTowerMesh(x: number, z: number, s: any, group: THREE.Group) {
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9 });
    const redMissileMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

    // 1. Octagonal reinforced concrete pillbox bunker base
    const baseGeo = new THREE.CylinderGeometry(0.38, 0.45, 0.38, 8);
    const bunker = new THREE.Mesh(baseGeo, concreteMat);
    bunker.position.y = 0.19;
    bunker.castShadow = true;
    group.add(bunker);

    // Viewport firing slits
    for (let i = 0; i < 4; i++) {
      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x0f172a })
      );
      const angle = (i * Math.PI) / 2;
      slit.position.set(Math.sin(angle) * 0.41, 0.22, Math.cos(angle) * 0.41);
      slit.rotation.y = angle;
      group.add(slit);
    }

    // Sandbag crescent revetment wrapping around front
    for (let a = -Math.PI / 3; a <= Math.PI / 3; a += Math.PI / 6) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.10), sandbagMat);
      bag.position.set(Math.sin(a) * 0.48, 0.04, Math.cos(a) * 0.48);
      bag.rotation.y = a;
      group.add(bag);
    }

    // Top gun deck ring
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.06, 12), steelMat);
    ring.position.y = 0.41;
    group.add(ring);

    // 2. Rotating Turret Head Assembly
    const turretHead = new THREE.Group();
    turretHead.position.set(0, 0.44, 0);

    const gunHousing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.30), steelMat);
    gunHousing.position.y = 0.08;
    gunHousing.castShadow = true;
    turretHead.add(gunHousing);

    // Twin heavy autocannons extending forward
    for (const bSign of [-0.06, 0.06]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.38, 8), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(bSign, 0.08, 0.25);
      turretHead.add(barrel);

      // Flash suppressor tip
      const tip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.024, 0.05, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
      );
      tip.rotation.x = Math.PI / 2;
      tip.position.set(bSign, 0.08, 0.44);
      turretHead.add(tip);
    }

    // Side Missile Pod Launcher Pack
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.18), steelMat);
    pod.position.set(-0.16, 0.11, 0.02);
    turretHead.add(pod);

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const mTip = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.04, 6), redMissileMat);
        mTip.rotation.x = Math.PI / 2;
        mTip.position.set(-0.18 + c * 0.04, 0.08 + r * 0.05, 0.11);
        turretHead.add(mTip);
      }
    }

    // Scanning searchlight beam cone
    const searchCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.15 })
    );
    searchCone.rotation.x = -Math.PI / 2.2;
    searchCone.position.set(0.12, 0.08, 0.5);
    turretHead.add(searchCone);

    // Radar dish on top
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.02, 0.04, 8), steelMat);
    dish.position.set(0, 0.19, -0.04);
    turretHead.add(dish);

    group.add(turretHead);
    this.defenseTurretMeshes.push({ group, turretHead, x, z });
  }

  private createArmyBarracksMesh(x: number, z: number, s: any, group: THREE.Group) {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
    const camoMat = new THREE.MeshStandardMaterial({ color: 0x3f4f34, roughness: 0.75 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2e3826, roughness: 0.6 });
    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9 });

    // Compound Concrete Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.96), baseMat);
    base.position.y = 0.02;
    group.add(base);

    // Main Command Tactical Headquarters Building
    const hq = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.40), camoMat);
    hq.position.set(-0.22, 0.20, -0.22);
    hq.castShadow = true;
    group.add(hq);

    // Radio Communication Mast with Blinking Warning Beacon
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.025, 0.80, 6),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
    );
    mast.position.set(-0.35, 0.58, -0.35);
    group.add(mast);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    beacon.position.set(-0.35, 0.98, -0.35);
    group.add(beacon);

    // Satellite Dish
    const sat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.02, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4 })
    );
    sat.rotation.x = Math.PI / 4;
    sat.position.set(-0.16, 0.42, -0.16);
    group.add(sat);

    // Quonset Arched Military Barracks Hut
    const hut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.48, 12, 1, false, 0, Math.PI),
      roofMat
    );
    hut.rotation.z = Math.PI / 2;
    hut.position.set(0.24, 0.04, -0.18);
    hut.castShadow = true;
    group.add(hut);

    // Concrete Helipad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    pad.position.set(0.22, 0.04, 0.25);
    group.add(pad);

    const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.005, 0.22), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    hBar1.position.set(0.16, 0.052, 0.25);
    group.add(hBar1);

    const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.005, 0.22), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    hBar2.position.set(0.28, 0.052, 0.25);
    group.add(hBar2);

    const hCross = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.005, 0.04), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    hCross.position.set(0.22, 0.052, 0.25);
    group.add(hCross);

    // Parked Military Armored Patrol Humvee
    const humvee = new THREE.Group();
    humvee.position.set(-0.22, 0.04, 0.25);

    const hBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.10, 0.30),
      new THREE.MeshStandardMaterial({ color: 0x3f4f34, roughness: 0.6 })
    );
    hBody.position.y = 0.06;
    humvee.add(hBody);

    const hRoofGun = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    hRoofGun.rotation.x = Math.PI / 2;
    hRoofGun.position.set(0, 0.14, 0.06);
    humvee.add(hRoofGun);

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    for (const tx of [-0.10, 0.10]) {
      for (const tz of [-0.09, 0.09]) {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.025, 8), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(tx, 0.04, tz);
        humvee.add(tire);
      }
    }

    group.add(humvee);

    const gateSandbag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), sandbagMat);
    gateSandbag.position.set(0, 0.04, 0.44);
    group.add(gateSandbag);
  }

  // -------------------------------------------------------------
  // RAIDER & MILITIA 3D ENTITY BUILDERS
  // -------------------------------------------------------------
  private createRaiderMesh(r: RaiderEntity): THREE.Group {
    const group = new THREE.Group();
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7, metalness: 0.4 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    if (r.type === 'technical') {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.18), rustMat);
      cab.position.set(0, 0.08, 0.08);
      group.add(cab);

      const bed = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.16), darkMat);
      bed.position.set(0, 0.055, -0.09);
      group.add(bed);

      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6), darkMat);
      mount.position.set(0, 0.12, -0.09);
      group.add(mount);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), darkMat);
      barrel.rotation.x = Math.PI / 2.2;
      barrel.position.set(0, 0.18, -0.04);
      group.add(barrel);

      const ram = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.05, 0.03), darkMat);
      ram.position.set(0, 0.05, 0.18);
      group.add(ram);
    } else if (r.type === 'buggy') {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.32), rustMat);
      frame.position.set(0, 0.06, 0);
      group.add(frame);

      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.16), darkMat);
      cage.position.set(0, 0.12, -0.02);
      group.add(cage);

      const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 6), darkMat);
      gun.rotation.x = Math.PI / 2;
      gun.position.set(0, 0.18, 0.06);
      group.add(gun);
    } else if (r.type === 'armored_van') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.42), darkMat);
      body.position.set(0, 0.11, 0);
      group.add(body);

      for (const side of [-0.115, 0.115]) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.08, 0.36), rustMat);
        plate.position.set(side, 0.11, 0);
        group.add(plate);
      }

      const rpod = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.16), rustMat);
      rpod.position.set(0, 0.22, 0);
      group.add(rpod);
    } else {
      const soldier = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 6), rustMat);
      soldier.position.set(0, 0.08, 0);
      group.add(soldier);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), darkMat);
      head.position.set(0, 0.18, 0);
      group.add(head);

      const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.16), darkMat);
      rifle.position.set(0.06, 0.12, 0.06);
      group.add(rifle);
    }

    if (r.type !== 'infantry') {
      for (const tx of [-0.10, 0.10]) {
        for (const tz of [-0.12, 0.12]) {
          const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.026, 8), tireMat);
          tire.rotation.z = Math.PI / 2;
          tire.position.set(tx, 0.042, tz);
          group.add(tire);
        }
      }
    }

    // Floating 3D Billboarded Health Bar
    const hpContainer = new THREE.Group();
    hpContainer.position.set(0, 0.48, 0);

    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide })
    );
    hpContainer.add(hpBg);

    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
    );
    hpFill.position.z = 0.002;
    hpContainer.add(hpFill);

    group.userData = { hpFill, hpContainer, maxHp: r.maxHp };
    group.add(hpContainer);

    return group;
  }

  private createMilitiaMesh(m: MilitiaEntity): THREE.Group {
    const group = new THREE.Group();
    const oliveMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.6 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    if (m.type === 'patrol_jeep') {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.32), oliveMat);
      chassis.position.set(0, 0.07, 0);
      group.add(chassis);

      const strobe = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.02, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      strobe.position.set(0, 0.13, 0);
      group.add(strobe);

      const roofGun = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), darkMat);
      roofGun.rotation.x = Math.PI / 2;
      roofGun.position.set(0, 0.15, 0.08);
      group.add(roofGun);

      for (const tx of [-0.10, 0.10]) {
        for (const tz of [-0.10, 0.10]) {
          const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.026, 8), tireMat);
          tire.rotation.z = Math.PI / 2;
          tire.position.set(tx, 0.04, tz);
          group.add(tire);
        }
      }
    } else {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 6), oliveMat);
      body.position.set(0, 0.08, 0);
      group.add(body);

      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), darkMat);
      helmet.position.set(0, 0.18, 0);
      group.add(helmet);

      const gun = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.16), darkMat);
      gun.position.set(0.06, 0.12, 0.06);
      group.add(gun);
    }

    const hpContainer = new THREE.Group();
    hpContainer.position.set(0, 0.44, 0);

    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.045),
      new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide })
    );
    hpContainer.add(hpBg);

    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.30, 0.035),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    hpFill.position.z = 0.002;
    hpContainer.add(hpFill);

    group.userData = { hpFill, hpContainer, maxHp: m.maxHp };
    group.add(hpContainer);

    return group;
  }

  // -------------------------------------------------------------
  // TOWER DEFENSE RENDER LOOP & REAL-TIME COMBAT EFFECTS
  // -------------------------------------------------------------
  public updateTowerDefenseRendering(delta: number) {
    const isLockdown = this.city.waveActive;

    // Atmospheric Emergency Alert Lighting
    if (isLockdown) {
      const pulse = (Math.sin(performance.now() * 0.005) + 1) * 0.5;
      this.ambientLight.color.setRGB(1.0, 0.82 + pulse * 0.12, 0.82 + pulse * 0.12);
    } else {
      this.ambientLight.color.setHex(0xfffdf7);
    }

    // 1. Update Toll Plazas
    for (const tp of this.tollPlazaMeshes) {
      for (const arm of tp.barrierArms) {
        if (isLockdown) {
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, 0, delta * 6);
        } else {
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, Math.PI / 4, delta * 3);
        }
      }

      const flash = isLockdown && Math.sin(performance.now() * 0.01) > 0;
      for (const beacon of tp.beaconLights) {
        const mat = beacon.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = flash ? 1.4 : 0.1;
      }
    }

    // 2. Aim Defense Turrets at Nearest Raiders
    for (const dt of this.defenseTurretMeshes) {
      let closestR: RaiderEntity | null = null;
      let minDist = 7.5;

      for (const r of this.city.raiders) {
        const d = Math.hypot(r.x - dt.x, r.z - dt.z);
        if (d < minDist) {
          minDist = d;
          closestR = r;
        }
      }

      if (closestR) {
        const targetAngle = Math.atan2(closestR.x - dt.x, closestR.z - dt.z);
        dt.turretHead.rotation.y = THREE.MathUtils.lerp(dt.turretHead.rotation.y, targetAngle, delta * 8);
      } else {
        dt.turretHead.rotation.y += delta * 0.4;
      }
    }

    // 3. Render Raider Units
    this.updateRaidersRendering(delta);

    // 4. Render Militia Units
    this.updateMilitiaRendering(delta);

    // 5. Render Combat Tracer Lasers, Bullets & Explosions
    this.updateCombatFXRendering(delta);
  }

  private updateRaidersRendering(delta: number) {
    const activeIds = new Set<string>();

    for (const r of this.city.raiders) {
      activeIds.add(r.id);
      let mesh = this.raiderMeshMap.get(r.id);

      if (!mesh) {
        mesh = this.createRaiderMesh(r);
        this.raiderGroup.add(mesh);
        this.raiderMeshMap.set(r.id, mesh);
      }

      const rawX = r.x + (r.targetX - r.x) * r.progress + 0.5;
      const rawZ = r.z + (r.targetZ - r.z) * r.progress + 0.5;
      const dx = r.targetX - r.x;
      const dz = r.targetZ - r.z;
      const len = Math.hypot(dx, dz);
      const laneOffset = r.laneOffset || 0.18;
      let perpX = 0;
      let perpZ = 0;
      if (len > 0.001) {
        perpX = (-dz / len) * laneOffset;
        perpZ = (dx / len) * laneOffset;
      } else {
        perpX = -Math.cos(r.rotation) * laneOffset;
        perpZ = Math.sin(r.rotation) * laneOffset;
      }
      mesh.position.set(rawX + perpX, 0.04, rawZ + perpZ);
      mesh.rotation.y = r.rotation;

      const { hpFill, hpContainer, maxHp } = mesh.userData;
      if (hpContainer) {
        hpContainer.quaternion.copy(this.camera.quaternion);
      }
      if (hpFill) {
        const ratio = Math.max(0, Math.min(1, r.hp / maxHp));
        hpFill.scale.x = ratio;
        hpFill.position.x = -0.17 * (1 - ratio);

        const mat = hpFill.material as THREE.MeshBasicMaterial;
        if (ratio > 0.5) {
          mat.color.setHex(0x22c55e);
        } else if (ratio > 0.25) {
          mat.color.setHex(0xf59e0b);
        } else {
          mat.color.setHex(0xef4444);
        }
      }
    }

    for (const [id, mesh] of this.raiderMeshMap.entries()) {
      if (!activeIds.has(id)) {
        // Only explode if the raider was truly destroyed by weapons fire!
        if (this.city.destroyedRaiderIds.has(id)) {
          this.spawnExplosionEffect(mesh.position.x, mesh.position.y + 0.2, mesh.position.z);
          this.city.destroyedRaiderIds.delete(id);
        }
        this.raiderGroup.remove(mesh);
        this.disposeHierarchy(mesh);
        this.raiderMeshMap.delete(id);
      }
    }
  }

  private updateMilitiaRendering(delta: number) {
    const activeIds = new Set<string>();

    for (const m of this.city.militiaUnits) {
      activeIds.add(m.id);
      let mesh = this.militiaMeshMap.get(m.id);

      if (!mesh) {
        mesh = this.createMilitiaMesh(m);
        this.militiaGroup.add(mesh);
        this.militiaMeshMap.set(m.id, mesh);
      }

      mesh.position.set(m.x + 0.5, 0.04, m.z + 0.5);
      mesh.rotation.y = m.rotation;

      const { hpFill, hpContainer, maxHp } = mesh.userData;
      if (hpContainer) {
        hpContainer.quaternion.copy(this.camera.quaternion);
      }
      if (hpFill) {
        const ratio = Math.max(0, Math.min(1, m.hp / maxHp));
        hpFill.scale.x = ratio;
        hpFill.position.x = -0.15 * (1 - ratio);
      }
    }

    for (const [id, mesh] of this.militiaMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.militiaGroup.remove(mesh);
        this.disposeHierarchy(mesh);
        this.militiaMeshMap.delete(id);
      }
    }
  }

  private updateCombatFXRendering(delta: number) {
    for (const line of this.activeTracerLines) {
      this.combatFXGroup.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.activeTracerLines = [];

    for (const shot of this.city.combatShots) {
      const points = [
        new THREE.Vector3(shot.fromX, shot.fromY, shot.fromZ),
        new THREE.Vector3(shot.toX, shot.toY, shot.toZ),
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(points);

      let shotColor = 0x38bdf8;
      if (shot.type === 'tower_laser') shotColor = 0x06b6d4;
      else if (shot.type === 'raider_rocket') shotColor = 0xf97316;
      else if (shot.type === 'raider_bullet') shotColor = 0xef4444;
      else if (shot.type === 'toll_turret') shotColor = 0xfacc15;
      else if (shot.type === 'militia_bullet') shotColor = 0x60a5fa;

      const mat = new THREE.LineBasicMaterial({
        color: shotColor,
        linewidth: 2,
        transparent: true,
        opacity: Math.max(0.2, shot.life),
      });

      const line = new THREE.Line(geom, mat);
      this.combatFXGroup.add(line);
      this.activeTracerLines.push(line);
    }

    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      const ep = this.explosionParticles[i];
      ep.life -= delta;
      ep.mesh.position.x += ep.vx * delta;
      ep.mesh.position.y += ep.vy * delta;
      ep.mesh.position.z += ep.vz * delta;

      const scale = 1 + (ep.maxLife - ep.life) * 2.8;
      ep.mesh.scale.set(scale, scale, scale);

      const mat = ep.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, ep.life / ep.maxLife);

      if (ep.life <= 0) {
        this.combatFXGroup.remove(ep.mesh);
        ep.mesh.geometry.dispose();
        mat.dispose();
        this.explosionParticles.splice(i, 1);
      }
    }

    // Dynamic Smoke & Fire on Attacked / Damaged Buildings
    if (this.explosionParticles.length < 50) {
      for (let x = 0; x < 36; x++) {
        for (let z = 0; z < 36; z++) {
          const cell = this.city.getCell(x, z);
          if (cell?.building && (cell.building.onFire || (cell.building.hp !== undefined && cell.building.hp < cell.building.maxHp * 0.75))) {
            if (Math.random() < 0.08) {
              const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 5, 5);
              const isFlame = cell.building.onFire && Math.random() < 0.5;
              const mat = new THREE.MeshBasicMaterial({
                color: isFlame ? (Math.random() < 0.5 ? 0xef4444 : 0xf97316) : 0x334155,
                transparent: true,
                opacity: isFlame ? 0.85 : 0.4,
              });
              const mesh = new THREE.Mesh(geo, mat);
              mesh.position.set(
                x + 0.3 + Math.random() * 0.4,
                0.35 + Math.random() * 0.3,
                z + 0.3 + Math.random() * 0.4
              );
              this.combatFXGroup.add(mesh);
              this.explosionParticles.push({
                mesh,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1.0,
                vx: (Math.random() - 0.5) * 0.25,
                vy: 0.4 + Math.random() * 0.6,
                vz: (Math.random() - 0.5) * 0.25,
              });
            }
          }
        }
      }
    }
  }

  public spawnExplosionEffect(x: number, y: number, z: number) {
    const count = 10;
    const colors = [0xf97316, 0xef4444, 0xfacc15, 0x475569];

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.combatFXGroup.add(mesh);

      this.explosionParticles.push({
        mesh,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 0.8 + Math.random() * 1.4,
        vz: (Math.random() - 0.5) * 1.6,
      });
    }
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

  // Optimized Vehicle Pool updates with Right-hand side lane discipline & Wheel Rotation
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
        const len = Math.hypot(dx, dz);
        let perpX = 0;
        let perpZ = 0;
        if (len > 0.001) {
          perpX = (-dz / len) * v.laneOffset;
          perpZ = (dx / len) * v.laneOffset;
        } else {
          perpX = -Math.cos(v.rotation) * v.laneOffset;
          perpZ = Math.sin(v.rotation) * v.laneOffset;
        }

        // Bridge vs Land road elevation: smooth approach ramp interpolation
        const fromCell = this.city.getCell(v.x, v.z);
        const toCell = this.city.getCell(v.targetX, v.targetZ);
        const fromIsBridge = fromCell?.terrain === 'water';
        const toIsBridge = toCell?.terrain === 'water';
        const fromY = fromIsBridge ? 0.11 : 0.05;
        const toY = toIsBridge ? 0.11 : 0.05;
        const vehY = THREE.MathUtils.lerp(fromY, toY, v.progress);

        poolItem.group.position.set(rawX + perpX, vehY, rawZ + perpZ);
        poolItem.group.rotation.y = v.rotation;

        // Determine active vehicle model variant
        let modelKey: 'sedan' | 'suv' | 'hatchback' | 'race_car' | 'bus' | 'tram' = 'sedan';
        if (v.type === 'bus' || v.type === 'firetruck' || v.type === 'garbage_truck') {
          modelKey = 'bus';
        } else if (v.type === 'tram') {
          modelKey = 'tram';
        } else if (v.type === 'taxi') {
          modelKey = 'sedan';
        } else if (v.modelVariant && poolItem.models[v.modelVariant]) {
          modelKey = v.modelVariant;
        }

        // Toggle sub-model visibility
        poolItem.models.sedan.container.visible = modelKey === 'sedan';
        poolItem.models.suv.container.visible = modelKey === 'suv';
        poolItem.models.hatchback.container.visible = modelKey === 'hatchback';
        poolItem.models.race_car.container.visible = modelKey === 'race_car';
        poolItem.models.bus.container.visible = modelKey === 'bus';
        poolItem.models.tram.container.visible = modelKey === 'tram';

        const activeModel = poolItem.models[modelKey];
        if (activeModel) {
          // Update body color
          for (const bMesh of activeModel.bodyMeshes) {
            (bMesh.material as THREE.MeshStandardMaterial).color.setStyle(v.color);
          }

          // Taxi sign on roof
          if (activeModel.taxiSign) {
            activeModel.taxiSign.visible = v.type === 'taxi';
          }

          // Wheels rotation animation based on vehicle movement along the road
          const wheelAngle = v.wheelAngle || 0;
          for (const wheel of activeModel.wheels) {
            wheel.rotation.x = wheelAngle;
          }

          // Headlights
          for (const hl of activeModel.headlights) {
            hl.visible = isNight;
          }

          // Brake lights: bright red when stopped in traffic or dwelling, dim red at night
          const isBraking = !!v.isBlocked || !!(v.dwellTimer && v.dwellTimer > 0);
          for (const tl of activeModel.taillights) {
            tl.visible = isNight || isBraking;
            tl.material = isBraking ? this.materials.brakeLight : this.materials.taillight;
          }
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

    this.renderer.toneMappingExposure = Math.min(1.2, Math.max(0.85, 1.05 + sunHeight * 0.1));

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
    const half = this.activeToolSize * 0.5;
    this.selectedTileMesh.position.set(x + half, 0.08, z + half);
    this.selectedTileMesh.scale.set(this.activeToolSize, 1, this.activeToolSize);
    this.selectedTileMesh.visible = true;
    this.hoverPlane.position.set(x + half, 0.05, z + half);
    this.hoverPlane.scale.set(this.activeToolSize, 1, this.activeToolSize);
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
    this.boundOnTouchStart = (e: TouchEvent) => {
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
    };
    el.addEventListener('touchstart', this.boundOnTouchStart, { passive: false });

    // Touch Move: pan camera smoothly without accidental building in Confirm Mode, or paint in Rapid Mode
    this.boundOnTouchMove = (e: TouchEvent) => {
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
    };
    el.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });

    // Touch End: handle deliberate taps without dragging
    this.boundOnTouchEnd = (e: TouchEvent) => {
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
    };
    el.addEventListener('touchend', this.boundOnTouchEnd, { passive: false });

    // Desktop Mouse Pointer Events
    this.boundOnMouseDown = (e: MouseEvent) => {
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
    };
    el.addEventListener('mousedown', this.boundOnMouseDown);

    this.boundOnContextMenu = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', this.boundOnContextMenu);

    this.boundOnMouseMove = (e: MouseEvent) => {
      const coord = this.getCoordFromClient(e.clientX, e.clientY);
      if (coord) {
        this.hoveredCoord = coord;
        const half = this.activeToolSize * 0.5;
        this.hoverPlane.position.set(coord.x + half, 0.05, coord.z + half);
        this.hoverPlane.scale.set(this.activeToolSize, 1, this.activeToolSize);
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
    };
    window.addEventListener('mousemove', this.boundOnMouseMove);

    this.boundOnMouseUp = (e: MouseEvent) => {
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
    };
    window.addEventListener('mouseup', this.boundOnMouseUp);

    this.boundOnWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.cameraRadius = Math.max(10, Math.min(70, this.cameraRadius + e.deltaY * 0.04));
      this.updateCameraTransform();
    };
    el.addEventListener('wheel', this.boundOnWheel, { passive: false });

    window.addEventListener('resize', this.onResize);
  }

  private unbindTouchAndPointerEvents() {
    const el = this.renderer?.domElement;
    if (el) {
      if (this.boundOnTouchStart) el.removeEventListener('touchstart', this.boundOnTouchStart);
      if (this.boundOnTouchMove) el.removeEventListener('touchmove', this.boundOnTouchMove);
      if (this.boundOnTouchEnd) el.removeEventListener('touchend', this.boundOnTouchEnd);
      if (this.boundOnMouseDown) el.removeEventListener('mousedown', this.boundOnMouseDown);
      if (this.boundOnContextMenu) el.removeEventListener('contextmenu', this.boundOnContextMenu);
      if (this.boundOnWheel) el.removeEventListener('wheel', this.boundOnWheel);
    }
    if (this.boundOnMouseMove) window.removeEventListener('mousemove', this.boundOnMouseMove);
    if (this.boundOnMouseUp) window.removeEventListener('mouseup', this.boundOnMouseUp);
    window.removeEventListener('resize', this.onResize);
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

  public activeToolSize: 1 | 2 | 4 = 1;

  public setToolSize(size: 1 | 2 | 4) {
    this.activeToolSize = size;
    if (this.hoverPlane) {
      this.hoverPlane.scale.set(size, 1, size);
    }
    if (this.selectedTileMesh) {
      this.selectedTileMesh.scale.set(size, 1, size);
    }
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
    if (this.sunLight) {
      this.sunLight.castShadow = enabled;
    }
  }

  public setGraphicsQuality(quality: 'ultra' | 'high' | 'balanced' | 'low') {
    if (!this.renderer) return;
    if (quality === 'ultra') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (this.sunLight) {
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.map?.dispose();
        this.sunLight.shadow.map = null;
      }
    } else if (quality === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (this.sunLight) {
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
      }
    } else if (quality === 'balanced') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      if (this.sunLight) {
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
      }
    } else {
      // Low (Performance / MediaTek optimization)
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
      if (this.sunLight) {
        this.sunLight.castShadow = false;
      }
    }
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
      try {
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
        this.updateTowerDefenseRendering(delta);

        // Frustum culling for high-performance rendering of off-camera buildings and foliage
        this.camera.updateMatrixWorld();
        this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

        const cullGroup = (group: THREE.Group) => {
          for (let i = 0; i < group.children.length; i++) {
            const child = group.children[i];
            const pos = child.position;
            const inFrustum = this.frustum.containsPoint(pos) ||
              (Math.abs(pos.x - this.cameraTarget.x) < this.cameraRadius * 1.6 &&
               Math.abs(pos.z - this.cameraTarget.z) < this.cameraRadius * 1.6);
            child.visible = inFrustum;
          }
        };

        cullGroup(this.buildingGroup);
        cullGroup(this.serviceGroup);
        cullGroup(this.foliageGroup);

        this.renderer.render(this.scene, this.camera);
        this.animFrameId = requestAnimationFrame(loop);
      } catch (err) {
        console.error('Three.js render loop exception:', err);
        if (this.onCrash) {
          this.onCrash();
        }
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.unbindTouchAndPointerEvents();

    // Dispose all scene hierarchy groups
    this.disposeHierarchy(this.terrainGroup);
    this.disposeHierarchy(this.roadGroup);
    this.disposeHierarchy(this.buildingGroup);
    this.disposeHierarchy(this.serviceGroup);
    this.disposeHierarchy(this.vehicleGroup);
    this.disposeHierarchy(this.pedestrianGroup);
    this.disposeHierarchy(this.overlayGroup);
    this.disposeHierarchy(this.particleGroup);
    this.disposeHierarchy(this.foliageGroup);
    this.disposeHierarchy(this.gatewayGroup);
    this.disposeHierarchy(this.raiderGroup);
    this.disposeHierarchy(this.militiaGroup);
    this.disposeHierarchy(this.combatFXGroup);

    // Dispose shared geometries
    for (const key in this.sharedGeos) {
      try {
        this.sharedGeos[key]?.dispose();
      } catch {}
    }
    this.sharedGeos = {};

    // Dispose shared materials & textures
    for (const key in this.materials) {
      try {
        const mat = this.materials[key];
        if ('map' in mat && (mat as any).map) {
          ((mat as any).map as THREE.Texture).dispose();
        }
        mat?.dispose();
      } catch {}
    }
    this.materials = {};

    // Dispose interaction meshes
    try {
      this.hoverPlane?.geometry?.dispose();
      (this.hoverPlane?.material as THREE.Material)?.dispose();
      this.selectedTileMesh?.geometry?.dispose();
      (this.selectedTileMesh?.material as THREE.Material)?.dispose();
    } catch {}

    // Dispose renderer and force GPU context release
    if (this.renderer) {
      try {
        this.renderer.dispose();
        this.renderer.forceContextLoss();
      } catch {}
      if (this.container && this.renderer.domElement && this.renderer.domElement.parentElement === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}
