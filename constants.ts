
import { BuildingType, ResourceType, PlayerBuilding, GameState, BuildingDefinition, UnitType, UnitDefinition } from './types';

export const WORLD_SPEED = 10; // Zrychluje produkci, stavbu a verbování
export const PROD_SPEED = 4; // Rychlost produkce
export const TROP_SPEED = 2; // Rychlost pohybu jednotek


export const INITIAL_RESOURCES: Record<ResourceType, number> = {
  [ResourceType.WOOD]: 150,
  [ResourceType.CLAY]: 150,
  [ResourceType.IRON]: 150,
  [ResourceType.FOOD]: 200,
};

export const INITIAL_PLAYER_BUILDINGS: PlayerBuilding[] = [
  { type: BuildingType.HEADQUARTERS, level: 1, isUnderConstruction: false },
];

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  [BuildingType.HEADQUARTERS]: {
    type: BuildingType.HEADQUARTERS,
    name: 'Hlavní budova',
    description: 'Zrychluje stavbu ostatních budov. Čím vyšší úroveň, tím rychleji stavíš.',
    baseCost: { [ResourceType.WOOD]: 200, [ResourceType.CLAY]: 180, [ResourceType.IRON]: 170 },
    costMultiplier: 1.25,
    buildTimeSeconds: 60,
    buildTimeModifier: 0.05, // 5% reduction per level
    maxLevel: 20,
  },
  [BuildingType.WOODCUTTER]: {
    type: BuildingType.WOODCUTTER,
    name: 'Dřevorubec',
    description: 'Těží dřevo.',
    baseCost: { [ResourceType.WOOD]: 60, [ResourceType.CLAY]: 50, [ResourceType.IRON]: 40 },
    costMultiplier: 1.2,
    buildTimeSeconds: 45,
    productionFactor: { [ResourceType.WOOD]: 1.15 }, // Exponential growth factor
    maxLevel: 30,
  },
  [BuildingType.CLAY_PIT]: {
    type: BuildingType.CLAY_PIT,
    name: 'Hliniště',
    description: 'Těží jíl.',
    baseCost: { [ResourceType.WOOD]: 50, [ResourceType.CLAY]: 60, [ResourceType.IRON]: 40 },
    costMultiplier: 1.2,
    buildTimeSeconds: 45,
    productionFactor: { [ResourceType.CLAY]: 1.15 },
    maxLevel: 30,
  },
  [BuildingType.IRON_MINE]: {
    type: BuildingType.IRON_MINE,
    name: 'Železný důl',
    description: 'Těží železo.',
    baseCost: { [ResourceType.WOOD]: 70, [ResourceType.CLAY]: 80, [ResourceType.IRON]: 90 },
    costMultiplier: 1.22,
    buildTimeSeconds: 55,
    productionFactor: { [ResourceType.IRON]: 1.15 },
    maxLevel: 30,
  },
   [BuildingType.FARM]: {
    type: BuildingType.FARM,
    name: 'Farma',
    description: 'Produkuje jídlo a zvyšuje maximální populaci.',
    baseCost: { [ResourceType.WOOD]: 45, [ResourceType.CLAY]: 40, [ResourceType.IRON]: 30 },
    costMultiplier: 1.18,
    buildTimeSeconds: 40,
    productionFactor: { [ResourceType.FOOD]: 1.15 }, // Base food production for exponential scaling
    populationBonus: 20, // +20 population capacity per level
    maxLevel: 30,
  },
   [BuildingType.WAREHOUSE]: {
    type: BuildingType.WAREHOUSE,
    name: 'Skladiště',
    description: 'Zvyšuje kapacitu surovin.',
    baseCost: { [ResourceType.WOOD]: 100, [ResourceType.CLAY]: 100, [ResourceType.IRON]: 100 },
    costMultiplier: 1.3,
    buildTimeSeconds: 80,
    storageBonus: 1000, // +1000 capacity per level
    maxLevel: 20,
  },
  [BuildingType.BARRACKS]: {
    type: BuildingType.BARRACKS,
    name: 'Kasárna',
    description: 'Trénuje vojenské jednotky.',
    baseCost: { [ResourceType.WOOD]: 200, [ResourceType.CLAY]: 170, [ResourceType.IRON]: 250 },
    costMultiplier: 1.4,
    buildTimeSeconds: 120,
    recruitTimeModifier: 0.05, // 5% reduction per level
    maxLevel: 15,
  },
  [BuildingType.WALL]: {
    type: BuildingType.WALL,
    name: 'Hradby',
    description: 'Zvyšuje základní obranu vesnice.',
    baseCost: { [ResourceType.WOOD]: 50, [ResourceType.CLAY]: 250, [ResourceType.IRON]: 100 },
    costMultiplier: 1.6,
    buildTimeSeconds: 180,
    defenseBonus: 10,
    maxLevel: 20,
  },
};

