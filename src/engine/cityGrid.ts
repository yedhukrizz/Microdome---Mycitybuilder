import {
  ActiveTool,
  BuildingData,
  CellData,
  CityBudget,
  CityDemands,
  CityHistorySnapshot,
  CityStats,
  DirectBuildingType,
  Milestone,
  OverlayMode,
  RoadData,
  RoadType,
  ServiceData,
  ServiceType,
  Vehicle,
  CarModelVariant,
  VehicleTripState,
  Pedestrian,
  ZoneType,
  RaiderEntity,
  MilitiaEntity,
  CombatShot,
  DefenseStatus,
} from '../types/city';
import { soundEngine } from '../audio/soundEngine';

export const GRID_SIZE = 36;

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'm1',
    name: 'Pioneer Hamlet',
    populationRequired: 30,
    achieved: false,
    rewardMoney: 15000,
    description: 'First citizens have settled! Unlocked Basic Healthcare & Elementary Education.',
    unlockedFeatures: ['Clinic', 'Elementary School'],
  },
  {
    id: 'm2',
    name: 'Flourishing Village',
    populationRequired: 100,
    achieved: false,
    rewardMoney: 30000,
    description: 'City is expanding! Unlocked Fire Department & Police Precinct.',
    unlockedFeatures: ['Fire Station', 'Police Station'],
  },
  {
    id: 'm3',
    name: 'Bustling Town',
    populationRequired: 300,
    achieved: false,
    rewardMoney: 60000,
    description: 'A proper town with commerce! Unlocked Solar Energy & Avenue Boulevards.',
    unlockedFeatures: ['Solar Farm', 'Avenue Roads', 'Large Park'],
  },
  {
    id: 'm4',
    name: 'Thriving City',
    populationRequired: 750,
    achieved: false,
    rewardMoney: 120000,
    description: 'Major urban center! Unlocked High-Density Offices & City Hospital.',
    unlockedFeatures: ['Hospital', 'University', 'Office Zoning'],
  },
  {
    id: 'm5',
    name: 'Grand Metropolis',
    populationRequired: 1800,
    achieved: false,
    rewardMoney: 250000,
    description: 'A world-class metropolis! Unlocked Metropolitan Stadium & Highways.',
    unlockedFeatures: ['Metropolitan Stadium', 'Highway System'],
  },
  {
    id: 'm6',
    name: 'Eco Capital',
    populationRequired: 3500,
    achieved: false,
    rewardMoney: 450000,
    description: 'A green paradise! Unlocked Nuclear & Geothermal Power, Recycling Centers, & Forests.',
    unlockedFeatures: ['Nuclear Plant', 'Geothermal Plant', 'Recycling Center', 'Forests'],
  },
  {
    id: 'm7',
    name: 'Futuristic Megalopolis',
    populationRequired: 7000,
    achieved: false,
    rewardMoney: 850000,
    description: 'Advanced urban transit! Unlocked Subway Stations, Tram Depots, & Incinerators.',
    unlockedFeatures: ['Subway Station', 'Tram Depot', 'Incinerator'],
  },
  {
    id: 'm8',
    name: 'Quantum Singularity City',
    populationRequired: 15000,
    achieved: false,
    rewardMoney: 2000000,
    description: 'The pinnacle of civilization! Unlocked Fusion Reactors & Desalination Mega-Plants.',
    unlockedFeatures: ['Fusion Reactor', 'Desalination Plant'],
  },
];

export const TOOL_COSTS: Record<string, number> = {
  // Roads
  road_two_lane: 20,
  road_avenue: 50,
  road_highway: 100,
  road_mud: 10,
  road_rural: 15,
  road_pavement: 30,
  road_pedestrian: 25,
  road_toll_booth: 150,
  // Zones
  zone_residential: 10,
  zone_commercial: 10,
  zone_industrial: 10,
  zone_office: 15,
  zone_dezone: 0,
  // Direct Buildings
  bld_home_suburban: 350,
  bld_apartment_tower: 1200,
  bld_corner_store: 450,
  bld_commercial_center: 1500,
  bld_clean_factory: 800,
  bld_tech_office: 1800,
  bld_condo_complex_2x2: 3800,
  bld_mall_galleria_2x2: 4500,
  bld_logistics_hub_2x2: 3200,
  bld_corporate_plaza_2x2: 5500,
  bld_tech_megaplex_4x4: 18000,
  // Utilities
  wind_turbine: 6000,
  solar_farm: 14000,
  coal_plant: 25000,
  nuclear_plant: 80000,
  geothermal_plant: 45000,
  fusion_reactor: 250000,
  water_tower: 4500,
  sewage_plant: 9000,
  desalination_plant: 35000,
  // Services & Transit
  clinic: 8000,
  hospital: 28000,
  fire_station: 10000,
  police_station: 11000,
  elementary_school: 12000,
  university: 45000,
  small_park: 3000,
  medium_park: 6000,
  large_park: 10000,
  grand_park: 20000,
  stadium: 65000,
  parking_lot: 1500,
  bus_station: 5000,
  subway_station: 30000,
  tram_depot: 20000,
  recycling_center: 15000,
  incinerator: 22000,
  army_barracks: 15000,
  defense_tower: 12000,
  forest: 2000,
};

export const SERVICE_MAINTENANCE: Record<ServiceType, number> = {
  wind_turbine: 80,
  solar_farm: 180,
  coal_plant: 450,
  nuclear_plant: 850,
  geothermal_plant: 350,
  fusion_reactor: 2200,
  water_tower: 60,
  sewage_plant: 150,
  desalination_plant: 400,
  recycling_center: 180,
  incinerator: 300,
  clinic: 200,
  hospital: 750,
  fire_station: 250,
  police_station: 280,
  elementary_school: 240,
  university: 900,
  small_park: 50,
  medium_park: 90,
  large_park: 160,
  grand_park: 300,
  stadium: 1200,
  parking_lot: 20,
  bus_station: 120,
  subway_station: 450,
  tram_depot: 250,
  army_barracks: 400,
  defense_tower: 300,
  forest: 30,
};

export class CityManager {
  public grid: CellData[][] = [];
  public budget: CityBudget = {
    treasury: 75000,
    incomePerWeek: 0,
    expensesPerWeek: 0,
    taxRateResidential: 10,
    taxRateCommercial: 10,
    taxRateIndustrial: 10,
    taxRateOffice: 10,
  };
  public stats: CityStats = {
    population: 0,
    jobs: 0,
    employed: 0,
    unemploymentRate: 0,
    cityHappiness: 75,
    powerProduction: 0,
    powerConsumption: 0,
    waterProduction: 0,
    waterConsumption: 0,
    dayTime: 10.0,
    simulationSpeed: 1,
    week: 1,
    year: 2026,
    totalCarsOnRoad: 0,
    highwayCommuters: 0,
    trafficCongestionRate: 0,

    // Algorithmic Education
    educationLevel: 45,
    uneducatedRate: 35,
    highSchoolRate: 50,
    universityRate: 15,
    schoolCapacity: 350,
    studentsEnrolled: 0,

    // Algorithmic Earning & Economy
    averageIncome: 580,
    totalWagesPaid: 0,
    povertyRate: 8,
    commercialTurnover: 0,

    // City Capacities & Sector Inflow
    housingCapacity: 32,
    housingOccupancy: 100,
    commercialCapacity: 20,
    commercialEmployees: 16,
    commercialShoppers: 12,
    industrialCapacity: 20,
    industrialEmployees: 16,
    officeCapacity: 10,
    officeEmployees: 8,

    // Migration & Demographics Flow
    netMigration: 0,
    citizenInflow: 0,
    citizenOutflow: 0,

    // Abandonment & Grid Outages
    abandonedBuildings: 0,
    unpoweredBuildings: 0,
    unwateredBuildings: 0,

    // Citizen Needs Satisfaction Scores (0 to 100%)
    needsPower: 100,
    needsWater: 100,
    needsHealth: 50,
    needsEducation: 50,
    needsSafety: 50,
    needsJobs: 100,
    needsTaxSatisfaction: 100,
    needsEnvironment: 100,
    wasteGenerated: 0,
    wasteProcessed: 0,
    wasteCoverage: 100,
    needsWaste: 100,
  };
  public demands: CityDemands = {
    residential: 60,
    commercial: 40,
    industrial: 45,
    office: 30,
    education: 40,
    fire: 25,
    health: 30,
    entertainment: 35,
    parks: 30,
  };
  public milestones: Milestone[] = JSON.parse(JSON.stringify(INITIAL_MILESTONES));
  public vehicles: Vehicle[] = [];
  public pedestrians: Pedestrian[] = [];
  public raiders: RaiderEntity[] = [];
  public militiaUnits: MilitiaEntity[] = [];
  public combatShots: CombatShot[] = [];
  public waveNumber: number = 0;
  public waveActive: boolean = false;
  public raidersRemaining: number = 0;
  public totalRaidersInWave: number = 0;
  public waveTimer: number = 45; // 45s countdown to initial wave
  public waveWarningTriggered: boolean = false;
  public lastWaveResult: 'victory' | 'surrender' | 'defeat' | null = null;
  public lastWaveAmount: number = 0;
  public onWaveEvent?: (event: 'warning' | 'start' | 'victory' | 'surrender' | 'defeat', details: any) => void;
  public totalDamageIncurred: number = 0;
  public damageRepairsPaid: number = 0;
  public destroyedRaiderIds: Set<string> = new Set();

  public history: CityHistorySnapshot[] = [];
  public overlayMode: OverlayMode = 'none';
  public onMilestoneAchieved?: (milestone: Milestone) => void;
  public onChirpTrigger?: (type: 'happy' | 'concern' | 'news' | 'warning', text: string) => void;

  public highwayPortalCoord: { x: number; z: number } = { x: 8, z: 0 };

  public exportData(): any {
    return {
      grid: this.grid,
      budget: this.budget,
      stats: this.stats,
      demands: this.demands,
      milestones: this.milestones,
      vehicles: this.vehicles,
      pedestrians: this.pedestrians,
      history: this.history,
      highwayPortalCoord: this.highwayPortalCoord,
    };
  }

  public importData(data: any) {
    if (!data) return;
    if (data.grid) this.grid = data.grid;
    if (data.budget) this.budget = data.budget;
    if (data.stats) this.stats = data.stats;
    if (data.demands) this.demands = data.demands;
    if (data.milestones) this.milestones = data.milestones;
    if (data.vehicles) this.vehicles = data.vehicles;
    if (data.pedestrians) this.pedestrians = data.pedestrians;
    if (data.history) this.history = data.history;
    if (data.highwayPortalCoord) this.highwayPortalCoord = data.highwayPortalCoord;
  }

  private simAccumulator = 0;
  private weekAccumulator = 0;
  private vehicleIdCounter = 0;
  private pedestrianIdCounter = 0;
  private buildingIdCounter = 0;
  private previousPopulation = 0;

  // Ultra-high performance typed buffers for zero-allocation BFS road pathfinding
  private bfsVisited = new Uint16Array(GRID_SIZE * GRID_SIZE);
  private bfsParent = new Int16Array(GRID_SIZE * GRID_SIZE);
  private bfsQueue = new Int16Array(GRID_SIZE * GRID_SIZE);
  private bfsToken = 1;

  constructor(preset: 'starter' | 'busy' | 'delta' = 'starter') {
    this.initMap(preset);
  }

  public initMap(preset: 'starter' | 'busy' | 'delta') {
    this.grid = [];
    this.vehicles = [];
    this.pedestrians = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      this.grid[x] = [];
      for (let z = 0; z < GRID_SIZE; z++) {
        let terrain: 'grass' | 'water' | 'sand' = 'grass';
        let elevation = 0;

        // River curving through map
        const riverCurve = Math.sin((x / GRID_SIZE) * Math.PI * 1.5) * 6 + 18;
        const distToRiver = Math.abs(z - riverCurve);

        if (distToRiver < 2.2) {
          terrain = 'water';
          elevation = -0.3;
        } else if (distToRiver < 3.2) {
          terrain = 'sand';
        }

        this.grid[x][z] = {
          x,
          z,
          terrain,
          elevation,
          road: null,
          zone: null,
          building: null,
          service: null,
          hasPower: false,
          hasWater: false,
          pollution: 0,
          landValue: 50,
          fireCoverage: false,
          policeCoverage: false,
          healthCoverage: false,
          educationCoverage: false,
        };
      }
    }

    if (preset === 'starter') {
      this.setupStarterCity();
    } else if (preset === 'busy') {
      this.setupBustlingCity();
    } else if (preset === 'delta') {
      this.setupDeltaCity();
    }

    this.recalculateRoadConnections();
    this.recomputeNetworksAndSimulation(true);

