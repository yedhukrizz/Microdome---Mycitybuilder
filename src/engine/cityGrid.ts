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
  VehicleTripState,
  Pedestrian,
  ZoneType,
} from '../types/city';

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
];

export const TOOL_COSTS: Record<string, number> = {
  // Roads
  road_two_lane: 20,
  road_avenue: 50,
  road_highway: 100,
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
  // Utilities
  wind_turbine: 6000,
  solar_farm: 14000,
  coal_plant: 25000,
  water_tower: 4500,
  sewage_plant: 9000,
  // Services
  clinic: 8000,
  hospital: 28000,
  fire_station: 10000,
  police_station: 11000,
  elementary_school: 12000,
  university: 45000,
  small_park: 3000,
  large_park: 10000,
  stadium: 65000,
  parking_lot: 1500,
};

export const SERVICE_MAINTENANCE: Record<ServiceType, number> = {
  wind_turbine: 80,
  solar_farm: 180,
  coal_plant: 450,
  water_tower: 60,
  sewage_plant: 150,
  clinic: 200,
  hospital: 750,
  fire_station: 250,
  police_station: 280,
  elementary_school: 240,
  university: 900,
  small_park: 50,
  large_park: 160,
  stadium: 1200,
  parking_lot: 20,
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
  public history: CityHistorySnapshot[] = [];
  public overlayMode: OverlayMode = 'none';
  public onMilestoneAchieved?: (milestone: Milestone) => void;
  public onChirpTrigger?: (type: 'happy' | 'concern' | 'news' | 'warning', text: string) => void;

  public highwayPortalCoord: { x: number; z: number } = { x: 8, z: 0 };

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
    const cell = this.getCell(x, z);
    if (!cell) return { success: false, message: 'Invalid coordinate' };

    switch (tool.category) {
      case 'roads': {
        const costKey = `road_${tool.roadType}`;
        const cost = TOOL_COSTS[costKey] || 30;
        if (this.budget.treasury < cost) {
          return { success: false, message: 'Insufficient funds for road!' };
        }
        if (cell.building || cell.service) {
          return { success: false, message: 'Tile is occupied!' };
        }
        this.budget.treasury -= cost;
        this.placeRoad(x, z, tool.roadType, true);
        return { success: true };
      }

      case 'zones': {
        if (cell.terrain === 'water') {
          return { success: false, message: 'Cannot zone on water!' };
        }
        if (cell.road || cell.service) {
          return { success: false, message: 'Tile occupied by road or service! Bulldoze first.' };
        }
        if (tool.zoneType === 'dezone') {
          cell.building = null;
          cell.zone = null;
          this.recomputeNetworksAndSimulation(true);
          return { success: true };
        }
        const costKey = `zone_${tool.zoneType}`;
        const cost = TOOL_COSTS[costKey] || 10;
        if (this.budget.treasury < cost) {
          return { success: false, message: 'Insufficient funds for zoning!' };
        }
        this.budget.treasury -= cost;
        this.setZone(x, z, tool.zoneType, false);

        // Immediately spawn or upgrade building on this zoned tile!
        if (!cell.building) {
          this.spawnBuilding(x, z, tool.zoneType, 1);
        } else if (cell.building.zone === tool.zoneType && cell.building.level < 5) {
          cell.building.level += 1;
          cell.building.height = 0.8 + cell.building.level * 0.6;
          cell.building.name = this.generateBuildingName(tool.zoneType, cell.building.level);
        } else if (cell.building.zone !== tool.zoneType) {
          // Replaced zone with a new zone
          this.spawnBuilding(x, z, tool.zoneType, 1);
        }

        this.recomputeNetworksAndSimulation(true);
        return { success: true };
      }

      case 'buildings': {
        // Direct building placement!
        if (cell.terrain === 'water') {
          return { success: false, message: 'Cannot build on water!' };
        }
        if (cell.road || cell.service) {
          return { success: false, message: 'Tile occupied by road or service! Bulldoze first.' };
        }
        const costKey = `bld_${tool.buildingType}`;
        const cost = TOOL_COSTS[costKey] || 500;
        if (this.budget.treasury < cost) {
          return { success: false, message: 'Insufficient funds for building!' };
        }

        this.budget.treasury -= cost;
        cell.zone = tool.zone;
        const b = this.spawnBuilding(x, z, tool.zone, tool.level);
        b.constructionProgress = 1.0;
        this.recomputeNetworksAndSimulation(true);
        return { success: true };
      }

      case 'utilities':
      case 'services': {
        const cost = TOOL_COSTS[tool.serviceType] || 5000;
        if (this.budget.treasury < cost) {
          return { success: false, message: 'Insufficient funds!' };
        }
        if (cell.terrain === 'water' && tool.serviceType !== 'sewage_plant') {
          return { success: false, message: 'Must be placed on land!' };
        }
        if (cell.road || cell.service || cell.building) {
          return { success: false, message: 'Tile already occupied!' };
        }
        this.budget.treasury -= cost;
        this.placeService(x, z, tool.serviceType, true);
        return { success: true };
      }

      case 'bulldoze': {
        if (cell.road) {
          cell.road = null;
          this.recalculateRoadConnections();
          this.budget.treasury += 10;
          return { success: true };
        }
        if (cell.building) {
          cell.building = null;
          return { success: true };
        }
        if (cell.service) {
          cell.service = null;
          return { success: true };
        }
        if (cell.zone) {
          cell.zone = null;
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
    };
    cell.zone = null;
    cell.building = null;

    if (recompute) {
      this.recalculateRoadConnections();
      this.recomputeNetworksAndSimulation();
    }
  }

  public setZone(x: number, z: number, zoneType: ZoneType, recompute = true) {
    const cell = this.getCell(x, z);
    if (!cell || cell.road || cell.service) return;
    cell.zone = zoneType;
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
      case 'water_tower':
        waterOutput = 10000;
        radius = 10;
        break;
      case 'sewage_plant':
        waterOutput = 20000;
        radius = 14;
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
      case 'small_park':
        radius = 6;
        effectValue = 30;
        break;
      case 'large_park':
        radius = 12;
        effectValue = 50;
        break;
      case 'stadium':
        radius = 20;
        effectValue = 70;
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

  public spawnBuilding(x: number, z: number, zone: ZoneType, level = 1): BuildingData {
    const cell = this.grid[x][z];
    const isHigh = level >= 3;
    const maxResidents = zone === 'residential' ? level * (isHigh ? 24 : 6) : 0;
    const maxWorkers = zone !== 'residential' ? level * (isHigh ? 30 : 8) : 0;

    const orientations = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const rotation = orientations[Math.floor(Math.random() * orientations.length)];

    const building: BuildingData = {
      id: `bld_${++this.buildingIdCounter}`,
      name: this.generateBuildingName(zone, level),
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
      styleSeed: Math.floor(Math.random() * 1000),
      height: 0.8 + level * 0.6,
      taxIncome: level * (zone === 'residential' ? 18 : 26),
      rotation,
    };

    cell.building = building;
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
  }

  // 60 FPS motion update for cars and pedestrians walking on sidewalks
  public updateLivelyEntities(deltaSeconds: number) {
    if (this.stats.simulationSpeed === 0) return;
    const effectiveDelta = deltaSeconds * this.stats.simulationSpeed;
    this.updateVehicles(effectiveDelta);
    this.updatePedestrians(effectiveDelta);
  }

  private simulationTick() {
    this.recomputeNetworksAndSimulation();
    this.handleBuildingGrowthAndDecay();
    this.updateDemands();
    this.checkMilestones();
    this.manageRealisticTraffic();
    this.manageRealisticPedestrians();
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
          expenses += cell.road.type === 'two_lane' ? 4 : cell.road.type === 'avenue' ? 10 : 25;
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

  // Shortest path on the connected road network using ultra-fast typed-array BFS (0 allocations)
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

    this.bfsToken = ((this.bfsToken + 1) & 0xffff) || 1;
    const token = this.bfsToken;
    const visited = this.bfsVisited;
    const parent = this.bfsParent;
    const queue = this.bfsQueue;

    let head = 0;
    let tail = 0;
    queue[tail++] = startIdx;
    visited[startIdx] = token;
    parent[startIdx] = -1;

    let reached = false;

    while (head < tail) {
      const currIdx = queue[head++];
      if (currIdx === targetIdx) {
        reached = true;
        break;
      }

      const cx = (currIdx / GRID_SIZE) | 0;
      const cz = currIdx % GRID_SIZE;
      const currentCell = this.grid[cx][cz];
      if (!currentCell.road) continue;

      const conn = currentCell.road.connections;

      // North: cz - 1
      if (conn.north && cz > 0) {
        const nIdx = currIdx - 1;
        if (visited[nIdx] !== token && this.grid[cx][cz - 1].road) {
          visited[nIdx] = token;
          parent[nIdx] = currIdx;
          queue[tail++] = nIdx;
        }
      }
      // South: cz + 1
      if (conn.south && cz < GRID_SIZE - 1) {
        const nIdx = currIdx + 1;
        if (visited[nIdx] !== token && this.grid[cx][cz + 1].road) {
          visited[nIdx] = token;
          parent[nIdx] = currIdx;
          queue[tail++] = nIdx;
        }
      }
      // East: cx + 1
      if (conn.east && cx < GRID_SIZE - 1) {
        const nIdx = currIdx + GRID_SIZE;
        if (visited[nIdx] !== token && this.grid[cx + 1][cz].road) {
          visited[nIdx] = token;
          parent[nIdx] = currIdx;
          queue[tail++] = nIdx;
        }
      }
      // West: cx - 1
      if (conn.west && cx > 0) {
        const nIdx = currIdx - GRID_SIZE;
        if (visited[nIdx] !== token && this.grid[cx - 1][cz].road) {
          visited[nIdx] = token;
          parent[nIdx] = currIdx;
          queue[tail++] = nIdx;
        }
      }
    }

    if (!reached) return null;

    // Backtrack path into array of [x, z]
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

        const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#F3F4F6'];
        this.spawnCarOnRoad(
          startRoad[0],
          startRoad[1],
          'highway_entry',
          colors[Math.floor(Math.random() * colors.length)],
          'car',
          undefined,
          destRoad ? { x: destRoad[0], z: destRoad[1] } : undefined
        );
        this.stats.highwayCommuters++;
      }
    }

    // 2. Spawning Resident Car from Home (Every citizen has a car, each car has a home!)
    if (homeCells.length > 0 && Math.random() < 0.65) {
      const [hx, hz] = homeCells[Math.floor(Math.random() * homeCells.length)];
      const roadNearHome = this.findAdjacentRoad(hx, hz);

      if (roadNearHome) {
        // Decide trip purpose based on city amenities
        const roll = Math.random();
        let state: VehicleTripState = 'commuting_work';
        let type: 'car' | 'taxi' | 'bus' = 'car';
        let targetCell: [number, number] | null = null;

        if (roll < 0.50 && workCells.length > 0) {
          state = 'commuting_work';
          targetCell = workCells[Math.floor(Math.random() * workCells.length)];
        } else if (roll < 0.85 && shopCells.length > 0) {
          state = 'shopping';
          type = Math.random() < 0.35 ? 'taxi' : 'car';
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

        const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#E5E7EB', '#8B5CF6'];
        this.spawnCarOnRoad(
          roadNearHome[0],
          roadNearHome[1],
          state,
          type === 'taxi' ? '#FACC15' : colors[Math.floor(Math.random() * colors.length)],
          type,
          { x: hx, z: hz },
          destRoad ? { x: destRoad[0], z: destRoad[1] } : undefined
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
    type: 'car' | 'taxi' | 'bus' | 'truck' = 'car',
    homeCell?: { x: number; z: number },
    destCell?: { x: number; z: number }
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
    } else {
      const neighbors = [
        [sx + 1, sz],
        [sx - 1, sz],
        [sx, sz + 1],
        [sx, sz - 1],
      ].filter(([nx, nz]) => this.getCell(nx, nz)?.road !== null);

      if (neighbors.length === 0) return;
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      tx = pick[0];
      tz = pick[1];
    }

    this.vehicles.push({
      id: `veh_${++this.vehicleIdCounter}`,
      type,
      x: sx,
      z: sz,
      targetX: tx,
      targetZ: tz,
      rotation: Math.atan2(tx - sx, tz - sz),
      speed: type === 'bus' ? 1.0 : 1.5 + Math.random() * 0.3,
      progress: 0,
      color,
      state,
      homeCell,
      destCell,
      route: route || undefined,
      routeIndex: 0,
      isBlocked: false,
      dwellTimer: 0,
      laneOffset: 0.16, // Right-side driving!
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

      // 2. Handle parked / dwelling cars at workplace or shopping center
      if (v.dwellTimer && v.dwellTimer > 0) {
        v.dwellTimer -= delta;
        if (v.dwellTimer <= 0) {
          // Finished working / shopping! Commute back to home building!
          if ((v.state === 'commuting_work' || v.state === 'shopping') && v.homeCell) {
            const homeRoad = this.findAdjacentRoad(v.homeCell.x, v.homeCell.z);
            if (homeRoad) {
              const returnPath = this.findRoadPath(v.x, v.z, homeRoad[0], homeRoad[1]);
              if (returnPath && returnPath.length >= 2) {
                v.state = 'returning_home';
                v.route = returnPath;
                v.routeIndex = 0;
                v.targetX = returnPath[1][0];
                v.targetZ = returnPath[1][1];
                v.rotation = Math.atan2(v.targetX - v.x, v.targetZ - v.z);
                v.progress = 0;
                continue;
              }
            }
          }
          // If no return path possible or finished home return, park car
          this.vehicles.splice(i, 1);
        }
        continue;
      }

      // 3. Realistic Car-Following & Traffic Jam / Traffic Block detection:
      // If a vehicle is directly ahead on the same road segment or destination, stop to prevent collision!
      let carAheadDist = 999;
      const curWorldX = v.x + (v.targetX - v.x) * v.progress;
      const curWorldZ = v.z + (v.targetZ - v.z) * v.progress;

      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (other.dwellTimer && other.dwellTimer > 0) continue;

        const otherWorldX = other.x + (other.targetX - other.x) * other.progress;
        const otherWorldZ = other.z + (other.targetZ - other.z) * other.progress;
        const dx = otherWorldX - curWorldX;
        const dz = otherWorldZ - curWorldZ;
        const dist = Math.hypot(dx, dz);

        // Check if other car is in front of our vehicle's travel direction
        const fwdX = Math.sin(v.rotation);
        const fwdZ = Math.cos(v.rotation);
        const forwardDot = dx * fwdX + dz * fwdZ;

        if (dist < 0.65 && forwardDot > 0.05) {
          if (dist < carAheadDist) carAheadDist = dist;
        }
      }

      let speedMult = 1.0;
      if (carAheadDist < 0.42) {
        // Full stop behind the car ahead - TRAFFIC BLOCK!
        v.isBlocked = true;
        speedMult = 0.0;
      } else if (carAheadDist < 0.70) {
        // Slow down in congestion queue
        v.isBlocked = false;
        speedMult = 0.35;
      } else {
        v.isBlocked = false;
      }

      // Increment road congestion on current tile
      const roadCell = this.getCell(v.x, v.z);
      if (roadCell?.road) {
        roadCell.road.trafficDensity = Math.min(1.0, roadCell.road.trafficDensity + (v.isBlocked ? 0.35 : 0.15));
      }

      // Advance car along the road
      v.progress += delta * v.speed * speedMult;

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
            if (v.state === 'returning_home') {
              // Citizen has safely returned home! Park car.
              this.vehicles.splice(i, 1);
              continue;
            } else if (v.state === 'highway_exit') {
              this.vehicles.splice(i, 1);
              continue;
            } else {
              // Reached workplace or commercial shop: dwell for several seconds!
              v.dwellTimer = 4.5 + Math.random() * 3.5;
              continue;
            }
          }
        }

        // Fallback: Pick next road tile while strictly AVOIDING looping in circles:
        // Filter out immediate U-turn unless dead-end!
        const validNeighbors: [number, number][] = [];
        if (currentCell.road.connections.north) validNeighbors.push([v.x, v.z - 1]);
        if (currentCell.road.connections.south) validNeighbors.push([v.x, v.z + 1]);
        if (currentCell.road.connections.east) validNeighbors.push([v.x + 1, v.z]);
        if (currentCell.road.connections.west) validNeighbors.push([v.x - 1, v.z]);

        if (validNeighbors.length === 0) {
          this.vehicles.splice(i, 1);
          continue;
        }

        // Exclude the tile we just arrived from to stop infinite back-and-forth bounce!
        const nonReverseNeighbors = validNeighbors.filter(
          (n) => !v.lastTile || n[0] !== v.lastTile[0] || n[1] !== v.lastTile[1]
        );

        const candidates = nonReverseNeighbors.length > 0 ? nonReverseNeighbors : validNeighbors;
        // Pick pseudo-random candidate (not always index 0)
        const next = candidates[Math.floor(Math.random() * candidates.length)];
        v.targetX = next[0];
        v.targetZ = next[1];
        v.rotation = Math.atan2(v.targetX - v.x, v.targetZ - v.z);
      }
    }
  }

  // Realistic Pedestrians (Humans walking on the sidewalks and visiting shops/parks)
  private manageRealisticPedestrians() {
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
}