export const UNIT_DEFINITIONS: Record<UnitType, UnitDefinition> = {
    [UnitType.SPEARMAN]: {
        type: UnitType.SPEARMAN, name: 'Kopiník',
        attack: 10, defenseInfantry: 15, defenseCavalry: 45, defenseArcher: 20,
        speed: 18, carryCapacity: 25, populationCost: 1, buildTimeSeconds: 60,
        cost: { [ResourceType.WOOD]: 50, [ResourceType.CLAY]: 30, [ResourceType.IRON]: 10 }
    },
    [UnitType.SWORDSMAN]: {
        type: UnitType.SWORDSMAN, name: 'Šermíř',
        attack: 25, defenseInfantry: 50, defenseCavalry: 20, defenseArcher: 40,
        speed: 22, carryCapacity: 15, populationCost: 1, buildTimeSeconds: 75,
        cost: { [ResourceType.WOOD]: 30, [ResourceType.CLAY]: 30, [ResourceType.IRON]: 70 }
    },
    [UnitType.AXEMAN]: {
        type: UnitType.AXEMAN, name: 'Sekerník',
        attack: 40, defenseInfantry: 10, defenseCavalry: 5, defenseArcher: 10,
        speed: 18, carryCapacity: 10, populationCost: 1, buildTimeSeconds: 80,
        cost: { [ResourceType.WOOD]: 60, [ResourceType.CLAY]: 30, [ResourceType.IRON]: 40 }
    },
    [UnitType.ARCHER]: {
        type: UnitType.ARCHER, name: 'Lučištník',
        attack: 15, defenseInfantry: 50, defenseCavalry: 40, defenseArcher: 5,
        speed: 18, carryCapacity: 10, populationCost: 1, buildTimeSeconds: 90,
        cost: { [ResourceType.WOOD]: 100, [ResourceType.CLAY]: 30, [ResourceType.IRON]: 60 }
    },
    [UnitType.SCOUT]: {
        type: UnitType.SCOUT, name: 'Průzkumník',
        attack: 0, defenseInfantry: 2, defenseCavalry: 1, defenseArcher: 2,
        speed: 9, carryCapacity: 0, populationCost: 1, buildTimeSeconds: 50,
        cost: { [ResourceType.WOOD]: 50, [ResourceType.CLAY]: 50, [ResourceType.IRON]: 20 }
    },
    [UnitType.LIGHT_CAVALRY]: {
        type: UnitType.LIGHT_CAVALRY, name: 'Lehká kavalérie',
        attack: 130, defenseInfantry: 30, defenseCavalry: 40, defenseArcher: 30,
        speed: 10, carryCapacity: 80, populationCost: 4, buildTimeSeconds: 180,
        cost: { [ResourceType.WOOD]: 125, [ResourceType.CLAY]: 100, [ResourceType.IRON]: 250 }
    }
};


export const GAME_TICK_INTERVAL_MS = 1000;

export const INITIAL_GAME_STATE: GameState = {
  villageName: 'Nová Vesnice', // Default village name
  resources: { ...INITIAL_RESOURCES },
  resourceCapacity: 1000,
  buildings: [...INITIAL_PLAYER_BUILDINGS],
  units: {
    [UnitType.SPEARMAN]: 0,
    [UnitType.SWORDSMAN]: 0,
    [UnitType.AXEMAN]: 0,
    [UnitType.ARCHER]: 0,
    [UnitType.SCOUT]: 0,
    [UnitType.LIGHT_CAVALRY]: 0,
  },
  population: {
    current: 0,
    capacity: 240,
  },
  currentActions: [],
  messages: ["Vítej ve své nové vesnici! Stavěj moudře a veď svůj lid k vítězství."],
  playerLevel: 1,
  lastTickTime: Date.now(),
  tutorialStep: 0, // Initialize tutorial step for new players
  tutorialActive: true, // Tutorial is active for new players
};

export const AI_ADVISOR_SYSTEM_INSTRUCTION = `You are a strategic advisor for a mobile real-time strategy game. Your goal is to provide concise and actionable advice to the player based on their current game state. Focus on resource management, building priorities, unit recruitment, and strategic moves (attack/defend). Respond with a JSON object.`;

export const ATTACK_SIMULATION_DURATION_SECONDS = 120;
export const BASE_OPPONENT_POWER_DEFENSE = 50;
export const OPPONENT_POWER_VARIANCE = 30;