    // Seed initial history snapshots so charts have rich trendlines immediately
    this.history = [];
    const basePop = Math.max(20, this.stats.population);
    for (let w = 8; w >= 1; w--) {
      const p = Math.max(10, Math.round(basePop - w * (basePop / 10)));
      const emp = Math.round(p * 0.6);
      this.history.push({
        week: Math.max(1, 52 - w),
        year: 2025,
        population: p,
        employed: emp,
        jobs: Math.round(emp * 1.1),
        unemploymentRate: Math.max(3, 8 - w),
        averageIncome: Math.round(520 + (8 - w) * 12),
        educationLevel: Math.round(38 + (8 - w) * 1.2),
        uneducatedRate: Math.max(25, 42 - (8 - w)),
        highSchoolRate: Math.min(60, 45 + (8 - w)),
        universityRate: Math.min(25, 13 + Math.floor((8 - w) / 2)),
        cityHappiness: Math.min(95, 70 + (8 - w)),
        demandResidential: Math.round(55 + Math.sin(w) * 10),
        demandCommercial: Math.round(35 + Math.cos(w) * 8),
        demandIndustrial: Math.round(40 + Math.sin(w * 1.5) * 8),
        demandOffice: Math.round(25 + (8 - w) * 1.5),
        treasury: Math.round(50000 + (8 - w) * 2000),
        weeklyIncome: Math.round(1200 + p * 8),
        weeklyExpenses: Math.round(600 + p * 3),
      });
    }
  }

  private setupStarterCity() {
    this.budget.treasury = 75000;
    this.highwayPortalCoord = { x: 10, z: 0 };

    // 1. Regional Highway connection from north border (z=0) into downtown
    for (let z = 0; z <= 5; z++) {
      this.placeRoad(10, z, 'highway', false);
      if (z === 0) {
        this.grid[10][z].road!.isHighwayGateway = true;
      }
    }

    // 2. Central Boulevard (Avenue) connecting east to west
    for (let x = 6; x <= 14; x++) {
      this.placeRoad(x, 6, 'avenue', false);
    }

    // 3. Local Grid Streets defining distinct neighborhood blocks
    // Western industrial spur
    for (let z = 6; z <= 8; z++) {
      this.placeRoad(5, z, 'two_lane', false);
    }
    this.placeRoad(6, 8, 'two_lane', false);
    this.placeRoad(7, 8, 'two_lane', false);

    // Residential central loop
    for (let z = 7; z <= 10; z++) {
      this.placeRoad(8, z, 'two_lane', false);
      this.placeRoad(12, z, 'two_lane', false);
    }
    for (let x = 9; x <= 11; x++) {
      this.placeRoad(x, 10, 'two_lane', false);
    }

    // Commercial & Office east spur
    this.placeRoad(13, 8, 'two_lane', false);
    this.placeRoad(14, 8, 'two_lane', false);

    // 4. Civic Utilities (Power & Water)
    // Wind turbine at (4, 6) -> 25 MW
    this.placeService(4, 6, 'wind_turbine', false);
    // Water tower at (4, 7) -> 10,000 m3
    this.placeService(4, 7, 'water_tower', false);

    // 5. Civic Services, Parks & Parking Areas
    this.placeService(12, 5, 'clinic', false);            // Town Health Clinic
    this.placeService(8, 5, 'elementary_school', false);  // Town Elementary School
    this.placeService(10, 7, 'small_park', false);        // Central Neighborhood Park
    this.placeService(11, 5, 'parking_lot', false);       // Downtown Park & Ride Lot
    this.placeService(15, 8, 'parking_lot', false);       // Commercial & Office District Parking

    // 6. District 1: Cozy Residential Neighborhood (Home)
    const resCoords = [
      [9, 7], [11, 7],
      [9, 8], [10, 8], [11, 8],
      [9, 9], [10, 9], [11, 9],
    ];
    for (const [rx, rz] of resCoords) {
      this.setZone(rx, rz, 'residential', false);
      const b = this.spawnBuilding(rx, rz, 'residential', 1);
      b.residents = 6;
      b.hasPower = true;
      b.hasWater = true;
    }

    // 7. District 2: Commercial District (Shops, Cafes & Boutiques)
    const commCoords = [[13, 7], [14, 7], [13, 9]];
    for (const [cx, cz] of commCoords) {
      this.setZone(cx, cz, 'commercial', false);
      const b = this.spawnBuilding(cx, cz, 'commercial', 1);
      b.workers = 6;
      b.hasPower = true;
      b.hasWater = true;
    }

    // 8. District 3: Office District (Modern Tech & Professional Studios)
    const officeCoords = [[13, 5], [14, 5], [14, 9]];
    for (const [ox, oz] of officeCoords) {
      this.setZone(ox, oz, 'office', false);
      const b = this.spawnBuilding(ox, oz, 'office', 1);
      b.workers = 8;
      b.hasPower = true;
      b.hasWater = true;
    }

    // 9. District 4: Industrial District (Workshops & Clean Manufacturing)
    const indCoords = [[6, 7], [7, 7], [5, 9], [6, 9]];
    for (const [ix, iz] of indCoords) {
      this.setZone(ix, iz, 'industrial', false);
      const b = this.spawnBuilding(ix, iz, 'industrial', 1);
      b.workers = 7;
      b.hasPower = true;
      b.hasWater = true;
    }

    // Recalculate road connections & networks
    this.recalculateRoadConnections();
    this.recomputeNetworksAndSimulation(true);

    // Seed lively cars and pedestrians immediately so the starter model feels instantly alive!
    for (let i = 0; i < 6; i++) {
      this.manageRealisticTraffic();
      this.manageRealisticPedestrians();
    }
  }

  private setupBustlingCity() {
    this.budget.treasury = 220000;
    this.highwayPortalCoord = { x: 10, z: 0 };

    // Highway entering from outside world
    for (let z = 0; z < 6; z++) {
      this.placeRoad(10, z, 'highway', false);
      if (z === 0) {
        this.grid[10][z].road!.isHighwayGateway = true;
      }
    }

    // Dedicated Utility Corridor road along x=3 from z=6 to 24
    for (let z = 6; z <= 24; z++) {
      if (this.grid[3][z].terrain !== 'water') {
        this.placeRoad(3, z, 'two_lane', false);
      }
    }

    // Grid of roads
    for (let x = 4; x <= 22; x += 3) {
      for (let z = 6; z <= 24; z++) {
        if (this.grid[x][z].terrain !== 'water') {
          this.placeRoad(x, z, 'two_lane', false);
        }
      }
    }
    for (let z = 6; z <= 24; z += 4) {
      for (let x = 3; x <= 22; x++) {
        if (this.grid[x][z].terrain !== 'water') {
          this.placeRoad(x, z, 'two_lane', false);
        }
      }
    }

    // Abundant Clean & Reliable Utilities (Directly connected to road x=3!)
    // Power Generation: 160 + 65 + 25 + 25 + 25 = 300 MW (abundant for the metropolis!)
    this.placeService(2, 7, 'coal_plant', false);
    this.placeService(2, 11, 'solar_farm', false);
    this.placeService(2, 15, 'wind_turbine', false);
    this.placeService(2, 19, 'wind_turbine', false);
    this.placeService(2, 23, 'wind_turbine', false);

    // Water Generation: 10k + 10k + 10k + 20k = 50,000 m3/day (abundant water supply!)
    this.placeService(1, 9, 'water_tower', false);
    this.placeService(1, 13, 'water_tower', false);
    this.placeService(1, 17, 'water_tower', false);
    this.placeService(1, 21, 'sewage_plant', false);

    // Services & Gathering Parks
    this.placeService(7, 10, 'clinic', false);
    this.placeService(7, 14, 'elementary_school', false);
    this.placeService(13, 10, 'fire_station', false);
    this.placeService(13, 14, 'police_station', false);
    this.placeService(10, 18, 'large_park', false); // Grand central gathering park
    this.placeService(7, 7, 'small_park', false);   // Neighborhood plaza park
    this.placeService(16, 10, 'small_park', false);  // Commercial shopping park

    // Buildings & Zones with rich population and jobs
    for (let x = 5; x <= 6; x++) {
      for (let z = 7; z <= 17; z++) {
        if (!this.grid[x][z].road && !this.grid[x][z].service) {
          this.setZone(x, z, 'residential', false);
          const lvl = Math.floor(Math.random() * 3) + 1;
          const b = this.spawnBuilding(x, z, 'residential', lvl);
          b.residents = Math.floor(b.maxResidents * 0.85);
          b.hasPower = true;
          b.hasWater = true;
          b.isAbandoned = false;
        }
      }
    }
    for (let x = 8; x <= 9; x++) {
      for (let z = 7; z <= 17; z++) {
        if (!this.grid[x][z].road && !this.grid[x][z].service) {
          this.setZone(x, z, 'commercial', false);
          const lvl = Math.floor(Math.random() * 3) + 1;
          const b = this.spawnBuilding(x, z, 'commercial', lvl);
          b.workers = Math.floor(b.maxWorkers * 0.85);
          b.hasPower = true;
          b.hasWater = true;
          b.isAbandoned = false;
        }
      }
    }
    for (let x = 14; x <= 16; x++) {
      for (let z = 18; z <= 23; z++) {
        if (!this.grid[x][z].road && !this.grid[x][z].service && this.grid[x][z].terrain !== 'water') {
          const zoneType = x === 16 ? 'office' : 'industrial';
          this.setZone(x, z, zoneType, false);
          const lvl = Math.floor(Math.random() * 2) + 1;
          const b = this.spawnBuilding(x, z, zoneType, lvl);
          b.workers = Math.floor(b.maxWorkers * 0.85);
          b.hasPower = true;
          b.hasWater = true;
          b.isAbandoned = false;
        }
      }
    }

    this.milestones[0].achieved = true;
    this.milestones[1].achieved = true;

    // Populate with traffic and pedestrians
    for (let i = 0; i < 15; i++) {
      this.manageRealisticTraffic();
      this.manageRealisticPedestrians();
    }
  }

  private setupDeltaCity() {
    this.budget.treasury = 110000;
    this.highwayPortalCoord = { x: 0, z: 18 };

    // Highway Bridge from outside west border (x=0) crossing the river to east
    for (let x = 0; x <= 26; x++) {
      this.placeRoad(x, 18, 'highway', false);
      if (x === 0) {
        this.grid[x][18].road!.isHighwayGateway = true;
      }
    }

    // Loop roads on North bank
    for (let z = 10; z <= 17; z++) {
      this.placeRoad(14, z, 'two_lane', false);
      this.placeRoad(22, z, 'two_lane', false);
    }
    for (let x = 12; x <= 22; x++) {
      this.placeRoad(x, 12, 'two_lane', false);
    }
    // Utility access spur
    this.placeRoad(12, 10, 'two_lane', false);
    this.placeRoad(13, 10, 'two_lane', false);
    this.placeRoad(14, 10, 'two_lane', false);
    this.placeRoad(12, 11, 'two_lane', false);
    this.placeRoad(13, 11, 'two_lane', false);

    // Utilities connected directly to road spur
    this.placeService(11, 10, 'wind_turbine', false);
    this.placeService(11, 11, 'water_tower', false);
    this.placeService(18, 14, 'small_park', false);

    for (let x = 15; x <= 17; x++) {
      for (let z = 13; z <= 16; z++) {
        this.setZone(x, z, 'residential', false);
        const b = this.spawnBuilding(x, z, 'residential', 1);
        b.residents = Math.floor(b.maxResidents * 0.85);
        b.hasPower = true;
        b.hasWater = true;
        b.isAbandoned = false;
      }
    }

    for (let i = 0; i < 6; i++) {
      this.manageRealisticTraffic();
      this.manageRealisticPedestrians();
    }
  }

  public getCell(x: number, z: number): CellData | null {
    if (x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE) return null;
    return this.grid[x][z];
  }

  public applyTool(x: number, z: number, tool: ActiveTool): { success: boolean; message?: string } {
    const size = tool.size || (
      tool.category === 'buildings'
        ? (tool.buildingType === 'tech_megaplex_4x4' ? 4 : tool.buildingType.includes('2x2') ? 2 : 1)
        : 1
    );

    if (x + size > GRID_SIZE || z + size > GRID_SIZE) {
      return { success: false, message: `Cannot place ${size}x${size} element out of city grid bounds!` };
    }

    const cell = this.getCell(x, z);
    if (!cell) return { success: false, message: 'Invalid coordinate' };

    switch (tool.category) {
      case 'roads': {
        const costKey = `road_${tool.roadType}`;
        const costPerTile = TOOL_COSTS[costKey] || 30;
        const totalCost = costPerTile * size * size;
        if (this.budget.treasury < totalCost) {
          return { success: false, message: `Insufficient funds for road! Need $${totalCost}` };
        }

        for (let dx = 0; dx < size; dx++) {
          for (let dz = 0; dz < size; dz++) {
            const c = this.getCell(x + dx, z + dz);
            if (c?.building || c?.service) {
              return { success: false, message: 'Tile is occupied by building or service!' };
            }
          }
        }

        this.budget.treasury -= totalCost;
        for (let dx = 0; dx < size; dx++) {
          for (let dz = 0; dz < size; dz++) {
            this.placeRoad(x + dx, z + dz, tool.roadType, false);
          }
        }
        this.recalculateRoadConnections();
        this.recomputeNetworksAndSimulation(true);
        return { success: true };
      }

      case 'zones': {
        const costKey = `zone_${tool.zoneType}`;
        const costPerTile = TOOL_COSTS[costKey] || 10;
        const totalCost = costPerTile * size * size;
        if (this.budget.treasury < totalCost) {
          return { success: false, message: `Insufficient funds for zoning! Need $${totalCost}` };
        }

        if (tool.zoneType === 'dezone') {
          for (let dx = 0; dx < size; dx++) {
            for (let dz = 0; dz < size; dz++) {
              const c = this.getCell(x + dx, z + dz);
              if (c) {
                c.building = null;
                c.zone = null;
              }
            }
          }
          this.recomputeNetworksAndSimulation(true);
          return { success: true };
        }

        this.budget.treasury -= totalCost;
        if (size > 1) {
          // Check if whole footprint is buildable
          let canPlaceMulti = true;
          for (let dx = 0; dx < size; dx++) {
            for (let dz = 0; dz < size; dz++) {
              const c = this.getCell(x + dx, z + dz);
              if (!c || c.terrain === 'water' || c.road || c.service) {
                canPlaceMulti = false;
                break;
              }
            }
            if (!canPlaceMulti) break;
          }

          if (canPlaceMulti) {
            const multiB = this.spawnBuilding(x, z, tool.zoneType, size === 4 ? 4 : 2, size as 2 | 4);
            multiB.name = size === 4
              ? (tool.zoneType === 'office' ? 'TECH MEGAPLEX' : tool.zoneType === 'residential' ? 'GARDEN RESIDENCES' : tool.zoneType === 'commercial' ? 'GRAND GALLERIA' : 'GIGAFACTORY HUB')
              : (tool.zoneType === 'residential' ? 'CONDO COMPLEX' : tool.zoneType === 'commercial' ? 'SHOPPING GALLERIA' : tool.zoneType === 'office' ? 'CORPORATE PLAZA' : 'LOGISTICS HUB');
            multiB.constructionProgress = 1.0;

            for (let dx = 0; dx < size; dx++) {
              for (let dz = 0; dz < size; dz++) {
                const subCell = this.grid[x + dx][z + dz];
                subCell.zone = tool.zoneType;
                subCell.building = multiB;
                subCell.road = null;
                subCell.service = null;
                subCell.hasTree = false;
              }
            }
            this.recomputeNetworksAndSimulation(true);
            return { success: true };
          }
        }

        for (let dx = 0; dx < size; dx++) {
          for (let dz = 0; dz < size; dz++) {
            const c = this.getCell(x + dx, z + dz);
            if (c) {
              if (c.terrain === 'water' || c.road || c.service) continue;
              this.setZone(x + dx, z + dz, tool.zoneType, false);
              if (!c.building) {
                this.spawnBuilding(x + dx, z + dz, tool.zoneType, 1);
              } else if (c.building.zone === tool.zoneType && c.building.level < 5) {
                c.building.level += 1;
                c.building.height = 0.8 + c.building.level * 0.6;
              }
            }
          }
        }
        this.recomputeNetworksAndSimulation(true);
        return { success: true };
      }

      case 'buildings': {
        const footprint = (tool.buildingType === 'tech_megaplex_4x4' ? 4 : tool.buildingType.includes('2x2') ? 2 : size) as (1 | 2 | 4);
        if (x + footprint > GRID_SIZE || z + footprint > GRID_SIZE) {
          return { success: false, message: `Cannot place ${footprint}x${footprint} building out of city bounds!` };
        }

        for (let dx = 0; dx < footprint; dx++) {
          for (let dz = 0; dz < footprint; dz++) {
            const c = this.getCell(x + dx, z + dz);
            if (!c || c.terrain === 'water') {
              return { success: false, message: 'Cannot build on water!' };
            }
            if (c.road || c.service || c.building) {
              return { success: false, message: `Area for ${footprint}x${footprint} building is occupied! Bulldoze first.` };
            }
          }
        }

        const costKey = `bld_${tool.buildingType}`;
        const cost = TOOL_COSTS[costKey] || (footprint === 4 ? 18000 : footprint === 2 ? 3800 : 500);
        if (this.budget.treasury < cost) {
          return { success: false, message: `Insufficient funds! Need $${cost}` };
        }

        this.budget.treasury -= cost;
        const masterB = this.spawnBuilding(x, z, tool.zone, tool.level, footprint);
        masterB.name = tool.buildingType.replace(/_/g, ' ').toUpperCase();
        masterB.constructionProgress = 1.0;

        for (let dx = 0; dx < footprint; dx++) {
          for (let dz = 0; dz < footprint; dz++) {
            const subCell = this.grid[x + dx][z + dz];
            subCell.building = masterB;
            subCell.zone = tool.zone;
            subCell.road = null;
            subCell.service = null;
            subCell.hasTree = false;
          }
        }

        this.recomputeNetworksAndSimulation(true);
        return { success: true };
      }

      case 'utilities':
      case 'services': {
        const footprint = (tool.serviceType === 'stadium' || tool.serviceType === 'university' || tool.serviceType === 'grand_park' || tool.serviceType === 'nuclear_plant' ? 4 : size === 2 || size === 4 ? size : 1) as (1 | 2 | 4);
        if (x + footprint > GRID_SIZE || z + footprint > GRID_SIZE) {
          return { success: false, message: `Cannot place out of city bounds!` };
        }

        for (let dx = 0; dx < footprint; dx++) {
          for (let dz = 0; dz < footprint; dz++) {
            const c = this.getCell(x + dx, z + dz);
            if (!c || (c.terrain === 'water' && tool.serviceType !== 'sewage_plant')) {
              return { success: false, message: 'Must be placed on land!' };
            }
            if (c.road || c.service || c.building) {
              return { success: false, message: 'Area is occupied! Bulldoze first.' };
            }
          }
        }

        const cost = TOOL_COSTS[tool.serviceType] || 5000;
        if (this.budget.treasury < cost) {
          return { success: false, message: `Insufficient funds! Need $${cost}` };
        }

        this.budget.treasury -= cost;
        this.placeService(x, z, tool.serviceType, false);
        const masterCell = this.grid[x][z];
        if (masterCell.service && footprint > 1) {
          masterCell.service.footprint = footprint;
          masterCell.service.isMasterTile = true;
          masterCell.service.masterCoord = { x, z };
          for (let dx = 0; dx < footprint; dx++) {
            for (let dz = 0; dz < footprint; dz++) {
              const sc = this.grid[x + dx][z + dz];
              sc.service = masterCell.service;
              sc.building = null;
              sc.road = null;
              sc.hasTree = false;
            }
          }
        }

        this.recomputeNetworksAndSimulation(true);
        return { success: true };
      }

      case 'bulldoze': {
        let bulldozedAny = false;
        for (let dx = 0; dx < size; dx++) {
          for (let dz = 0; dz < size; dz++) {
            const targetCell = this.getCell(x + dx, z + dz);
            if (!targetCell) continue;

            if (targetCell.building) {
              const b = targetCell.building;
              if (b.footprint && b.footprint > 1 && b.masterCoord) {
                const fp = b.footprint;
                const mx = b.masterCoord.x;
                const mz = b.masterCoord.z;
                for (let fx = 0; fx < fp; fx++) {
                  for (let fz = 0; fz < fp; fz++) {
                    const fc = this.getCell(mx + fx, mz + fz);
                    if (fc) {
                      fc.building = null;
                      fc.zone = null;
                    }
                  }
                }
              } else {
                targetCell.building = null;
                targetCell.zone = null;
              }
              bulldozedAny = true;
            }
            if (targetCell.road) {
              targetCell.road = null;
              bulldozedAny = true;
            }
            if (targetCell.service) {
              const s = targetCell.service;
              if (s.footprint && s.footprint > 1 && s.masterCoord) {
                const fp = s.footprint;
                const mx = s.masterCoord.x;
                const mz = s.masterCoord.z;
                for (let fx = 0; fx < fp; fx++) {
                  for (let fz = 0; fz < fp; fz++) {
                    const fc = this.getCell(mx + fx, mz + fz);
                    if (fc) fc.service = null;
                  }
                }
              } else {
                targetCell.service = null;
              }
              bulldozedAny = true;
            }
            if (targetCell.zone) {
              targetCell.zone = null;
              bulldozedAny = true;
            }
          }
        }
        if (bulldozedAny) {
          this.recalculateRoadConnections();
          this.recomputeNetworksAndSimulation(true);
          return { success: true };
        }
        return { success: false, message: 'Nothing to bulldoze here' };
      }

      case 'inspect':
      default:
        return { success: true };
    }
  }

  public placeRoad(x: number, z: number, type: RoadType, recompute = true) {
    const cell = this.getCell(x, z);
    if (!cell) return;
    cell.road = {
      type,
      connections: { north: false, south: false, east: false, west: false },
      trafficDensity: 0.1,
      carsPassed: 0,
      totalEarnings: 0,
    };
    cell.zone = null;
    cell.building = null;
    cell.hasTree = false;

    if (recompute) {
      this.recalculateRoadConnections();
      this.recomputeNetworksAndSimulation();
    }
  }

  public setZone(x: number, z: number, zoneType: ZoneType, recompute = true) {
    const cell = this.getCell(x, z);
    if (!cell || cell.road || cell.service) return;
    cell.zone = zoneType;
    cell.hasTree = false;
    if (recompute) {
      this.recomputeNetworksAndSimulation();
    }
  }

  public placeService(x: number, z: number, type: ServiceType, recompute = true) {
    const cell = this.getCell(x, z);
    if (!cell) return;

    let powerOutput = 0;
    let waterOutput = 0;
    let radius = 6;
    let effectValue = 20;

    switch (type) {
      case 'wind_turbine':
        powerOutput = 25;
        radius = 8;
        break;
      case 'solar_farm':
        powerOutput = 65;
        radius = 12;
        break;
      case 'coal_plant':
        powerOutput = 160;
        radius = 16;
        break;
      case 'nuclear_plant':
        powerOutput = 800;
        radius = 22;
        effectValue = 60;
        break;
      case 'geothermal_plant':
        powerOutput = 350;
        radius = 16;
        effectValue = 40;
        break;
      case 'fusion_reactor':
        powerOutput = 2500;
        radius = 30;
        effectValue = 90;
        break;
      case 'water_tower':
        waterOutput = 10000;
        radius = 10;
        break;
      case 'sewage_plant':
        waterOutput = 20000;
        radius = 14;
        break;
      case 'desalination_plant':
        waterOutput = 50000;
        radius = 20;
        effectValue = 50;
        break;
      case 'recycling_center':
        radius = 14;
        effectValue = 35;
        break;
      case 'incinerator':
        radius = 16;
        effectValue = 35;
        break;
      case 'subway_station':
        radius = 20;
        effectValue = 60;
        break;
      case 'tram_depot':
        radius = 16;
        effectValue = 50;
        break;
      case 'clinic':
        radius = 8;
        effectValue = 25;
        break;
      case 'hospital':
        radius = 15;
        effectValue = 45;
        break;
      case 'fire_station':
        radius = 10;
        effectValue = 30;
        break;
      case 'police_station':
        radius = 10;
        effectValue = 30;
        break;
      case 'elementary_school':
        radius = 9;
        effectValue = 30;
        break;
      case 'university':
        radius = 18;
        effectValue = 50;
        break;
      case 'army_barracks':
        radius = 14;
        effectValue = 50;
        break;
      case 'defense_tower':
        radius = 12;
        effectValue = 60;
        break;
      case 'small_park':
        radius = 6;
        effectValue = 30;
        break;
      case 'medium_park':
        radius = 9;
        effectValue = 40;
        break;
      case 'large_park':
        radius = 12;
        effectValue = 50;
        break;
      case 'grand_park':
        radius = 16;
        effectValue = 65;
        break;
      case 'stadium':
        radius = 20;
        effectValue = 70;
        break;
      case 'bus_station':
        radius = 14;
        effectValue = 40;
        break;
      case 'forest':
        radius = 10;
        effectValue = 45;
        break;
    }

    cell.service = {
      id: `srv_${Date.now()}_${x}_${z}`,
      type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      maintenanceCost: SERVICE_MAINTENANCE[type],
      powerOutput,
      waterOutput,
      coverageRadius: radius,
      effectValue,
      styleSeed: Math.floor(Math.random() * 1000),
      rotation: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2][Math.floor(Math.random() * 4)],
    };
    cell.zone = null;
    cell.building = null;
    cell.hasTree = false;

    if (recompute) {
      this.recomputeNetworksAndSimulation();
    }
  }

  public recalculateRoadConnections() {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (!cell.road) continue;

        const north = !!this.getCell(x, z - 1)?.road;
        const south = !!this.getCell(x, z + 1)?.road;
        const east = !!this.getCell(x + 1, z)?.road;
        const west = !!this.getCell(x - 1, z)?.road;

        cell.road.connections = { north, south, east, west };
      }
    }
  }

  // Continuous Road Line/Route Builder helper
  public getPathBetween(x1: number, z1: number, x2: number, z2: number): { x: number; z: number }[] {
    const path: { x: number; z: number }[] = [];
    let curX = x1;
    let curZ = z1;
    path.push({ x: curX, z: curZ });

    const dx = Math.sign(x2 - x1);
    while (curX !== x2) {
      curX += dx;
      path.push({ x: curX, z: curZ });
    }

    const dz = Math.sign(z2 - z1);
    while (curZ !== z2) {
      curZ += dz;
      path.push({ x: curX, z: curZ });
    }

    return path;
  }

  public buildRoadRoute(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    type: RoadType
  ): { success: boolean; count: number; cost: number; message?: string } {
    const coords = this.getPathBetween(x1, z1, x2, z2);
    const costPerTile = TOOL_COSTS[`road_${type}`] || 20;
    const tilesToBuild = coords.filter((c) => {
      const cell = this.getCell(c.x, c.z);
      return cell && !cell.road && !cell.building && !cell.service;
    });

    const totalCost = tilesToBuild.length * costPerTile;
    if (this.budget.treasury < totalCost) {
      return { success: false, count: 0, cost: totalCost, message: `Need $${totalCost} for this road corridor!` };
    }

    this.budget.treasury -= totalCost;
    for (const c of tilesToBuild) {
      this.placeRoad(c.x, c.z, type, false);
    }
    this.recalculateRoadConnections();
    this.recomputeNetworksAndSimulation(true);
    return { success: true, count: tilesToBuild.length, cost: totalCost };
  }

  public spawnBuilding(x: number, z: number, zone: ZoneType, level = 1, footprint: 1 | 2 | 4 = 1): BuildingData {
    const cell = this.grid[x][z];
    const isHigh = level >= 3;
    const mult = footprint * footprint;
    const maxResidents = zone === 'residential' ? level * (isHigh ? 24 : 6) * mult : 0;
    const maxWorkers = zone !== 'residential' ? level * (isHigh ? 30 : 8) * mult : 0;

    const orientations = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const rotation = orientations[Math.floor(Math.random() * orientations.length)];

    const building: BuildingData = {
      id: `bld_${++this.buildingIdCounter}`,
      name: footprint > 1 
        ? `${footprint}x${footprint} ${this.generateBuildingName(zone, level)}` 
        : this.generateBuildingName(zone, level),
      zone,
      level,
      residents: Math.floor(maxResidents * 0.8),
      maxResidents,
      workers: Math.floor(maxWorkers * 0.8),
      maxWorkers,
      landValue: cell.landValue,
      happiness: 80,
      hasPower: cell.hasPower,
      hasWater: cell.hasWater,
      fireRisk: 10,
      onFire: false,
      isAbandoned: false,
      abandonedTimer: 0,
      constructionProgress: 1.0,
      hp: 100 * level * footprint,
      maxHp: 100 * level * footprint,
      styleSeed: Math.floor(Math.random() * 1000),
      height: (0.8 + level * 0.6) * (footprint === 4 ? 1.8 : footprint === 2 ? 1.4 : 1.0),
      taxIncome: level * (zone === 'residential' ? 18 : 26) * mult,
      rotation,
      footprint,
      isMasterTile: footprint > 1 ? true : undefined,
      masterCoord: footprint > 1 ? { x, z } : undefined,
    };

    cell.building = building;
    cell.hasTree = false;
    return building;
  }

  private generateBuildingName(zone: ZoneType, level: number): string {
    const prefixes = {
      residential: ['Pine', 'Maple', 'Cedar', 'Sunburst', 'Riverview', 'Skyline', 'Grand', 'Emerald'],
      commercial: ['Apex', 'Cornerstone', 'Starlight', 'Metro', 'Summit', 'Plaza', 'Horizon', 'Central'],
      industrial: ['Titan', 'Foundry', 'Vulcan', 'Atlas', 'Omni', 'Precision', 'Vector', 'Global'],
      office: ['Synergy', 'Apex Tech', 'Nova', 'Vertex', 'Lumina', 'Crest', 'Quantum', 'Nexus'],
    };
    const suffixes = {
      residential: level <= 2 ? ['Cottage', 'Residence', 'Home', 'Villa'] : ['Apartments', 'Manor', 'Towers', 'Condominiums'],
      commercial: level <= 2 ? ['Market', 'Bakery', 'Boutique', 'Diner'] : ['Mall', 'Center', 'Complex', 'Galleria'],
      industrial: level <= 2 ? ['Works', 'Depot', 'Assembly', 'Mill'] : ['Heavy Manufacturing', 'Plant', 'Logistics Hub', 'Refinery'],
      office: level <= 2 ? ['Studio', 'Offices', 'Workspaces'] : ['Tower', 'Headquarters', 'Financial Center', 'Tech Hub'],
    };
    const p = prefixes[zone][Math.floor(Math.random() * prefixes[zone].length)];
    const s = suffixes[zone][Math.floor(Math.random() * suffixes[zone].length)];
    return `${p} ${s}`;
  }

  public update(deltaSeconds: number) {
    if (this.stats.simulationSpeed === 0) return;

    const effectiveDelta = deltaSeconds * this.stats.simulationSpeed;

    // Advance 24-hour day clock
    this.stats.dayTime = (this.stats.dayTime + effectiveDelta * 0.4) % 24;

    this.simAccumulator += effectiveDelta;
    if (this.simAccumulator >= 1.0) {
      this.simAccumulator = 0;
      this.simulationTick();
    }

    this.weekAccumulator += effectiveDelta;
    if (this.weekAccumulator >= 12.0) {
      this.weekAccumulator = 0;
      this.weeklyAccountingTick();
    }

    this.updateWaveSystem(effectiveDelta);
  }

  // 60 FPS motion update for cars and pedestrians walking on sidewalks
  public updateLivelyEntities(deltaSeconds: number) {
    if (this.stats.simulationSpeed === 0) return;
    const effectiveDelta = deltaSeconds * this.stats.simulationSpeed;
    this.updateVehicles(effectiveDelta);
    this.updatePedestrians(effectiveDelta);
    this.updateTowerDefense(effectiveDelta);
  }

  private simulationTick() {
    if (this.waveActive) return; // City Lockdown!

    this.recomputeNetworksAndSimulation();
    this.handleBuildingGrowthAndDecay();
    this.updateDemands();
    this.checkMilestones();
    this.manageRealisticTraffic();
    this.manageRealisticPedestrians();
    this.manageFireDepartment();
    this.manageWasteManagement();
  }

  private updateWaveSystem(delta: number) {
    if (this.waveActive) return;

    this.waveTimer -= delta;

    if (this.waveTimer <= 15 && !this.waveWarningTriggered) {
      this.waveWarningTriggered = true;
      if (this.onWaveEvent) {
        this.onWaveEvent('warning', { countdown: Math.ceil(this.waveTimer), waveNumber: this.waveNumber + 1 });
      }
      if (this.onChirpTrigger) {
        this.onChirpTrigger(
          'warning',
          `⚠️ RADAR ALERT: Raider militia wave ${this.waveNumber + 1} approaching from Highway in 15 seconds! Place army towers & barracks!`
        );
      }
    }

    if (this.waveTimer <= 0) {
      this.startRaiderWave();
      this.waveTimer = 120 + this.waveNumber * 20;
      this.waveWarningTriggered = false;
    }
  }

  public recomputeNetworksAndSimulation(forceFull = false) {
    let totalPowerGen = 0;
    let totalPowerDemand = 0;
    let totalWaterGen = 0;
    let totalWaterDemand = 0;

    const powerSources: [number, number][] = [];
    const waterSources: [number, number][] = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        cell.hasPower = false;
        cell.hasWater = false;
        cell.fireCoverage = false;
        cell.policeCoverage = false;
        cell.healthCoverage = false;
        cell.educationCoverage = false;
        cell.pollution = 0;

        if (cell.service) {
          if (cell.service.powerOutput && cell.service.powerOutput > 0) {
            totalPowerGen += cell.service.powerOutput;
            powerSources.push([x, z]);
          }
          if (cell.service.waterOutput && cell.service.waterOutput > 0) {
            totalWaterGen += cell.service.waterOutput;
            waterSources.push([x, z]);
          }
          if (cell.service.type === 'coal_plant') {
            cell.pollution += 80;
          }
        }

        if (cell.building) {
          totalPowerDemand += cell.building.level * 2;
          totalWaterDemand += cell.building.level * 300;
          if (cell.building.zone === 'industrial') {
            cell.pollution += cell.building.level * 15;
          }
        }
      }
    }

    this.stats.powerProduction = totalPowerGen;
    this.stats.powerConsumption = totalPowerDemand;
    this.stats.waterProduction = totalWaterGen;
    this.stats.waterConsumption = totalWaterDemand;

    const powerRatio = totalPowerDemand > 0 ? Math.min(1.0, totalPowerGen / totalPowerDemand) : 1.0;
    const waterRatio = totalWaterDemand > 0 ? Math.min(1.0, totalWaterGen / totalWaterDemand) : 1.0;

    // Power BFS with automatic 2-tile easement transmission (bridges across sidewalks and adjacent grass)
    if (powerSources.length > 0 && totalPowerGen > 0) {
      const visited = new Set<string>();
      const queue: [number, number][] = [...powerSources];

      powerSources.forEach(([x, z]) => {
        visited.add(`${x},${z}`);
        this.grid[x][z].hasPower = true;
      });

      while (queue.length > 0) {
        const [cx, cz] = queue.shift()!;
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) > 2) continue; // Manhattan distance <= 2
            const nx = cx + dx;
            const nz = cz + dz;
            if (nx < 0 || nx >= GRID_SIZE || nz < 0 || nz >= GRID_SIZE) continue;
            const key = `${nx},${nz}`;
            if (visited.has(key)) continue;

            const nCell = this.grid[nx][nz];
            if (nCell.road !== null || nCell.building !== null || nCell.service !== null || nCell.zone !== null) {
              visited.add(key);
              // Deterministic stable power coverage based on grid capacity
              nCell.hasPower = powerRatio >= 1.0 || ((nx * 31 + nz * 17) % 100) / 100 <= powerRatio;
              queue.push([nx, nz]);
            }
          }
        }
      }
    }

    // Water BFS with automatic 2-tile pipe easement transmission
    if (waterSources.length > 0 && totalWaterGen > 0) {
      const visited = new Set<string>();
      const queue: [number, number][] = [...waterSources];

      waterSources.forEach(([x, z]) => {
        visited.add(`${x},${z}`);
        this.grid[x][z].hasWater = true;
      });

      while (queue.length > 0) {
        const [cx, cz] = queue.shift()!;
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) > 2) continue;
            const nx = cx + dx;
            const nz = cz + dz;
            if (nx < 0 || nx >= GRID_SIZE || nz < 0 || nz >= GRID_SIZE) continue;
            const key = `${nx},${nz}`;
            if (visited.has(key)) continue;

            const nCell = this.grid[nx][nz];
            if (nCell.road !== null || nCell.service !== null || nCell.building !== null || nCell.zone !== null) {
              visited.add(key);
              nCell.hasWater = waterRatio >= 1.0 || ((nx * 19 + nz * 37) % 100) / 100 <= waterRatio;
              queue.push([nx, nz]);
            }
          }
        }
      }
    }

    // Calculate civic coverage
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.service) {
          const rad = cell.service.coverageRadius;
          for (let dx = -rad; dx <= rad; dx++) {
            for (let dz = -rad; dz <= rad; dz++) {
              const tx = x + dx;
              const tz = z + dz;
              if (tx < 0 || tx >= GRID_SIZE || tz < 0 || tz >= GRID_SIZE) continue;
              if (dx * dx + dz * dz <= rad * rad) {
                const target = this.grid[tx][tz];
                if (cell.service.type === 'clinic' || cell.service.type === 'hospital') {
                  target.healthCoverage = true;
                } else if (cell.service.type === 'fire_station') {
                  target.fireCoverage = true;
                } else if (cell.service.type === 'police_station') {
                  target.policeCoverage = true;
                } else if (cell.service.type === 'elementary_school' || cell.service.type === 'university') {
                  target.educationCoverage = true;
                }
              }
            }
          }
        }
      }
    }

    // Metrics, Education & Earning Calculations
    let totalPopulation = 0;
    let totalJobs = 0;
    let totalHappiness = 0;
    let buildingCount = 0;
    let schoolCap = 0;
    let hasUniversity = false;
    let coveredPop = 0;

    // Sector Capacities & Diagnostic Counters
    let housingCap = 0;
    let commercialCap = 0;
    let commercialWorkers = 0;
    let industrialCap = 0;
    let industrialWorkers = 0;
    let officeCap = 0;
    let officeWorkers = 0;
    let abandonedCount = 0;
    let unpoweredCount = 0;
    let unwateredCount = 0;
    let poweredCount = 0;
    let wateredCount = 0;
    let healthCount = 0;
    let policeCount = 0;
    let fireCount = 0;
    let cleanAirCount = 0;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.service) {
          if (cell.service.type === 'elementary_school') {
            schoolCap += 350;
          } else if (cell.service.type === 'university') {
            schoolCap += 900;
            hasUniversity = true;
          }
        }
        if (cell.building && cell.building.zone === 'residential' && cell.educationCoverage) {
          coveredPop += cell.building.residents;
        }

        let lv = 50;
        const riverDist = Math.abs(z - (Math.sin((x / GRID_SIZE) * Math.PI * 1.5) * 6 + 18));
        if (riverDist < 5) lv += 15;

        if (cell.healthCoverage) lv += 8;
        if (cell.policeCoverage) lv += 8;
        if (cell.fireCoverage) lv += 8;
        if (cell.educationCoverage) lv += 14;
        if (cell.pollution > 30) lv -= 25;

        cell.landValue = Math.min(100, Math.max(10, lv));

        if (cell.building) {
          buildingCount++;
          cell.building.hasPower = cell.hasPower;
          cell.building.hasWater = cell.hasWater;
          cell.building.landValue = cell.landValue;

          // Track sector capacities & workers
          if (cell.building.zone === 'residential') {
            housingCap += cell.building.maxResidents;
          } else if (cell.building.zone === 'commercial') {
            commercialCap += cell.building.maxWorkers;
            commercialWorkers += cell.building.workers;
          } else if (cell.building.zone === 'industrial') {
            industrialCap += cell.building.maxWorkers;
            industrialWorkers += cell.building.workers;
          } else if (cell.building.zone === 'office') {
            officeCap += cell.building.maxWorkers;
            officeWorkers += cell.building.workers;
          }

          if (cell.building.isAbandoned) {
            abandonedCount++;
          }
          if (!cell.hasPower) {
            unpoweredCount++;
          } else {
            poweredCount++;
          }
          if (!cell.hasWater) {
            unwateredCount++;
          } else {
            wateredCount++;
          }
          if (cell.healthCoverage) healthCount++;
          if (cell.policeCoverage) policeCount++;
          if (cell.fireCoverage) fireCount++;
          if (cell.pollution <= 35) cleanAirCount++;

          let hap = 65;
          if (cell.hasPower) hap += 12; else hap -= 35;
          if (cell.hasWater) hap += 12; else hap -= 35;
          if (cell.policeCoverage) hap += 6;
          if (cell.healthCoverage) hap += 6;
          if (cell.educationCoverage) hap += 8;
          if (cell.pollution > 35) hap -= 25;

          // Tax penalty
          const tax = cell.building.zone === 'residential' ? this.budget.taxRateResidential : this.budget.taxRateCommercial;
          if (tax > 10) hap -= (tax - 10) * 3;

          cell.building.happiness = Math.min(100, Math.max(5, hap));
          totalHappiness += cell.building.happiness;

          totalPopulation += cell.building.residents;
          totalJobs += cell.building.maxWorkers;
        }
      }
    }

    this.stats.population = totalPopulation;
    this.stats.jobs = totalJobs;

    // Sector Capacities and Inflow
    this.stats.housingCapacity = housingCap;
    this.stats.housingOccupancy = housingCap > 0 ? Math.min(100, Math.round((totalPopulation / housingCap) * 100)) : 0;
    this.stats.commercialCapacity = commercialCap;
    this.stats.commercialEmployees = commercialWorkers;
    const shoppingTripCount = this.vehicles.filter((v) => v.state === 'shopping').length + this.pedestrians.filter((p) => p.state === 'going_shopping').length;
    this.stats.commercialShoppers = Math.round(totalPopulation * 0.4 + shoppingTripCount * 5);
    this.stats.industrialCapacity = industrialCap;
    this.stats.industrialEmployees = industrialWorkers;
    this.stats.officeCapacity = officeCap;
    this.stats.officeEmployees = officeWorkers;

    // Outages & Diagnostics
    this.stats.abandonedBuildings = abandonedCount;
    this.stats.unpoweredBuildings = unpoweredCount;
    this.stats.unwateredBuildings = unwateredCount;

    // Needs satisfaction scores (0 to 100%)
    this.stats.needsPower = buildingCount > 0 ? Math.round((poweredCount / buildingCount) * 100) : 100;
    this.stats.needsWater = buildingCount > 0 ? Math.round((wateredCount / buildingCount) * 100) : 100;
    this.stats.needsHealth = buildingCount > 0 ? Math.round((healthCount / buildingCount) * 100) : 0;
    this.stats.needsSafety = buildingCount > 0 ? Math.round(((policeCount + fireCount) / (buildingCount * 2)) * 100) : 0;
    this.stats.needsEducation = Math.min(100, Math.round(this.stats.educationLevel));
    this.stats.needsTaxSatisfaction = Math.max(0, Math.min(100, Math.round(100 - (this.budget.taxRateResidential - 8) * 8)));
    this.stats.needsEnvironment = buildingCount > 0 ? Math.round((cleanAirCount / buildingCount) * 100) : 100;

    // Employment & Labor force
    const laborForce = Math.floor(totalPopulation * 0.65);
    const employed = Math.min(laborForce, totalJobs);
    this.stats.employed = employed;
    this.stats.unemploymentRate = laborForce > 0 
      ? Math.max(0, Math.min(100, Math.round(((laborForce - employed) / laborForce) * 100))) 
      : 0;
    this.stats.needsJobs = laborForce > 0 ? Math.min(100, Math.round((employed / laborForce) * 100)) : 100;

    // Migration flows
    const deltaPop = totalPopulation - this.previousPopulation;
    if (this.previousPopulation === 0) {
      this.stats.netMigration = 0;
      this.stats.citizenInflow = totalPopulation;
      this.stats.citizenOutflow = 0;
    } else if (deltaPop >= 0) {
      this.stats.netMigration = deltaPop;
      this.stats.citizenInflow = deltaPop + (abandonedCount > 0 ? 1 : 0);
      this.stats.citizenOutflow = Math.max(0, abandonedCount * 3);
    } else {
      this.stats.netMigration = deltaPop;
      this.stats.citizenInflow = Math.max(0, Math.round(this.demands.residential * 0.08));
      this.stats.citizenOutflow = Math.abs(deltaPop) + this.stats.citizenInflow;
    }
    this.previousPopulation = totalPopulation;

    // Algorithmic Education Progression
    const eligibleStudents = Math.round(totalPopulation * 0.22);
    const studentsEnrolled = Math.min(schoolCap, eligibleStudents);
    this.stats.schoolCapacity = schoolCap;
    this.stats.studentsEnrolled = studentsEnrolled;

    const coverageRatio = totalPopulation > 0 ? coveredPop / totalPopulation : 0.4;
    const capacityRatio = eligibleStudents > 0 ? studentsEnrolled / eligibleStudents : (schoolCap > 0 ? 1 : 0.3);
    const targetEdu = Math.min(100, Math.max(15, Math.round(coverageRatio * 45 + capacityRatio * 45 + (hasUniversity ? 10 : 0))));
    this.stats.educationLevel = Math.round(this.stats.educationLevel * 0.9 + targetEdu * 0.1);

    const uniShare = hasUniversity ? 0.38 : 0.18;
    this.stats.universityRate = Math.min(60, Math.round(this.stats.educationLevel * uniShare));
    this.stats.highSchoolRate = Math.min(70, Math.round(this.stats.educationLevel * 0.62));
    this.stats.uneducatedRate = Math.max(0, 100 - this.stats.universityRate - this.stats.highSchoolRate);

    // Algorithmic Earning & Economy
    const uneducatedWage = 420;
    const highSchoolWage = 720;
    const universityWage = 1380;
    const baseAvgIncome = Math.round(
      (this.stats.uneducatedRate * uneducatedWage +
       this.stats.highSchoolRate * highSchoolWage +
       this.stats.universityRate * universityWage) / 100
    );

    const wagePressure = totalJobs > laborForce && laborForce > 0 ? 1.08 : (this.stats.unemploymentRate > 12 ? 0.92 : 1.0);
    this.stats.averageIncome = Math.round(baseAvgIncome * wagePressure);
    this.stats.totalWagesPaid = employed * this.stats.averageIncome;
    this.stats.commercialTurnover = Math.round(this.stats.totalWagesPaid * 0.45);
    this.stats.povertyRate = Math.max(3, Math.min(75, Math.round(this.stats.unemploymentRate * 0.7 + (100 - this.stats.educationLevel) * 0.2)));

    // City-wide happiness influenced by employment & income
    const econHappinessBonus = (this.stats.unemploymentRate < 6 ? 6 : -this.stats.unemploymentRate * 0.5) + (this.stats.averageIncome > 650 ? 5 : -4);
    const avgHap = buildingCount > 0 ? Math.round(totalHappiness / buildingCount) : 75;
    this.stats.cityHappiness = Math.min(100, Math.max(10, Math.round(avgHap + econHappinessBonus)));
    this.stats.totalCarsOnRoad = this.vehicles.length;

    let totalRoads = 0;
    let transitBonus = 0;
    for (let rx = 0; rx < GRID_SIZE; rx++) {
      for (let rz = 0; rz < GRID_SIZE; rz++) {
        const rc = this.grid[rx][rz];
        if (rc.road) totalRoads++;
        if (rc.service && (rc.service.type === 'subway_station' || rc.service.type === 'tram_depot' || rc.service.type === 'bus_station' || rc.service.type === 'parking_lot')) {
          transitBonus += 15;
        }
      }
    }
    const baseCongestion = totalRoads > 0 ? Math.min(100, Math.round((this.vehicles.length / (totalRoads * 0.75)) * 40)) : 0;
    this.stats.trafficCongestionRate = Math.max(5, Math.min(100, baseCongestion - transitBonus));
  }

  private handleBuildingGrowthAndDecay() {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];

        if (cell.zone && !cell.building && !cell.road && !cell.service) {
          const hasRoadAccess = this.isAdjacentToRoad(x, z);
          if (hasRoadAccess && cell.hasPower && cell.hasWater) {
            let demandForZone = 0;
            if (cell.zone === 'residential') demandForZone = this.demands.residential;
            else if (cell.zone === 'commercial') demandForZone = this.demands.commercial;
            else if (cell.zone === 'industrial' || cell.zone === 'office') demandForZone = this.demands.industrial;

            if (demandForZone > 20 && Math.random() < 0.25) {
              const b = this.spawnBuilding(x, z, cell.zone, 1);
              b.constructionProgress = 1.0;
            }
          }
        }

        if (cell.building) {
          const b = cell.building;
          if (!b.hasPower || !b.hasWater) {
            b.abandonedTimer += 1;
            // 45 seconds grace buffer so players have plenty of time to add utilities without instant collapse
            if (b.abandonedTimer > 45 && !b.isAbandoned) {
              b.isAbandoned = true;
              b.residents = 0;
              b.workers = 0;
              if (this.onChirpTrigger && Math.random() < 0.25) {
                this.onChirpTrigger('concern', `Citizens abandoned ${b.name} due to lacking basic utilities!`);
              }
            }
          } else {
            // Power & water are functional!
            if (b.isAbandoned) {
              b.isAbandoned = false;
              b.abandonedTimer = 0;
              // Immediately repopulate returning citizens and employees!
              b.residents = Math.max(2, Math.floor(b.maxResidents * 0.85));
              b.workers = Math.max(2, Math.floor(b.maxWorkers * 0.85));
              if (this.onChirpTrigger && Math.random() < 0.2) {
                this.onChirpTrigger('news', `💡 Power & water restored! Citizens are moving back into ${b.name}!`);
              }
            } else {
              b.abandonedTimer = 0;
            }
          }

          // Outside Immigration & High-Capacity Move-Ins:
          // If utilities are corrected and space exists, people from outside move in rapidly!
          if (!b.isAbandoned && b.hasPower && b.hasWater) {
            if (b.zone === 'residential' && b.residents < b.maxResidents) {
              // Rapid influx into available housing capacity
              const availableVacancies = b.maxResidents - b.residents;
              const moveInBatch = Math.min(availableVacancies, Math.max(1, Math.ceil(b.maxResidents * 0.25)));
              b.residents += moveInBatch;
            }
            if (b.zone !== 'residential' && b.workers < b.maxWorkers) {
              // Outside worker inflow for commercial, industrial, and offices
              const jobOpenings = b.maxWorkers - b.workers;
              const hiringBatch = Math.min(jobOpenings, Math.max(1, Math.ceil(b.maxWorkers * 0.25)));
              b.workers += hiringBatch;
            }
          }

          // Upgrades
          if (!b.isAbandoned && b.level < 5) {
            const canUpgrade = b.happiness >= 80 && b.landValue >= (b.level * 18 + 20) && Math.random() < 0.08;
            if (canUpgrade) {
              b.level += 1;
              b.height = 0.8 + b.level * 0.6;
              b.maxResidents = b.zone === 'residential' ? b.level * (b.level >= 3 ? 24 : 8) : 0;
              b.residents = Math.floor(b.maxResidents * 0.9);
              b.maxWorkers = b.zone !== 'residential' ? b.level * (b.level >= 3 ? 28 : 10) : 0;
              b.workers = Math.floor(b.maxWorkers * 0.85);
              b.taxIncome = b.level * (b.zone === 'residential' ? 22 : 32);
              b.name = this.generateBuildingName(b.zone, b.level);
            }
          }
        }
      }
    }
  }

  private isAdjacentToRoad(x: number, z: number): boolean {
    const neighbors = [
      [x + 1, z],
      [x - 1, z],
      [x, z + 1],
      [x, z - 1],
    ];
    return neighbors.some(([nx, nz]) => {
      if (nx < 0 || nx >= GRID_SIZE || nz < 0 || nz >= GRID_SIZE) return false;
      return this.grid[nx][nz].road !== null;
    });
  }

  private updateDemands() {
    // 1. Residential Demand:
    // Driven by Job Vacancies (jobs - employed), City Happiness, Education quality, and low taxes
    const jobVacancies = Math.max(-50, Math.min(100, this.stats.jobs - this.stats.employed));
    let rDemand = 40 + jobVacancies * 1.5;
    rDemand += (this.stats.cityHappiness - 70) * 0.8;
    rDemand += (this.stats.educationLevel - 50) * 0.3;
    rDemand -= (this.budget.taxRateResidential - 10) * 4;

    // 2. Commercial Demand:
    // Directly driven by resident earnings & spending power!
    const perCapitaSpend = this.stats.population > 0 ? this.stats.commercialTurnover / this.stats.population : 140;
    let cDemand = 30 + (perCapitaSpend - 140) * 0.4 + Math.min(30, this.stats.population * 0.15);
    cDemand -= (this.budget.taxRateCommercial - 10) * 4;

    // 3. Industrial Demand:
    // Driven by manufacturing workforce needs, transportation connectivity, and low taxes
    let iDemand = 35 + (this.stats.population > 0 ? (this.stats.population * 0.5 - this.stats.jobs) * 1.2 : 20);
    iDemand -= (this.budget.taxRateIndustrial - 10) * 4;

    // 4. Office Demand:
    // Driven by University graduates and educated talent pool!
    let oDemand = 15 + (this.stats.universityRate * 1.3) + (this.stats.educationLevel > 50 ? 15 : 0);
    oDemand -= (this.budget.taxRateOffice - 10) * 3.5;

    this.demands.residential = Math.max(5, Math.min(100, Math.round(rDemand)));
    this.demands.commercial = Math.max(5, Math.min(100, Math.round(cDemand)));
    this.demands.industrial = Math.max(5, Math.min(100, Math.round(iDemand)));
    this.demands.office = Math.max(5, Math.min(100, Math.round(oDemand)));
  }

  private weeklyAccountingTick() {
    let income = 0;
    let expenses = 0;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.road) {
          const rt = cell.road.type;
          expenses += rt === 'two_lane' ? 4 : rt === 'avenue' ? 10 : rt === 'highway' ? 25 : rt === 'mud' ? 2 : rt === 'rural' ? 3 : rt === 'pavement' ? 6 : rt === 'pedestrian' ? 4 : rt === 'toll_booth' ? 35 : 4;
        }
        if (cell.service) {
          expenses += cell.service.maintenanceCost;
        }
        if (cell.building && !cell.building.isAbandoned) {
          const b = cell.building;
          let taxRate = this.budget.taxRateResidential;
          if (b.zone === 'commercial') taxRate = this.budget.taxRateCommercial;
          if (b.zone === 'industrial') taxRate = this.budget.taxRateIndustrial;
          if (b.zone === 'office') taxRate = this.budget.taxRateOffice;

          income += Math.round(b.taxIncome * (taxRate / 10));
        }
      }
    }

    this.budget.incomePerWeek = income;
    this.budget.expensesPerWeek = expenses;
    this.budget.treasury += income - expenses;

    // Record historical data snapshot for graphs
    const snapshot: CityHistorySnapshot = {
      week: this.stats.week,
      year: this.stats.year,
      population: this.stats.population,
      employed: this.stats.employed,
      jobs: this.stats.jobs,
      unemploymentRate: this.stats.unemploymentRate,
      averageIncome: this.stats.averageIncome,
      educationLevel: this.stats.educationLevel,
      uneducatedRate: this.stats.uneducatedRate,
      highSchoolRate: this.stats.highSchoolRate,
      universityRate: this.stats.universityRate,
      cityHappiness: this.stats.cityHappiness,
      demandResidential: this.demands.residential,
      demandCommercial: this.demands.commercial,
      demandIndustrial: this.demands.industrial,
      demandOffice: this.demands.office,
      treasury: this.budget.treasury,
      weeklyIncome: income,
      weeklyExpenses: expenses,
      housingCapacity: this.stats.housingCapacity,
      commercialCapacity: this.stats.commercialCapacity,
      industrialCapacity: this.stats.industrialCapacity,
      powerProduction: this.stats.powerProduction,
      powerConsumption: this.stats.powerConsumption,
      waterProduction: this.stats.waterProduction,
      waterConsumption: this.stats.waterConsumption,
      citizenInflow: this.stats.citizenInflow,
      citizenOutflow: this.stats.citizenOutflow,
    };
    this.history.push(snapshot);
    if (this.history.length > 35) {
      this.history.shift();
    }

    this.stats.week += 1;
    if (this.stats.week > 52) {
      this.stats.week = 1;
      this.stats.year += 1;
    }

    if (this.onChirpTrigger && Math.random() < 0.6) {
      this.triggerRandomChirp();
    }
  }

  private triggerRandomChirp() {
    if (!this.onChirpTrigger) return;
    if (this.stats.powerConsumption > this.stats.powerProduction) {
      this.onChirpTrigger('warning', 'Blackouts reported! Can we build another power plant? #DarkCity');
      return;
    }
    if (this.stats.waterConsumption > this.stats.waterProduction) {
      this.onChirpTrigger('warning', 'Low water pressure downtown! Please upgrade our water supply! #Thirsty');
      return;
    }
    if (this.budget.taxRateResidential > 13) {
      this.onChirpTrigger('concern', 'Taxes are getting quite heavy, Mayor! Our paychecks are shrinking!');
      return;
    }
    if (this.stats.cityHappiness > 85) {
      this.onChirpTrigger('happy', 'Loving the pristine city vibe! Skyline Architect is doing wonders!');
      return;
    }
    const genericHappy = [
      'Commute on the highway connection was lightning fast today! 🚗',
      'Just visited the local park, absolute tranquility! 🌳',
      'The new geometric architecture downtown looks so clean!',
      'Great city air quality today, perfect for an evening jog!',
    ];
    this.onChirpTrigger('news', genericHappy[Math.floor(Math.random() * genericHappy.length)]);
  }

  private checkMilestones() {
    for (const m of this.milestones) {
      if (!m.achieved && this.stats.population >= m.populationRequired) {
        m.achieved = true;
        this.budget.treasury += m.rewardMoney;
        if (this.onMilestoneAchieved) {
          this.onMilestoneAchieved(m);
        }
        if (this.onChirpTrigger) {
          this.onChirpTrigger('happy', `🎉 MILESTONE REACHED: ${m.name}! Received $${m.rewardMoney.toLocaleString()} grant!`);
        }
      }
    }
  }

  // Quickest route on the connected road network using Dijkstra's algorithm factoring in road speed limits and live traffic congestion
  public findRoadPath(startX: number, startZ: number, targetX: number, targetZ: number): [number, number][] | null {
    if (startX === targetX && startZ === targetZ) {
      return [[startX, startZ]];
    }

    const startCell = this.getCell(startX, startZ);
    const targetCell = this.getCell(targetX, targetZ);
    if (!startCell?.road || !targetCell?.road) {
      return null;
    }

    const startIdx = startX * GRID_SIZE + startZ;
    const targetIdx = targetX * GRID_SIZE + targetZ;

    const numCells = GRID_SIZE * GRID_SIZE;
    const dist = new Float32Array(numCells);
    dist.fill(Infinity);
    const parent = new Int32Array(numCells);
    parent.fill(-1);
    const visited = new Uint8Array(numCells);

    dist[startIdx] = 0;

    for (let i = 0; i < numCells; i++) {
      let minDist = Infinity;
      let uIdx = -1;
      for (let j = 0; j < numCells; j++) {
        if (!visited[j] && dist[j] < minDist) {
          minDist = dist[j];
          uIdx = j;
        }
      }

      if (uIdx === -1 || minDist === Infinity) break;
      if (uIdx === targetIdx) break;

      visited[uIdx] = 1;
      const cx = (uIdx / GRID_SIZE) | 0;
      const cz = uIdx % GRID_SIZE;
      const currentCell = this.grid[cx][cz];
      if (!currentCell.road) continue;

      const conn = currentCell.road.connections;
      const neighbors: [number, number, number, boolean][] = [
        [cx, cz - 1, conn.north ? 1 : 0, cz > 0],
        [cx, cz + 1, conn.south ? 1 : 0, cz < GRID_SIZE - 1],
        [cx + 1, cz, conn.east ? 1 : 0, cx < GRID_SIZE - 1],
        [cx - 1, cz, conn.west ? 1 : 0, cx > 0],
      ];

      for (const [nx, nz, isConn, valid] of neighbors) {
        if (!valid || !isConn) continue;
        const nCell = this.grid[nx][nz];
        if (!nCell.road) continue;

        const nIdx = nx * GRID_SIZE + nz;
        if (visited[nIdx]) continue;

        const rt = nCell.road.type;
        const speed = rt === 'highway' ? 3.5 : rt === 'avenue' ? 2.5 : rt === 'pavement' ? 1.8 : rt === 'two_lane' ? 1.0 : rt === 'rural' ? 0.9 : rt === 'mud' ? 0.6 : rt === 'pedestrian' ? 0.4 : rt === 'toll_booth' ? 0.8 : 1.0;
        const congestionPenalty = 1.0 + (nCell.road.congestionLevel || 0) * 0.02;
        const weight = (1.0 / speed) * congestionPenalty;

        const newDist = dist[uIdx] + weight;
        if (newDist < dist[nIdx]) {
          dist[nIdx] = newDist;
          parent[nIdx] = uIdx;
        }
      }
    }

    if (parent[targetIdx] === -1 && startIdx !== targetIdx) return null;

    const path: [number, number][] = [];
    let curr = targetIdx;
    while (curr !== -1) {
      const px = (curr / GRID_SIZE) | 0;
      const pz = curr % GRID_SIZE;
      path.unshift([px, pz]);
      curr = parent[curr];
    }

    return path;
  }

  // Realistic Traffic Simulation with Citizen Car Trips & Highway Gateway
  private manageRealisticTraffic() {
    if (this.waveActive) return; // No traffic during lockdown!
    if (this.vehicles.length >= 36) return;

    // Collect home cells, work cells, shop cells, and highway gateway
    const homeCells: [number, number][] = [];
    const workCells: [number, number][] = [];
    const shopCells: [number, number][] = [];
    let gatewayCell: [number, number] | null = null;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.road?.isHighwayGateway) {
          gatewayCell = [x, z];
        }
        if (cell.building && !cell.building.isAbandoned) {
          if (cell.building.zone === 'residential' && cell.building.residents > 0) {
            homeCells.push([x, z]);
          } else if (cell.building.zone === 'industrial' || cell.building.zone === 'office') {
            workCells.push([x, z]);
          } else if (cell.building.zone === 'commercial') {
            shopCells.push([x, z]);
          }
        }
      }
    }

    if (!gatewayCell) {
      gatewayCell = [this.highwayPortalCoord.x, this.highwayPortalCoord.z];
    }

    // 1. Spawning Highway Incoming Traffic (New residents / regional commuters entering city)
    if (Math.random() < 0.35 && gatewayCell) {
      const startRoad = this.findNearestRoad(gatewayCell[0], gatewayCell[1]);
      if (startRoad) {
        // Pick an urban destination (commercial shop or job center)
        const candidates = [...shopCells, ...workCells];
        let destRoad: [number, number] | null = null;
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          destRoad = this.findAdjacentRoad(pick[0], pick[1]);
        }

        const rollVariant = Math.random();
        const modelVariant: CarModelVariant =
          rollVariant < 0.35 ? 'sedan' : rollVariant < 0.65 ? 'suv' : rollVariant < 0.88 ? 'hatchback' : 'race_car';
        
        const colors = modelVariant === 'race_car'
          ? ['#EF4444', '#06B6D4', '#FACC15', '#8B5CF6', '#10B981']
          : modelVariant === 'suv'
          ? ['#1E3A8A', '#374151', '#15803D', '#9A3412', '#4B5563']
          : ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#E5E7EB', '#6366F1'];

        this.spawnCarOnRoad(
          startRoad[0],
          startRoad[1],
          'highway_entry',
          colors[Math.floor(Math.random() * colors.length)],
          'car',
          undefined,
          destRoad ? { x: destRoad[0], z: destRoad[1] } : undefined,
          modelVariant
        );
        this.stats.highwayCommuters++;
      }
    }

    // 2. Spawning Resident Car / Transit from Home (Varied car models, taxis, buses, and trams)
    if (homeCells.length > 0 && Math.random() < 0.65) {
      const [hx, hz] = homeCells[Math.floor(Math.random() * homeCells.length)];
      const roadNearHome = this.findAdjacentRoad(hx, hz);

      if (roadNearHome) {
        // Decide trip purpose based on city amenities
        const roll = Math.random();
        let state: VehicleTripState = 'commuting_work';
        let type: 'car' | 'taxi' | 'bus' | 'tram' = 'car';
        let targetCell: [number, number] | null = null;

        if (roll < 0.45 && workCells.length > 0) {
          state = 'commuting_work';
          // Occasionally public transit bus or tram commuters
          if (Math.random() < 0.12) {
            type = 'bus';
          } else if (Math.random() < 0.08) {
            type = 'tram';
          }
          targetCell = workCells[Math.floor(Math.random() * workCells.length)];
        } else if (roll < 0.82 && shopCells.length > 0) {
          state = 'shopping';
          const shopRoll = Math.random();
          if (shopRoll < 0.30) {
            type = 'taxi';
          } else if (shopRoll < 0.42) {
            type = 'tram';
          } else if (shopRoll < 0.52) {
            type = 'bus';
          } else {
            type = 'car';
          }
          targetCell = shopCells[Math.floor(Math.random() * shopCells.length)];
        } else if (gatewayCell) {
          // Leaving city on highway!
          state = 'highway_exit';
          targetCell = gatewayCell;
        }

        let destRoad: [number, number] | null = null;
        if (targetCell) {
          destRoad = this.findAdjacentRoad(targetCell[0], targetCell[1]) || this.findNearestRoad(targetCell[0], targetCell[1]);
        }

        let carModel: CarModelVariant | undefined;
        let carColor = '#3B82F6';

        if (type === 'taxi') {
          carColor = '#FACC15';
          carModel = 'sedan';
        } else if (type === 'bus') {
          const busColors = ['#0284C7', '#10B981', '#F97316', '#6366F1'];
          carColor = busColors[Math.floor(Math.random() * busColors.length)];
        } else if (type === 'tram') {
          const tramColors = ['#E11D48', '#0D9488', '#3B82F6', '#8B5CF6'];
          carColor = tramColors[Math.floor(Math.random() * tramColors.length)];
        } else {
          const mRoll = Math.random();
          carModel = mRoll < 0.35 ? 'sedan' : mRoll < 0.65 ? 'suv' : mRoll < 0.88 ? 'hatchback' : 'race_car';
          const carColors = carModel === 'race_car'
            ? ['#EF4444', '#06B6D4', '#FACC15', '#8B5CF6', '#10B981']
            : carModel === 'suv'
            ? ['#1E3A8A', '#374151', '#15803D', '#9A3412', '#475569']
            : carModel === 'hatchback'
            ? ['#FBBF24', '#14B8A6', '#F97316', '#38BDF8', '#A855F7']
            : ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#E5E7EB', '#6366F1'];
          carColor = carColors[Math.floor(Math.random() * carColors.length)];
        }

        this.spawnCarOnRoad(
          roadNearHome[0],
          roadNearHome[1],
          state,
          carColor,
          type,
          { x: hx, z: hz },
          destRoad ? { x: destRoad[0], z: destRoad[1] } : undefined,
          carModel
        );
      }
    }
  }

  private findAdjacentRoad(x: number, z: number): [number, number] | null {
    const neighbors = [
      [x + 1, z],
      [x - 1, z],
      [x, z + 1],
      [x, z - 1],
    ];
    for (const [nx, nz] of neighbors) {
      if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE && this.grid[nx][nz].road !== null) {
        return [nx, nz];
      }
    }
    return null;
  }

  private findNearestRoad(x: number, z: number): [number, number] | null {
    const cell = this.getCell(x, z);
    if (cell?.road) return [x, z];
    return this.findAdjacentRoad(x, z);
  }

  private spawnCarOnRoad(
    sx: number,
    sz: number,
    state: VehicleTripState,
    color: string,
    type: 'car' | 'taxi' | 'bus' | 'truck' | 'tram' = 'car',
    homeCell?: { x: number; z: number },
    destCell?: { x: number; z: number },
    modelVariant?: CarModelVariant
  ) {
    let route: [number, number][] | null = null;
    if (destCell) {
      route = this.findRoadPath(sx, sz, destCell.x, destCell.z);
    }

    let tx = sx;
    let tz = sz;
    if (route && route.length >= 2) {
      tx = route[1][0];
      tz = route[1][1];
    }
    if (tx === sx && tz === sz) {
      const neighbors = [
        [sx + 1, sz],
        [sx - 1, sz],
        [sx, sz + 1],
        [sx, sz - 1],
      ].filter(([nx, nz]) => Boolean(this.getCell(nx, nz)?.road));

      if (neighbors.length === 0) return;
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      tx = pick[0];
      tz = pick[1];
    }

    if (tx === sx && tz === sz) return; // Prevent 0-distance stationary vehicles

    let resolvedVariant = modelVariant;
    if (type === 'car' && !resolvedVariant) {
      const roll = Math.random();
      resolvedVariant = roll < 0.35 ? 'sedan' : roll < 0.65 ? 'suv' : roll < 0.88 ? 'hatchback' : 'race_car';
    }

    let speed = 1.5 + Math.random() * 0.3;
    if (type === 'bus') {
      speed = 1.1 + Math.random() * 0.15;
    } else if (type === 'tram') {
      speed = 1.25 + Math.random() * 0.15;
    } else if (type === 'taxi') {
      speed = 1.65 + Math.random() * 0.25;
    } else if (resolvedVariant === 'race_car') {
      speed = 2.2 + Math.random() * 0.4;
    } else if (resolvedVariant === 'suv') {
      speed = 1.35 + Math.random() * 0.2;
    } else if (resolvedVariant === 'hatchback') {
      speed = 1.55 + Math.random() * 0.25;
    }

    // Lane offsets for standard two-lane roads vs. 3-lane Avenue roads
    const startCell = this.getCell(sx, sz);
    const isAvenue = startCell?.road?.type === 'avenue';
    let laneOffset = 0.22;
    if (type === 'tram') {
      laneOffset = 0.0; // Center track lane
    } else if (type === 'bus') {
      laneOffset = isAvenue ? 0.28 : 0.22; // Curbside transit lane
    } else if (isAvenue) {
      // 3 distinct lanes across Avenue width (left: -0.28, center: 0.0, right: +0.28)
      const rollLane = Math.random();
      laneOffset = rollLane < 0.33 ? -0.28 : rollLane < 0.66 ? 0.0 : 0.28;
    } else {
      laneOffset = 0.22;
    }

    this.vehicles.push({
      id: `veh_${++this.vehicleIdCounter}`,
      type,
      modelVariant: resolvedVariant,
      x: sx,
      z: sz,
      targetX: tx,
      targetZ: tz,
      rotation: Math.atan2(tx - sx, tz - sz),
      speed,
      progress: 0,
      color,
      state,
      homeCell,
      destCell,
      route: route || undefined,
      routeIndex: 0,
      isBlocked: false,
      dwellTimer: 0,
      laneOffset,
      wheelAngle: 0,
    });
  }

  private updateVehicles(delta: number) {
    // 1. Reset road traffic densities to calculate congestion accurately
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (this.grid[x][z].road) {
          this.grid[x][z].road!.trafficDensity = 0;
        }
      }
    }

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];

      // 2. Vehicles never stop or idle in the middle of a travel lane
      if (v.dwellTimer && v.dwellTimer > 0) {
        this.vehicles.splice(i, 1);
        continue;
      }

      // 3. Realistic continuous traffic movement & speed calculation
      const speedMult = 1.0;
      v.isBlocked = false;
      v.blockedTimer = 0;

      // Increment road congestion on current tile
      const roadCell = this.getCell(v.x, v.z);
      if (roadCell?.road) {
        roadCell.road.trafficDensity = Math.min(1.0, roadCell.road.trafficDensity + 0.15);
      }

      // Advance car along the road & rotate wheels realistically
      const moveDist = delta * v.speed * speedMult;
      v.progress += moveDist;
      v.wheelAngle = ((v.wheelAngle || 0) + (moveDist / 0.045)) % (Math.PI * 2);

      if (v.progress >= 1.0) {
        v.lastTile = [v.x, v.z];
        v.x = v.targetX;
        v.z = v.targetZ;
        v.progress = 0;

        const currentCell = this.getCell(v.x, v.z);
        if (!currentCell?.road) {
          this.vehicles.splice(i, 1);
          continue;
        }

        if (currentCell.road.type === 'toll_booth') {
          this.budget.treasury += 5; // Toll booth earnings!
          currentCell.road.carsPassed = (currentCell.road.carsPassed || 0) + 1;
          currentCell.road.totalEarnings = (currentCell.road.totalEarnings || 0) + 5;
          if (Math.random() < 0.2) {
            soundEngine.playTollChime();
          }
        }

        // Highway exit reached
        if (v.state === 'highway_exit' && currentCell.road.isHighwayGateway) {
          this.vehicles.splice(i, 1);
          continue;
        }

        // If following pre-calculated shortest route:
        if (v.route && v.routeIndex !== undefined) {
          v.routeIndex++;
          if (v.routeIndex < v.route.length - 1) {
            const nextPt = v.route[v.routeIndex + 1];
            v.targetX = nextPt[0];
            v.targetZ = nextPt[1];
            v.rotation = Math.atan2(v.targetX - v.x, v.targetZ - v.z);
            continue;
          } else {
            // Reached destination!
            if (v.type === 'firetruck' && v.destCell) {
              const targetCell = this.getCell(v.destCell.x, v.destCell.z);
              if (targetCell?.building && targetCell.building.onFire) {
                targetCell.building.onFire = false;
                targetCell.building.hp = targetCell.building.maxHp;
                targetCell.building.isAbandoned = false;
                soundEngine.playWater();
                if (this.onChirpTrigger) {
                  this.onChirpTrigger('happy', `🚒 Fire Department extinguished fire at ${targetCell.building.name}! Structure saved.`);
                }
              }
              this.vehicles.splice(i, 1);
              continue;
            }
            if (v.state === 'returning_home' || v.state === 'highway_exit') {
              // Safely parked at home garage or exited city!
              this.vehicles.splice(i, 1);
              continue;
            } else if (v.type === 'bus' || v.type === 'tram') {
              // Public transit never stops in the middle of the road:
              // Continuously circulate along the transit network!
              v.route = undefined;
              v.routeIndex = undefined;
            } else {
              // Regular cars reaching workplace or commercial shop:
              // Citizens safely pull into the parking lot or garage (no road blocking!)
              this.vehicles.splice(i, 1);
              continue;
            }
          }
        }

        // Continuous Flow: Pick next road tile avoiding dead-ends and immediate U-turns
        const validNeighbors: [number, number][] = [];
        if (currentCell.road.connections.north) validNeighbors.push([v.x, v.z - 1]);
        if (currentCell.road.connections.south) validNeighbors.push([v.x, v.z + 1]);
        if (currentCell.road.connections.east) validNeighbors.push([v.x + 1, v.z]);
        if (currentCell.road.connections.west) validNeighbors.push([v.x - 1, v.z]);

        // Fallback to any physically adjacent road if connections are transitioning
        if (validNeighbors.length === 0) {
          const adj = [
            [v.x + 1, v.z],
            [v.x - 1, v.z],
            [v.x, v.z + 1],
            [v.x, v.z - 1],
          ];
          for (const [ax, az] of adj) {
            if (this.getCell(ax, az)?.road) {
              validNeighbors.push([ax, az]);
            }
          }
        }

        if (validNeighbors.length === 0) {
          this.vehicles.splice(i, 1);
          continue;
        }

        // Exclude the tile we just arrived from to prevent back-and-forth bounce
        const nonReverseNeighbors = validNeighbors.filter(
          (n) => !v.lastTile || n[0] !== v.lastTile[0] || n[1] !== v.lastTile[1]
        );

        const candidates = nonReverseNeighbors.length > 0 ? nonReverseNeighbors : validNeighbors;
        const validCandidates = candidates.filter((c) => c[0] !== v.x || c[1] !== v.z);
        if (validCandidates.length === 0) {
          this.vehicles.splice(i, 1);
          continue;
        }

        const next = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        v.targetX = next[0];
        v.targetZ = next[1];
        v.rotation = Math.atan2(v.targetX - v.x, v.targetZ - v.z);

        // Adjust lane offset for 3-lane Avenue
        if (currentCell.road.type === 'avenue') {
          if (v.type === 'tram') {
            v.laneOffset = 0.0;
          } else if (v.type === 'bus') {
            v.laneOffset = 0.28;
          } else if (Math.abs(v.laneOffset) < 0.05 || Math.abs(v.laneOffset) > 0.3) {
            const rollLane = Math.random();
            v.laneOffset = rollLane < 0.33 ? -0.28 : rollLane < 0.66 ? 0.0 : 0.28;
          }
        } else if (v.type !== 'tram') {
          v.laneOffset = 0.22;
        }
      }
    }
  }

  // Realistic Pedestrians (Humans walking on the sidewalks and visiting shops/parks)
  private manageRealisticPedestrians() {
    if (this.waveActive) return; // No walking during lockdown!
    if (this.pedestrians.length >= 42) return;

    // Collect locations
    const homeCells: [number, number][] = [];
    const destinationCells: [number, number][] = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.building && !cell.building.isAbandoned) {
          if (cell.building.zone === 'residential' && cell.building.residents > 0) {
            homeCells.push([x, z]);
          } else if (cell.building.zone === 'commercial' || cell.building.zone === 'office' || cell.building.zone === 'industrial') {
            destinationCells.push([x, z]);
          }
        }
        if (cell.service && (cell.service.type === 'small_park' || cell.service.type === 'large_park' || cell.service.type === 'elementary_school')) {
          destinationCells.push([x, z]);
        }
      }
    }

    if (homeCells.length === 0 || destinationCells.length === 0) return;

    // Spawn 1-2 pedestrians per tick
    const spawnCount = Math.min(2, 42 - this.pedestrians.length);
    const shirtColors = [
      '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#F97316', '#EF4444', '#14B8A6', '#6366F1'
    ];

    for (let k = 0; k < spawnCount; k++) {
      const [hx, hz] = homeCells[Math.floor(Math.random() * homeCells.length)];
      const homeRoad = this.findAdjacentRoad(hx, hz);
      if (!homeRoad) continue;

      const [dx, dz] = destinationCells[Math.floor(Math.random() * destinationCells.length)];
      const destRoad = this.findAdjacentRoad(dx, dz) || this.findNearestRoad(dx, dz);
      if (!destRoad) continue;

      const route = this.findRoadPath(homeRoad[0], homeRoad[1], destRoad[0], destRoad[1]);
      if (!route || route.length < 2) continue;

      const roll = Math.random();
      const state = roll < 0.5 ? 'going_shopping' : roll < 0.8 ? 'strolling' : 'going_to_work';
      const sidewalkSide = Math.random() < 0.5 ? 0.36 : -0.36; // Walk on sidewalk curb
      const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];

      const sx = route[0][0];
      const sz = route[0][1];
      const tx = route[1][0];
      const tz = route[1][1];

      this.pedestrians.push({
        id: `ped_${++this.pedestrianIdCounter}`,
        x: sx,
        z: sz,
        targetX: tx,
        targetZ: tz,
        rotation: Math.atan2(tx - sx, tz - sz),
        speed: 0.55 + Math.random() * 0.25, // Natural walking speed
        progress: 0,
        shirtColor,
        sidewalkSide,
        state,
        homeCell: { x: hx, z: hz },
        destCell: { x: dx, z: dz },
        route,
        routeIndex: 0,
        dwellTimer: 0,
      });
    }
  }

  private updatePedestrians(delta: number) {
    for (let i = this.pedestrians.length - 1; i >= 0; i--) {
      const p = this.pedestrians[i];

      // Dwell at shop or park
      if (p.dwellTimer && p.dwellTimer > 0) {
        p.dwellTimer -= delta;
        if (p.dwellTimer <= 0) {
          // Finished activity: walk back home along the sidewalk!
          if (p.state !== 'heading_home' && p.homeCell) {
            const homeRoad = this.findAdjacentRoad(p.homeCell.x, p.homeCell.z);
            if (homeRoad) {
              const returnPath = this.findRoadPath(p.x, p.z, homeRoad[0], homeRoad[1]);
              if (returnPath && returnPath.length >= 2) {
                p.state = 'heading_home';
                p.route = returnPath;
                p.routeIndex = 0;
                p.targetX = returnPath[1][0];
                p.targetZ = returnPath[1][1];
                p.rotation = Math.atan2(p.targetX - p.x, p.targetZ - p.z);
                p.progress = 0;
                continue;
              }
            }
          }
          // Done walking: arrived home!
          this.pedestrians.splice(i, 1);
        }
        continue;
      }

      // Advance pedestrian along sidewalk
      p.progress += delta * p.speed;

      if (p.progress >= 1.0) {
        p.x = p.targetX;
        p.z = p.targetZ;
        p.progress = 0;

        if (p.route && p.routeIndex !== undefined) {
          p.routeIndex++;
          if (p.routeIndex < p.route.length - 1) {
            const nextPt = p.route[p.routeIndex + 1];
            p.targetX = nextPt[0];
            p.targetZ = nextPt[1];
            p.rotation = Math.atan2(p.targetX - p.x, p.targetZ - p.z);
            continue;
          } else {
            // Reached destination!
            if (p.state === 'heading_home') {
              this.pedestrians.splice(i, 1);
              continue;
            } else {
              // Dwell at park, shop or office for 4-8 seconds
              p.dwellTimer = 4.0 + Math.random() * 4.0;
              continue;
            }
          }
        } else {
          this.pedestrians.splice(i, 1);
        }
      }
    }
  }

  private manageFireDepartment() {
    if (this.waveActive) return;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.building && !cell.building.isAbandoned && !cell.building.onFire) {
          const fireChance = cell.pollution > 60 ? 0.0025 : 0.0006;
          if (Math.random() < fireChance) {
            cell.building.onFire = true;
            cell.building.isAbandoned = true;
            if (this.onChirpTrigger) {
              this.onChirpTrigger('warning', `🔥 FIRE EMERGENCY: Fire reported at ${cell.building.name} [${x}, ${z}]! Dispatching Fire Department.`);
            }
          }
        }
      }
    }

    const fireStations: [number, number][] = [];
    const burningBuildings: [number, number][] = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.service && cell.service.type === 'fire_station' && cell.hasPower && cell.hasWater) {
          fireStations.push([x, z]);
        }
        if (cell.building && cell.building.onFire) {
          burningBuildings.push([x, z]);
        }
      }
    }

    if (fireStations.length === 0 || burningBuildings.length === 0) return;

    for (const [bx, bz] of burningBuildings) {
      const alreadyTargeted = this.vehicles.some(
        (v) => v.type === 'firetruck' && v.destCell && v.destCell.x === bx && v.destCell.z === bz
      );

      if (!alreadyTargeted && this.vehicles.length < 48) {
        let nearestStation = fireStations[0];
        let minDist = Infinity;
        for (const [fsx, fsz] of fireStations) {
          const d = Math.hypot(fsx - bx, fsz - bz);
          if (d < minDist) {
            minDist = d;
            nearestStation = [fsx, fsz];
          }
        }

        const roadStart = this.findAdjacentRoad(nearestStation[0], nearestStation[1]) || [nearestStation[0], nearestStation[1]];
        const roadDest = this.findAdjacentRoad(bx, bz) || [bx, bz];
        const route = this.findRoadPath(roadStart[0], roadStart[1], roadDest[0], roadDest[1]);

        if (route && route.length > 0) {
          const startPt = route[0];
          this.vehicles.push({
            id: `firetruck_${Date.now()}_${Math.random()}`,
            type: 'firetruck',
            x: startPt[0],
            z: startPt[1],
            targetX: route[1] ? route[1][0] : startPt[0],
            targetZ: route[1] ? route[1][1] : startPt[1],
            rotation: 0,
            speed: 1.9,
            progress: 0,
            color: '#dc2626',
            state: 'roaming',
            destCell: { x: bx, z: bz },
            route,
            routeIndex: 0,
            laneOffset: 0.0,
          });
          soundEngine.playSiren();
          if (this.onChirpTrigger) {
            this.onChirpTrigger('news', `🚨 Fire engine dispatched from Fire Station to put out fire at [${bx}, ${bz}]!`);
          }
        }
      }
    }
  }

  private manageWasteManagement() {
    const pop = this.stats.population;
    const indCap = this.stats.industrialCapacity;
    const comCap = this.stats.commercialCapacity;

    const wasteGenerated = Math.round(pop * 0.7 + indCap * 1.5 + comCap * 0.8);

    let wasteProcessed = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.service && cell.hasPower && cell.hasWater) {
          if (cell.service.type === 'recycling_center') {
            wasteProcessed += 300;
          } else if (cell.service.type === 'incinerator') {
            wasteProcessed += 750;
          }
        }
      }
    }

    const wasteCoverage = wasteGenerated > 0 ? Math.min(100, Math.round((wasteProcessed / wasteGenerated) * 100)) : 100;
    this.stats.wasteGenerated = wasteGenerated;
    this.stats.wasteProcessed = wasteProcessed;
    this.stats.wasteCoverage = wasteCoverage;
    this.stats.needsWaste = wasteCoverage;

    if (wasteCoverage < 70 && wasteGenerated > 40 && Math.random() < 0.12 && this.onChirpTrigger) {
      this.onChirpTrigger('concern', '⚠️ Garbage piling up! Build Recycling Centers or Incinerators to maintain clean waste management.');
    }
  }

  public expandMap(direction: 'south' | 'east' | 'west' = 'south') {
    const oldSize = this.grid.length;
    const expandBy = 12;
    const newSize = oldSize + expandBy;
    const newGrid: CellData[][] = [];

    const offsetX = direction === 'west' ? expandBy : 0;
    const offsetZ = 0;

    for (let x = 0; x < newSize; x++) {
      newGrid[x] = [];
      for (let z = 0; z < newSize; z++) {
        const oldX = x - offsetX;
        const oldZ = z - offsetZ;
        if (oldX >= 0 && oldX < oldSize && oldZ >= 0 && oldZ < oldSize) {
          const cell = this.grid[oldX][oldZ];
          cell.x = x;
          cell.z = z;
          newGrid[x][z] = cell;
        } else {
          const terrain = (x + z) % 11 === 0 ? 'water' : (x + z) % 8 === 0 ? 'sand' : 'grass';
          newGrid[x][z] = {
            x,
            z,
            terrain,
            elevation: terrain === 'water' ? -0.2 : 0,
            road: null,
            zone: null,
            building: null,
            service: null,
            hasPower: false,
            hasWater: false,
            pollution: 0,
            landValue: 50,
            fireCoverage: false,
            policeCoverage: false,
            healthCoverage: false,
            educationCoverage: false,
          };
        }
      }
    }
    this.grid = newGrid;
    if (direction === 'west') {
      this.highwayPortalCoord.x += expandBy;
    }
  }

  public getDefenseStatus(): DefenseStatus {
    let totalTowers = 0;
    let totalBarracks = 0;
    let totalTollBooths = 0;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = this.grid[x][z];
        if (cell.service?.type === 'defense_tower') totalTowers++;
        if (cell.service?.type === 'army_barracks') totalBarracks++;
        if (cell.road?.type === 'toll_booth') totalTollBooths++;
      }
    }

    const nextWave = this.waveActive ? this.waveNumber : this.waveNumber + 1;
    const surrenderPenalty = Math.max(1000, 500 * nextWave);
    const victoryReward = 1200 * nextWave;
    const bill = this.getCityDamageRepairBill();

    return {
      waveActive: this.waveActive,
      waveNumber: this.waveNumber,
      raidersRemaining: this.raidersRemaining,
      totalRaidersInWave: this.totalRaidersInWave,
      waveTimer: Math.max(0, this.waveTimer),
      waveWarningActive: !this.waveActive && this.waveTimer <= 15,
      surrenderPenalty,
      victoryReward,
      lastWaveResult: this.lastWaveResult,
      lastWaveAmount: this.lastWaveAmount,
      totalTowers,
      totalBarracks,
      totalTollBooths,
      totalDamageIncurred: this.totalDamageIncurred,
      currentRepairCost: bill.totalRepairCost,
      damagedBuildingsCount: bill.damagedBuildingsCount,
      burningBuildingsCount: bill.burningCount,
    };
  }

  public getCityDamageRepairBill(): {
    totalRepairCost: number;
    damagedBuildingsCount: number;
    burningCount: number;
    abandonedCount: number;
  } {
    let totalRepairCost = 0;
    let damagedBuildingsCount = 0;
    let burningCount = 0;
    let abandonedCount = 0;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const b = this.grid[x][z].building;
        if (b) {
          const maxHp = b.maxHp || 100;
          const currentHp = b.hp !== undefined ? b.hp : maxHp;
          const missingHp = Math.max(0, maxHp - currentHp);
          let bldCost = 0;
          if (missingHp > 1) {
            bldCost += Math.round(missingHp * (8 + b.level * 4));
          }
          if (b.onFire) {
            bldCost += 250;
            burningCount++;
          }
          if (b.isAbandoned && missingHp > 0) {
            bldCost += 200;
            abandonedCount++;
          }
          if (bldCost > 0) {
            totalRepairCost += bldCost;
            damagedBuildingsCount++;
          }
        }
      }
    }

    return { totalRepairCost, damagedBuildingsCount, burningCount, abandonedCount };
  }

  public repairAllDamagedBuildings(): {
    success: boolean;
    cost: number;
    repairedCount: number;
    message: string;
  } {
    const bill = this.getCityDamageRepairBill();
    if (bill.totalRepairCost <= 0) {
      return { success: true, cost: 0, repairedCount: 0, message: "All city buildings are intact!" };
    }

    if (this.budget.treasury < bill.totalRepairCost) {
      return {
        success: false,
        cost: bill.totalRepairCost,
        repairedCount: 0,
        message: `Insufficient funds: Need $${bill.totalRepairCost.toLocaleString()} to repair city damage!`
      };
    }

    this.budget.treasury -= bill.totalRepairCost;
    this.damageRepairsPaid += bill.totalRepairCost;

    let count = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const b = this.grid[x][z].building;
        if (b && ((b.hp !== undefined && b.hp < b.maxHp) || b.onFire || (b.isAbandoned && b.hp < b.maxHp))) {
          b.hp = b.maxHp;
          b.onFire = false;
          b.isAbandoned = false;
          b.abandonedTimer = 0;
          count++;
        }
      }
    }

    soundEngine.playRepair();

    if (this.onChirpTrigger) {
      this.onChirpTrigger(
        'happy',
        `🛠️ City Public Works repaired ${count} damaged structures for $${bill.totalRepairCost.toLocaleString()}. Structural integrity restored!`
      );
    }

    return {
      success: true,
      cost: bill.totalRepairCost,
      repairedCount: count,
      message: `Repaired ${count} structures for $${bill.totalRepairCost.toLocaleString()}`
    };
  }

  public repairSingleBuilding(x: number, z: number): {
    success: boolean;
    cost: number;
    message: string;
  } {
    const cell = this.getCell(x, z);
    if (!cell || !cell.building) {
      return { success: false, cost: 0, message: "No building found." };
    }
    const b = cell.building;
    const maxHp = b.maxHp || 100;
    const currentHp = b.hp !== undefined ? b.hp : maxHp;
    const missingHp = Math.max(0, maxHp - currentHp);
    let cost = Math.round(missingHp * (8 + b.level * 4));
    if (b.onFire) cost += 250;
    if (b.isAbandoned && missingHp > 0) cost += 200;
    cost = Math.max(50, cost);

    if (this.budget.treasury < cost) {
      return { success: false, cost, message: `Need $${cost} to repair ${b.name}!` };
    }

    this.budget.treasury -= cost;
    this.damageRepairsPaid += cost;
    b.hp = b.maxHp;
    b.onFire = false;
    b.isAbandoned = false;
    b.abandonedTimer = 0;

    soundEngine.playRepair();

    return { success: true, cost, message: `${b.name} restored to 100% integrity!` };
  }

  public triggerWaveNow() {
    if (this.waveActive) return;
    this.waveTimer = 0;
    this.startRaiderWave();
  }

  private findRaiderPath(startX: number, startZ: number): [number, number][] {
    const queue: [number, number, [number, number][]][] = [[startX, startZ, [[startX, startZ]]]];
    const visited = new Set<string>();
    visited.add(`${startX},${startZ}`);

    let bestPath: [number, number][] = [[startX, startZ]];
    let maxCityScore = -1;

    while (queue.length > 0) {
      const [cx, cz, path] = queue.shift()!;
      if (path.length > 40) continue;

      const cell = this.getCell(cx, cz);
      let score = path.length;
      if (cell?.building) score += 30;
      if (cell?.road?.type === 'toll_booth') score += 20;
      if (cell?.service) score += 25;

      if (score > maxCityScore) {
        maxCityScore = score;
        bestPath = path;
      }

      const neighbors = [
        [cx + 1, cz],
        [cx - 1, cz],
        [cx, cz + 1],
        [cx, cz - 1],
      ];

      for (const [nx, nz] of neighbors) {
        const key = `${nx},${nz}`;
        if (visited.has(key)) continue;
        const nCell = this.getCell(nx, nz);
        if (!nCell || nCell.terrain === 'water') continue;
        if (nCell.road) {
          visited.add(key);
          queue.push([nx, nz, [...path, [nx, nz]]]);
        }
      }
    }

    if (bestPath.length <= 2) {
      const midX = Math.floor(GRID_SIZE / 2);
      const midZ = Math.floor(GRID_SIZE / 2);
      bestPath = [
        [startX, startZ],
        [Math.round((startX + midX) / 2), Math.round((startZ + midZ) / 2)],
        [midX, midZ],
      ];
    }

    return bestPath;
  }

  public startRaiderWave() {
    if (this.waveActive) return;
    this.waveNumber++;
    this.waveActive = true;
    this.lastWaveResult = null;
    this.combatShots = [];

    const count = 4 + this.waveNumber * 2;
    this.totalRaidersInWave = count;
    this.raidersRemaining = count;
    this.raiders = [];
    this.militiaUnits = [];

    const portal = this.highwayPortalCoord || { x: 8, z: 0 };
    const route = this.findRaiderPath(portal.x, portal.z);

    const unitTypes: ('technical' | 'buggy' | 'armored_van' | 'infantry')[] = [
      'technical',
      'buggy',
      'armored_van',
      'infantry',
    ];

    for (let i = 0; i < count; i++) {
      const uType = unitTypes[i % unitTypes.length];
      const baseHp = uType === 'armored_van' ? 320 : uType === 'technical' ? 180 : uType === 'buggy' ? 130 : 90;
      const baseSpeed = uType === 'buggy' ? 1.6 : uType === 'technical' ? 1.3 : uType === 'armored_van' ? 0.95 : 0.85;

      const startPt = route[0] || [portal.x, portal.z];
      const nextPt = route[1] || [portal.x, portal.z + 1];

      this.raiders.push({
        id: `raider_${Date.now()}_${i}`,
        type: uType,
        x: startPt[0] - (nextPt[0] - startPt[0]) * (i * 0.45),
        z: startPt[1] - (nextPt[1] - startPt[1]) * (i * 0.45),
        targetX: nextPt[0],
        targetZ: nextPt[1],
        rotation: Math.atan2(nextPt[0] - startPt[0], nextPt[1] - startPt[1]),
        progress: 0,
        hp: baseHp + this.waveNumber * 35,
        maxHp: baseHp + this.waveNumber * 35,
        speed: baseSpeed + Math.random() * 0.2,
        laneOffset: i % 2 === 0 ? 0.20 : -0.20,
        route,
        routeIndex: 0,
      });
    }

    // Deploy Militia units from all Army Barracks
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const s = this.grid[x][z].service;
        if (s && s.type === 'army_barracks') {
          for (let m = 0; m < 3; m++) {
            const mType = m === 0 ? 'patrol_jeep' : 'enforcer';
            this.militiaUnits.push({
              id: `militia_${Date.now()}_${x}_${z}_${m}`,
              type: mType,
              x,
              z,
              targetX: portal.x,
              targetZ: portal.z,
              rotation: 0,
              progress: 0,
              hp: mType === 'patrol_jeep' ? 220 : 120,
              maxHp: mType === 'patrol_jeep' ? 220 : 120,
              speed: mType === 'patrol_jeep' ? 1.4 : 0.9,
              laneOffset: -0.20,
              barracksCoord: { x, z },
            });
          }
        }
      }
    }

    soundEngine.playSiren();

    if (this.onWaveEvent) {
      this.onWaveEvent('start', {
        waveNumber: this.waveNumber,
        count,
        surrenderPenalty: Math.max(1000, 500 * this.waveNumber),
      });
    }

    if (this.onChirpTrigger) {
      this.onChirpTrigger(
        'warning',
        `🚨 CITY LOCKDOWN ACTIVATED! Wave ${this.waveNumber} (${count} hostile vehicles/militia) breached highway! Defense towers engaging!`
      );
    }
  }

  public surrenderWave() {
    if (!this.waveActive) return;
    const penalty = Math.max(1000, 500 * this.waveNumber);
    this.budget.treasury = Math.max(0, this.budget.treasury - penalty);
    this.waveActive = false;
    this.lastWaveResult = 'surrender';
    this.lastWaveAmount = penalty;
    this.waveTimer = 90 + this.waveNumber * 15;
    this.waveWarningTriggered = false;
    this.raiders = [];
    this.militiaUnits = [];
    this.combatShots = [];
    soundEngine.playAlert();

    if (this.onWaveEvent) {
      this.onWaveEvent('surrender', { penalty, waveNumber: this.waveNumber });
    }

    if (this.onChirpTrigger) {
      this.onChirpTrigger(
        'warning',
        `🏳️ City surrendered to raiders for Wave ${this.waveNumber}. Paid $${penalty.toLocaleString()} indemnity from treasury. Hostiles retreating.`
      );
    }
  }

  public updateTowerDefense(delta: number) {
    // 1. Decay active combat tracer shots
    for (let i = this.combatShots.length - 1; i >= 0; i--) {
      this.combatShots[i].life -= delta * 3.0;
      if (this.combatShots[i].life <= 0) {
        this.combatShots.splice(i, 1);
      }
    }

    if (!this.waveActive) return;

    // 2. Defense Towers Attack Raiders
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const s = this.grid[x][z].service;
        if (s && s.type === 'defense_tower') {
          let closestR: RaiderEntity | null = null;
          let closestDist = 7.0; // Tower attack radius

          for (const r of this.raiders) {
            const dist = Math.hypot(r.x - x, r.z - z);
            if (dist < closestDist) {
              closestDist = dist;
              closestR = r;
            }
          }

          if (closestR) {
            const dmg = delta * 85;
            closestR.hp -= dmg;

            if (Math.random() < 0.35) {
              if (Math.random() < 0.15) soundEngine.playLaserShot();
              this.combatShots.push({
                id: `shot_${Date.now()}_${Math.random()}`,
                fromX: x + 0.5,
                fromY: 0.85,
                fromZ: z + 0.5,
                toX: closestR.x + 0.5,
                toY: 0.25,
                toZ: closestR.z + 0.5,
                type: 'tower_laser',
                life: 1.0,
              });
            }
          }
        }
      }
    }

    // 3. Toll Booth Defense: Automated security guns + barrier chokepoint
    // Raiders pass through like vehicles while taking defensive fire!
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const r = this.grid[x][z].road;
        if (r && r.type === 'toll_booth') {
          let closestR: RaiderEntity | null = null;
          let closestDist = 4.2;

          for (const raider of this.raiders) {
            const dist = Math.hypot(raider.x - x, raider.z - z);
            if (dist < closestDist) {
              closestDist = dist;
              closestR = raider;
            }
            // Barrier chokepoint: raiders slow slightly when passing toll plaza
            if (dist < 1.4) {
              raider.speed = Math.min(raider.speed, 0.65);
            }
          }

          if (closestR && Math.random() < 0.25) {
            closestR.hp -= delta * 50;
            if (Math.random() < 0.15) soundEngine.playLaserShot();
            this.combatShots.push({
              id: `toll_shot_${Date.now()}_${Math.random()}`,
              fromX: x + 0.5,
              fromY: 0.75,
              fromZ: z + 0.5,
              toX: closestR.x + 0.5,
              toY: 0.25,
              toZ: closestR.z + 0.5,
              type: 'toll_turret',
              life: 1.0,
            });
          }
        }
      }
    }

    // 4. Militia Attack Raiders
    for (const m of this.militiaUnits) {
      let targetRaider: RaiderEntity | null = null;
      let minDist = 4.5;

      for (const r of this.raiders) {
        const dist = Math.hypot(m.x - r.x, m.z - r.z);
        if (dist < minDist) {
          minDist = dist;
          targetRaider = r;
        }
      }

      if (targetRaider) {
        m.targetRaiderId = targetRaider.id;
        targetRaider.hp -= delta * 45;
        if (Math.random() < 0.2) {
          if (Math.random() < 0.15) soundEngine.playRaiderShot();
          this.combatShots.push({
            id: `mshot_${Date.now()}_${Math.random()}`,
            fromX: m.x + 0.5,
            fromY: 0.22,
            fromZ: m.z + 0.5,
            toX: targetRaider.x + 0.5,
            toY: 0.22,
            toZ: targetRaider.z + 0.5,
            type: 'militia_bullet',
            life: 1.0,
          });
        }
        m.x += Math.sign(targetRaider.x - m.x) * delta * m.speed * 0.3;
        m.z += Math.sign(targetRaider.z - m.z) * delta * m.speed * 0.3;
        m.rotation = Math.atan2(targetRaider.x - m.x, targetRaider.z - m.z);
      } else if (this.raiders.length > 0) {
        const firstR = this.raiders[0];
        m.x += Math.sign(firstR.x - m.x) * delta * m.speed * 0.4;
        m.z += Math.sign(firstR.z - m.z) * delta * m.speed * 0.4;
        m.rotation = Math.atan2(firstR.x - m.x, firstR.z - m.z);
      }
    }

    // 5. Update Raiders: Movement & Shooting at Buildings
    // Raiders travel like normal vehicles through tolls & traffic, only exploding when HP hits 0!
    for (let i = this.raiders.length - 1; i >= 0; i--) {
      const r = this.raiders[i];

      // True destruction: only explodes when shot down!
      if (r.hp <= 0) {
        soundEngine.playExplosion();
        this.destroyedRaiderIds.add(r.id);
        this.raiders.splice(i, 1);
        this.raidersRemaining = Math.max(0, this.raidersRemaining - 1);
        this.budget.treasury += 60 + this.waveNumber * 15;
        continue;
      }

      let attackingBuilding = false;
      let targetBldCoord: { x: number; z: number } | null = null;

      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const bx = Math.round(r.x) + dx;
          const bz = Math.round(r.z) + dz;
          const c = this.getCell(bx, bz);
          if (c && c.building && !c.building.isAbandoned) {
            attackingBuilding = true;
            targetBldCoord = { x: bx, z: bz };
            const dmg = delta * 18;
            c.building.hp -= dmg;
            const dollarCost = Math.round(dmg * (8 + c.building.level * 4));
            this.totalDamageIncurred += dollarCost;

            if (c.building.hp <= 0) {
              c.building.hp = 0;
              c.building.onFire = true;
              c.building.isAbandoned = true;
            }

            if (Math.random() < 0.18) {
              if (Math.random() < 0.15) soundEngine.playRaiderShot();
              this.combatShots.push({
                id: `rshot_${Date.now()}_${Math.random()}`,
                fromX: r.x + 0.5,
                fromY: 0.25,
                fromZ: r.z + 0.5,
                toX: bx + 0.5,
                toY: 0.5,
                toZ: bz + 0.5,
                type: r.type === 'armored_van' ? 'raider_rocket' : 'raider_bullet',
                life: 1.0,
              });
            }
            break;
          }
        }
        if (attackingBuilding) break;
      }

      r.isAttackingBuilding = attackingBuilding;
      r.attackTargetCoord = targetBldCoord || undefined;

      const moveSpeed = attackingBuilding ? r.speed * 0.45 : r.speed;
      r.progress += delta * moveSpeed * 0.45;

      if (r.progress >= 1.0) {
        r.lastTile = [r.x, r.z];
        r.x = r.targetX;
        r.z = r.targetZ;
        r.progress = 0;

        if (r.route && r.routeIndex !== undefined) {
          r.routeIndex++;
          if (r.routeIndex < r.route.length - 1) {
            const nextCoord = r.route[r.routeIndex + 1];
            r.targetX = nextCoord[0];
            r.targetZ = nextCoord[1];
            r.rotation = Math.atan2(r.targetX - r.x, r.targetZ - r.z);
            continue;
          } else {
            // Reached destination of initial route:
            // Do NOT explode! Transition into continuous city road cruising like normal vehicles!
            r.route = undefined;
            r.routeIndex = undefined;
          }
        }

        // Continuous Road Cruising: traverse connected city roads seamlessly
        const currentCell = this.getCell(r.x, r.z);
        const validNeighbors: [number, number][] = [];
        if (currentCell?.road) {
          const conn = currentCell.road.connections;
          if (conn.north && this.getCell(r.x, r.z - 1)?.road) validNeighbors.push([r.x, r.z - 1]);
          if (conn.south && this.getCell(r.x, r.z + 1)?.road) validNeighbors.push([r.x, r.z + 1]);
          if (conn.east && this.getCell(r.x + 1, r.z)?.road) validNeighbors.push([r.x + 1, r.z]);
          if (conn.west && this.getCell(r.x - 1, r.z)?.road) validNeighbors.push([r.x - 1, r.z]);
        }

        if (validNeighbors.length === 0) {
          const adj = [
            [r.x + 1, r.z],
            [r.x - 1, r.z],
            [r.x, r.z + 1],
            [r.x, r.z - 1],
          ];
          for (const [ax, az] of adj) {
            if (this.getCell(ax, az)?.road) validNeighbors.push([ax, az]);
          }
        }

        if (validNeighbors.length > 0) {
          const nonReverse = validNeighbors.filter(
            (n) => !r.lastTile || n[0] !== r.lastTile[0] || n[1] !== r.lastTile[1]
          );
          const candidates = nonReverse.length > 0 ? nonReverse : validNeighbors;
          const next = candidates[Math.floor(Math.random() * candidates.length)];
          r.targetX = next[0];
          r.targetZ = next[1];
          r.rotation = Math.atan2(r.targetX - r.x, r.targetZ - r.z);
        } else {
          // Off-road fallback roaming toward municipal center
          const targetX = Math.floor(GRID_SIZE / 2);
          const targetZ = Math.floor(GRID_SIZE / 2);
          r.targetX = r.x + Math.sign(targetX - r.x);
          r.targetZ = r.z + Math.sign(targetZ - r.z);
          r.rotation = Math.atan2(r.targetX - r.x, r.targetZ - r.z);
        }
      }
    }

    // 6. Defeat check: city treasury exhausted to 0 while under raid
    if (this.budget.treasury <= 0 && this.waveActive && this.raiders.length > 0) {
      const penalty = Math.max(1000, 500 * this.waveNumber);
      this.waveActive = false;
      this.lastWaveResult = 'defeat';
      this.lastWaveAmount = penalty;
      this.waveTimer = 90 + this.waveNumber * 15;
      this.waveWarningTriggered = false;
      this.raiders = [];
      this.militiaUnits = [];
      this.combatShots = [];
      soundEngine.playAlert();
      if (this.onChirpTrigger) {
        this.onChirpTrigger(
          'warning',
          `💥 CITY OVERRUN! Wave ${this.waveNumber} looted municipal reserves! Construct more Defense Towers along roads.`
        );
      }
      return;
    }

    // 7. Victory check: All raiders defeated!
    if (this.raiders.length === 0 || this.raidersRemaining === 0) {
      this.waveActive = false;
      this.lastWaveResult = 'victory';
      const reward = 1200 * this.waveNumber;
      this.lastWaveAmount = reward;
      this.budget.treasury += reward;
      this.waveTimer = 90 + this.waveNumber * 15;
      this.waveWarningTriggered = false;
      this.combatShots = [];
      this.militiaUnits = [];
      soundEngine.playVictory();

      if (this.onWaveEvent) {
        this.onWaveEvent('victory', { reward, waveNumber: this.waveNumber });
      }

      if (this.onChirpTrigger) {
        this.onChirpTrigger(
          'happy',
          `🛡️ VICTORY! Wave ${this.waveNumber} successfully repelled! City defense bonus +$${reward.toLocaleString()} deposited to treasury.`
        );
      }
    }
  }
}
