export type ZoneType = 'residential' | 'commercial' | 'industrial' | 'office';

export type RoadType = 'two_lane' | 'avenue' | 'highway';

export type DirectBuildingType =
  | 'home_suburban'
  | 'apartment_tower'
  | 'corner_store'
  | 'commercial_center'
  | 'clean_factory'
  | 'tech_office';

export type ServiceType = 
  | 'wind_turbine'
  | 'solar_farm'
  | 'coal_plant'
  | 'water_tower'
  | 'sewage_plant'
  | 'clinic'
  | 'hospital'
  | 'fire_station'
  | 'police_station'
  | 'elementary_school'
  | 'university'
  | 'small_park'
  | 'large_park'
  | 'stadium'
  | 'parking_lot'
  | 'bus_station'
  | 'forest';

export type ToolCategory = 'inspect' | 'roads' | 'zones' | 'buildings' | 'utilities' | 'services' | 'bulldoze';

export type ActiveTool = 
  | { category: 'inspect' }
  | { category: 'bulldoze' }
  | { category: 'roads'; roadType: RoadType }
  | { category: 'zones'; zoneType: ZoneType | 'dezone' }
  | { category: 'buildings'; buildingType: DirectBuildingType; zone: ZoneType; level: number }
  | { category: 'utilities'; serviceType: 'wind_turbine' | 'solar_farm' | 'coal_plant' | 'water_tower' | 'sewage_plant' }
  | { category: 'services'; serviceType: 'clinic' | 'hospital' | 'fire_station' | 'police_station' | 'elementary_school' | 'university' | 'small_park' | 'large_park' | 'stadium' | 'parking_lot' | 'bus_station' | 'forest' };

export type OverlayMode = 'none' | 'electricity' | 'water' | 'land_value' | 'pollution' | 'traffic';

export interface RoadData {
  type: RoadType;
  connections: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  trafficDensity: number; // 0 to 1
  hasTrafficLight?: boolean;
  congestionLevel?: number;
  isHighwayGateway?: boolean; // Regional external highway connection
  gatewayDirection?: 'inbound' | 'outbound' | 'bidirectional';
}

export interface BuildingData {
  id: string;
  name: string;
  zone: ZoneType;
  level: number; // 1 to 5
  residents: number;
  maxResidents: number;
  workers: number;
  maxWorkers: number;
  landValue: number; // 0 to 100
  happiness: number; // 0 to 100
  hasPower: boolean;
  hasWater: boolean;
  fireRisk: number; // 0 to 100
  onFire: boolean;
  isAbandoned: boolean;
  abandonedTimer: number; // seconds without power/water
  constructionProgress: number; // 0 to 1 (1 = fully built)
  styleSeed: number;
  height: number;
  taxIncome: number;
  ownedCarIds?: string[];
  rotation?: number; // 0, PI/2, PI, 3PI/2 radians
}

export interface ServiceData {
  id: string;
  type: ServiceType;
  name: string;
  maintenanceCost: number;
  powerOutput?: number; // MW
  waterOutput?: number; // m3/day
  coverageRadius: number;
  effectValue: number;
  styleSeed: number;
  rotation?: number;
}

export interface CellData {
  x: number;
  z: number;
  terrain: 'grass' | 'water' | 'sand' | 'mountain';
  elevation: number;
  road: RoadData | null;
  zone: ZoneType | null;
  building: BuildingData | null;
  service: ServiceData | null;
  hasPower: boolean;
  hasWater: boolean;
  pollution: number; // 0 to 100
  landValue: number; // 0 to 100
  fireCoverage: boolean;
  policeCoverage: boolean;
  healthCoverage: boolean;
  educationCoverage: boolean;
}

export type VehicleTripState =
  | 'commuting_work'
  | 'shopping'
  | 'returning_home'
  | 'highway_entry'
  | 'highway_exit'
  | 'roaming';

export interface Vehicle {
  id: string;
  type: 'car' | 'taxi' | 'bus' | 'truck' | 'firetruck';
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  rotation: number;
  speed: number;
  progress: number;
  color: string;
  state: VehicleTripState;
  homeCell?: { x: number; z: number };
  destCell?: { x: number; z: number };
  route?: [number, number][];
  routeIndex?: number;
  isBlocked?: boolean;
  blockedTimer?: number;
  dwellTimer?: number;
  isParked?: boolean;
  parkingLotCell?: { x: number; z: number; stallIndex?: number };
  lastTile?: [number, number];
  laneOffset: number; // Right-hand side lane offset (-0.18 or +0.18)
}

export interface Pedestrian {
  id: string;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  rotation: number;
  speed: number;
  progress: number;
  shirtColor: string;
  sidewalkSide: number; // offset on the sidewalk (-0.36 or +0.36)
  state: 'strolling' | 'going_to_work' | 'going_shopping' | 'heading_home';
  dwellTimer?: number;
  homeCell?: { x: number; z: number };
  destCell?: { x: number; z: number };
  route?: [number, number][];
  routeIndex?: number;
}

