export enum ResourceType {
  WOOD = 'wood',
  CLAY = 'clay',
  IRON = 'iron',
  FOOD = 'food',
}

export interface Resource {
  type: ResourceType;
  amount: number;
  productionRate: number; // per second
}

export enum BuildingType {
  HEADQUARTERS = 'headquarters',
  WOODCUTTER = 'woodcutter',
  CLAY_PIT = 'clay_pit',
  IRON_MINE = 'iron_mine',
  FARM = 'farm',
  WAREHOUSE = 'warehouse',
  BARRACKS = 'barracks',
  WALL = 'wall',
}

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  description: string;
  baseCost: Partial<Record<ResourceType, number>>;
  costMultiplier: number;
  buildTimeSeconds: number;
  productionBonus?: Partial<Record<ResourceType, number>>; // per second per level
  defenseBonus?: number; // per level
  populationBonus?: number; // per level
  storageBonus?: number; // per level
  buildTimeModifier?: number; // percentage reduction per level
  recruitTimeModifier?: number; // percentage reduction per level
  maxLevel: number;
}

export interface PlayerBuilding {
  type: BuildingType;
  level: number;
  isUnderConstruction: boolean;
  constructionEndTime?: number; // timestamp
}

export enum UnitType {
  SPEARMAN = 'spearman',
  SWORDSMAN = 'swordsman',
  AXEMAN = 'axeman',
  ARCHER = 'archer',
  SCOUT = 'scout',
  LIGHT_CAVALRY = 'light_cavalry',
}

export interface UnitDefinition {
  type: UnitType;
  name: string;
  attack: number;
  defenseInfantry: number;
  defenseCavalry: number;
  defenseArcher: number;
  speed: number;
  carryCapacity: number;
  populationCost: number;
  buildTimeSeconds: number;
  cost: Partial<Record<ResourceType, number>>;
}

export enum GameActionType {
  BUILDING_CONSTRUCTION = 'building_construction',
  UNIT_RECRUITMENT = 'unit_recruitment',
  ATTACK_PREPARATION = 'attack_preparation',
  AI_ADVICE = 'ai_advice',
}

export interface GameAction {
  id: string;
  type: GameActionType;
  startTime: number;
  endTime: number;
  details: any;
  message: string;
}

export interface AIAdvice {
  action: 'build' | 'upgrade' | 'recruit' | 'attack' | 'defend' | 'none';
  target?: BuildingType | UnitType | 'enemy' | 'self';
  reason: string;
  priority: number; // 1-5, 5 being highest
}

export interface GameState {
  resources: Record<ResourceType, number>;
  resourceCapacity: number;
  buildings: PlayerBuilding[];
  units: Record<UnitType, number>;
  population: {
    current: number;
    capacity: number;
  };
  currentActions: GameAction[];
  messages: string[];
  playerLevel: number;
  lastTickTime: number;
}