export interface ChirpMessage {
  id: string;
  author: string;
  handle: string;
  avatarEmoji: string;
  text: string;
  type: 'happy' | 'concern' | 'news' | 'warning';
  timestamp: string;
}

export interface CityBudget {
  treasury: number;
  incomePerWeek: number;
  expensesPerWeek: number;
  taxRateResidential: number; // e.g. 10%
  taxRateCommercial: number;
  taxRateIndustrial: number;
  taxRateOffice: number;
}

export interface CityDemands {
  residential: number; // 0 to 100
  commercial: number;  // 0 to 100
  industrial: number;  // 0 to 100
  office: number;      // 0 to 100
  education: number;   // 0 to 100
  fire: number;        // 0 to 100
  health: number;      // 0 to 100
  entertainment: number; // 0 to 100
  parks: number;       // 0 to 100
}

export interface Milestone {
  id: string;
  name: string;
  populationRequired: number;
  achieved: boolean;
  rewardMoney: number;
  description: string;
  unlockedFeatures: string[];
}

export interface LeavingFactor {
  id: string;
  name: string;
  category: 'power' | 'water' | 'jobs' | 'taxes' | 'pollution' | 'services' | 'housing';
  status: 'optimal' | 'warning' | 'critical';
  impactCount: number; // estimated citizens leaving or distressed
  description: string;
  remedyAction: string;
}

export interface CityStats {
  population: number;
  jobs: number;
  employed: number;
  unemploymentRate: number;
  cityHappiness: number; // 0 to 100
  powerProduction: number;
  powerConsumption: number;
  waterProduction: number;
  waterConsumption: number;
  dayTime: number; // 0 to 24 hours
  simulationSpeed: number; // 0 = pause, 1 = normal, 2 = fast, 3 = hyper
  week: number;
  year: number;
  totalCarsOnRoad: number;
  highwayCommuters: number;

  // Algorithmic Education System
  educationLevel: number; // 0 to 100
  uneducatedRate: number; // % (0-100)
  highSchoolRate: number; // % (0-100)
  universityRate: number; // % (0-100)
  schoolCapacity: number;
  studentsEnrolled: number;

  // Algorithmic Earning & Economic System
  averageIncome: number; // $ weekly wage per employed citizen
  totalWagesPaid: number; // $ total wages flowing into city economy
  povertyRate: number; // % (0-100)
  commercialTurnover: number; // $ resident spending at shops

  // City Capacities & Sector Inflow
  housingCapacity: number; // total resident beds across all residential buildings
  housingOccupancy: number; // % occupancy
  commercialCapacity: number; // worker slots in commercial
  commercialEmployees: number; // active commercial workers
  commercialShoppers: number; // shoppers visiting commercial daily
  industrialCapacity: number; // worker slots in factories
  industrialEmployees: number; // active factory workers
  officeCapacity: number; // desk slots in office towers
  officeEmployees: number; // active office workers

  // Migration & Demographics Flow
  netMigration: number; // weekly change in population
  citizenInflow: number; // new arrivals this week
  citizenOutflow: number; // departed citizens this week

  // Abandonment & Grid Outages
  abandonedBuildings: number;
  unpoweredBuildings: number;
  unwateredBuildings: number;

  // Citizen Needs Satisfaction Scores (0 to 100%)
  needsPower: number; // % reliable power
  needsWater: number; // % reliable water
  needsHealth: number; // % healthcare access
  needsEducation: number; // % educational access
  needsSafety: number; // % police & fire safety
  needsJobs: number; // % employment fulfillment
  needsTaxSatisfaction: number; // % satisfaction with tax rate
  needsEnvironment: number; // % clean air & low pollution
}

export interface CityHistorySnapshot {
  week: number;
  year: number;
  population: number;
  employed: number;
  jobs: number;
  unemploymentRate: number;
  averageIncome: number;
  educationLevel: number;
  uneducatedRate: number;
  highSchoolRate: number;
  universityRate: number;
  cityHappiness: number;
  demandResidential: number;
  demandCommercial: number;
  demandIndustrial: number;
  demandOffice: number;
  demandEducation?: number;
  demandFire?: number;
  demandHealth?: number;
  demandEntertainment?: number;
  demandParks?: number;
  treasury: number;
  weeklyIncome: number;
  weeklyExpenses: number;
  housingCapacity?: number;
  commercialCapacity?: number;
  industrialCapacity?: number;
  powerProduction?: number;
  powerConsumption?: number;
  waterProduction?: number;
  waterConsumption?: number;
  citizenInflow?: number;
  citizenOutflow?: number;
}
