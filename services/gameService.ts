
import {
  BuildingType,
  GameAction,
  GameActionType,
  GameState,
  PlayerBuilding,
  ResourceType,
  UnitType,
} from '../types';
import {
  ATTACK_SIMULATION_DURATION_SECONDS,
  BUILDING_DEFINITIONS,
  GAME_TICK_INTERVAL_MS,
  INITIAL_GAME_STATE,
  OPPONENT_POWER_VARIANCE,
  BASE_OPPONENT_POWER_DEFENSE,
  UNIT_DEFINITIONS,
  WORLD_SPEED,
} from '../constants';

export const getInitialGameState = (): GameState => {
  return JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
};

export const getInitialGameStateForUser = (villageName: string): GameState => {
  const initialState = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
  initialState.villageName = villageName;
  initialState.messages = [`Vítej ve své nové vesnici, ${villageName}! Stavěj moudře a veď svůj lid k vítězství.`];
  initialState.tutorialStep = 0; // Ensure tutorial starts at 0 for new users
  initialState.tutorialActive = true; // Activate tutorial for new users
  return initialState;
};

export const calculateCurrentProduction = (buildings: PlayerBuilding[]): Partial<Record<ResourceType, number>> => {
  // Base passive production for all resources (even without specific buildings)
  const production: Partial<Record<ResourceType, number>> = {
      [ResourceType.WOOD]: 0.5, // Base production per second
      [ResourceType.CLAY]: 0.5,
      [ResourceType.IRON]: 0.5,
      [ResourceType.FOOD]: 1.0, // Food might have a slightly higher baseline
  };

  for (const building of buildings) {
    if (building.isUnderConstruction) continue;

    const def = BUILDING_DEFINITIONS[building.type];
    if (def.productionFactor) {
      for (const resType in def.productionFactor) {
        const type = resType as ResourceType;
        // Each resource-producing building (Woodcutter, Clay Pit, Iron Mine, Farm)
        // adds to the total production of its respective resource.
        // The base rate for a level 1 building.
        const baseRatePerBuildingLevel1 = 0.5; // This could also be configurable in constants if needed
        const factor = def.productionFactor[type] || 1; // Default factor is 1 if not specified

        // Accumulate production: base rate for level 1 * (factor ^ (level - 1))
        // At level 1, this adds baseRatePerBuildingLevel1 * factor^0 = baseRatePerBuildingLevel1
        // At level 2, this adds baseRatePerBuildingLevel1 * factor^1
        production[type] = (production[type] || 0) + (baseRatePerBuildingLevel1 * Math.pow(factor, building.level - 1));
      }
    }
  }
  return production;
};

export const calculateResourceCapacity = (buildings: PlayerBuilding[]): number => {
    let capacity = INITIAL_GAME_STATE.resourceCapacity;
    const warehouse = buildings.find(b => b.type === BuildingType.WAREHOUSE && !b.isUnderConstruction);
    if (warehouse) {
        capacity += (BUILDING_DEFINITIONS[BuildingType.WAREHOUSE].storageBonus || 0) * warehouse.level;
    }
    return capacity;
}

export const calculatePopulationCapacity = (buildings: PlayerBuilding[]): number => {
    let capacity = INITIAL_GAME_STATE.population.capacity;
    const farms = buildings.filter(b => b.type === BuildingType.FARM && !b.isUnderConstruction);
    if (farms.length > 0) {
        const totalFarmLevel = farms.reduce((sum, farm) => sum + farm.level, 0);
        capacity += (BUILDING_DEFINITIONS[BuildingType.FARM].populationBonus || 0) * totalFarmLevel;
    }
    return capacity;
}


export const calculateArmyStats = (units: Record<UnitType, number>): { attack: number; defense: number } => {
  let totalAttack = 0;
  let totalDefense = 0;
  for (const unitType in units) {
    const type = unitType as UnitType;
    const count = units[type];
    if (count > 0) {
      const def = UNIT_DEFINITIONS[type];
      totalAttack += def.attack * count;
      totalDefense += ((def.defenseInfantry + def.defenseCavalry + def.defenseArcher) / 3) * count;
    }
  }
  return { attack: totalAttack, defense: totalDefense };
};

export const updateGameState = (prevState: GameState): GameState => {
  const now = Date.now();
  const timeElapsedSeconds = (now - prevState.lastTickTime) / 1000;
  let newState = { ...prevState, lastTickTime: now };

  const productionRates = calculateCurrentProduction(newState.buildings);
  for (const resType in productionRates) {
    const type = resType as ResourceType;
    const rate = productionRates[type] || 0;
    newState.resources[type] = Math.min(newState.resourceCapacity, newState.resources[type] + rate * timeElapsedSeconds * WORLD_SPEED);
  }

  const completedActions: GameAction[] = [];
  newState.currentActions = newState.currentActions.filter(action => {
    if (now >= action.endTime) {
      completedActions.push(action);
      return false;
    }
    return true;
  });

  let newMessages = [...newState.messages];

  for (const action of completedActions) {
    switch (action.type) {
      case GameActionType.BUILDING_CONSTRUCTION: {
        const { buildingType, level } = action.details;
        const buildingIndex = newState.buildings.findIndex(b => b.type === buildingType);
        if (buildingIndex > -1) {
          newState.buildings[buildingIndex] = { ...newState.buildings[buildingIndex], level, isUnderConstruction: false, constructionEndTime: undefined };
        } else {
          newState.buildings.push({ type: buildingType, level, isUnderConstruction: false });
        }
        newMessages.push(`${BUILDING_DEFINITIONS[buildingType].name} dokončeno na úroveň ${level}!`);
        newState.resourceCapacity = calculateResourceCapacity(newState.buildings);
        newState.population.capacity = calculatePopulationCapacity(newState.buildings);

        // Tutorial Step Progression for Building Construction
        if (newState.tutorialActive) {
          if (newState.tutorialStep === 2 && buildingType === BuildingType.HEADQUARTERS && level === 2) {
            newState.tutorialStep = 3; // HQ upgraded to L2, next step is build Woodcutter
            newMessages.push("Tutorial: Tvoje hlavní budova je dokončena! Nyní postavíme dřevorubce.");
          } else if (newState.tutorialStep === 4 && buildingType === BuildingType.WOODCUTTER && level === 1) {
            newState.tutorialStep = 5; // Woodcutter built to L1, next step is build Barracks
            newMessages.push("Tutorial: Dřevorubec je dokončen! Čas na kasárna.");
          } else if (newState.tutorialStep === 6 && buildingType === BuildingType.BARRACKS && level === 1) {
            newState.tutorialStep = 7; // Barracks built to L1, next step is open Recruit modal
            newMessages.push("Tutorial: Kasárna jsou dokončena! Nyní můžeš verbovat jednotky.");
          }
        }
        break;
      }
      case GameActionType.UNIT_RECRUITMENT: {
          const { unitType, amount } = action.details;
          newState.units[unitType] = (newState.units[unitType] || 0) + amount;
          newMessages.push(`Vyverbováno ${amount}x ${UNIT_DEFINITIONS[unitType].name}!`);

          // Tutorial Step Progression for Unit Recruitment
          if (newState.tutorialActive && newState.tutorialStep === 8 && unitType === UnitType.SPEARMAN && amount > 0) {
            newState.tutorialStep = 9; // Spearmen recruited, tutorial complete
            newMessages.push("Tutorial: Výborně! Vycvičil jsi své první jednotky. Teď jsi připraven prozkoumat svět!");
          }
          break;
      }
      case GameActionType.ATTACK_PREPARATION: {
        const { opponentPower } = action.details;
        const armyStats = calculateArmyStats(newState.units);
        const attackOutcome = simulateAttackOutcome(armyStats.attack, opponentPower);
        if (attackOutcome.success) {
          const lootGained = Math.floor(attackOutcome.loot);
          newMessages.push(`Útok úspěšný! Získal jsi ${lootGained} od každé suroviny.`);
          newState.resources[ResourceType.WOOD] = Math.min(newState.resourceCapacity, newState.resources[ResourceType.WOOD] + lootGained);
          newState.resources[ResourceType.CLAY] = Math.min(newState.resourceCapacity, newState.resources[ResourceType.CLAY] + lootGained);
          newState.resources[ResourceType.IRON] = Math.min(newState.resourceCapacity, newState.resources[ResourceType.IRON] + lootGained);
        } else {
          const losses = Math.floor(attackOutcome.losses);
          newMessages.push(`Útok selhal! Ztratil jsi ${losses}% jednotek.`);
          // Simple loss model: remove a fraction of all units
          for (const unitType in newState.units) {
              const type = unitType as UnitType;
              newState.units[type] = Math.floor(newState.units[type] * (1 - (losses/100)));
          }
          const currentPopulation = Object.values(newState.units).reduce((sum, count) => sum + count, 0); // Recalculate population
          newState.population = { ...newState.population, current: currentPopulation };
        }
        break;
      }
    }
  }
  newState.messages = newMessages.slice(-20);

  return newState;
};

export const startConstruction = (prevState: GameState, buildingType: BuildingType, isUpgrade: boolean): [GameState, string | null] => {
  const buildingDef = BUILDING_DEFINITIONS[buildingType];
  const existingBuilding = prevState.buildings.find(b => b.type === buildingType);
  const currentLevel = existingBuilding ? existingBuilding.level : 0;
  const targetLevel = currentLevel + 1;

  if (targetLevel > buildingDef.maxLevel) return [prevState, `${buildingDef.name} je na maximální úrovni.`];
  if (existingBuilding?.isUnderConstruction) return [prevState, `${buildingDef.name} se již staví.`];
  if (prevState.currentActions.some(a => a.type === GameActionType.BUILDING_CONSTRUCTION)) return [prevState, 'Již probíhá jiná stavba.'];

  // Tutorial restrictions
  if (prevState.tutorialActive) {
    if (prevState.tutorialStep === 0 && (buildingType !== BuildingType.HEADQUARTERS || targetLevel !== 2)) {
      return [prevState, 'Tutorial: Nejprve vylepši hlavní budovu na úroveň 2.'];
    }
    if (prevState.tutorialStep === 3 && (buildingType !== BuildingType.WOODCUTTER || targetLevel !== 1)) {
      return [prevState, 'Tutorial: Nyní postav dřevorubce.'];
    }
    if (prevState.tutorialStep === 5 && (buildingType !== BuildingType.BARRACKS || targetLevel !== 1)) {
      return [prevState, 'Tutorial: Nyní postav kasárna.'];
    }
  }


  const cost: Partial<Record<ResourceType, number>> = {};
  for (const resType in buildingDef.baseCost) {
    const type = resType as ResourceType;
    cost[type] = Math.round((buildingDef.baseCost[type] || 0) * Math.pow(buildingDef.costMultiplier, currentLevel));
  }

  for (const resType in cost) {
    const type = resType as ResourceType;
    if ((cost[type] || 0) > prevState.resources[type]) return [prevState, `Nedostatek surovin: ${type}.`];
  }

  const newResources = { ...prevState.resources };
  for (const resType in cost) {
    const type = resType as ResourceType;
    newResources[type] -= cost[type] || 0;
  }
  
  const hq = prevState.buildings.find(b => b.type === BuildingType.HEADQUARTERS);
  const hqModifier = hq ? 1 - (BUILDING_DEFINITIONS[BuildingType.HEADQUARTERS].buildTimeModifier || 0) * hq.level : 1;
  const buildTime = (buildingDef.buildTimeSeconds * 1000 * hqModifier) / WORLD_SPEED;

  const newBuildings = prevState.buildings.map(b => b.type === buildingType ? { ...b, isUnderConstruction: true, constructionEndTime: Date.now() + buildTime } : b);
  if (!existingBuilding) {
    newBuildings.push({ type: buildingType, level: 0, isUnderConstruction: true, constructionEndTime: Date.now() + buildTime });
  }

  const newAction: GameAction = {
    id: `build-${buildingType}-${targetLevel}-${Date.now()}`,
    type: GameActionType.BUILDING_CONSTRUCTION,
    startTime: Date.now(),
    endTime: Date.now() + buildTime,
    details: { buildingType, level: targetLevel },
    message: `${isUpgrade ? 'Vylepšuji' : 'Stavím'} ${buildingDef.name} na úroveň ${targetLevel}...`,
  };

  let newTutorialStep = prevState.tutorialStep;
  if (prevState.tutorialActive) {
    if (prevState.tutorialStep === 0 && buildingType === BuildingType.HEADQUARTERS && targetLevel === 2) {
      newTutorialStep = 1; // HQ upgrade started
    } else if (prevState.tutorialStep === 3 && buildingType === BuildingType.WOODCUTTER && targetLevel === 1) {
      newTutorialStep = 4; // Woodcutter build started
    } else if (prevState.tutorialStep === 5 && buildingType === BuildingType.BARRACKS && targetLevel === 1) {
      newTutorialStep = 6; // Barracks build started
    }
  }


  return [{ ...prevState, resources: newResources, buildings: newBuildings, currentActions: [...prevState.currentActions, newAction], messages: [...prevState.messages, newAction.message].slice(-20), tutorialStep: newTutorialStep }, null];
};

export const startRecruitment = (prevState: GameState, unitType: UnitType, amount: number): [GameState, string | null] => {
  if (amount <= 0) return [prevState, 'Zadej platný počet jednotek.'];
  const unitDef = UNIT_DEFINITIONS[unitType];
  const barracks = prevState.buildings.find(b => b.type === BuildingType.BARRACKS);
  if (!barracks || barracks.level === 0) return [prevState, 'Musíš postavit kasárna.'];

  // Tutorial restrictions
  if (prevState.tutorialActive) {
    if (prevState.tutorialStep === 7 && (unitType !== UnitType.SPEARMAN || amount <= 0)) { // Changed to check for amount > 0
      return [prevState, 'Tutorial: Nyní naverbuj alespoň jednoho kopiníka.'];
    }
  }

  const totalCost: Partial<Record<ResourceType, number>> = {};
  for(const resType in unitDef.cost) {
      const type = resType as ResourceType;
      totalCost[type] = (unitDef.cost[type] || 0) * amount;
  }

  for (const resType in totalCost) {
    const type = resType as ResourceType;
    if ((totalCost[type] || 0) > prevState.resources[type]) return [prevState, `Nedostatek surovin: ${type}.`];
  }

  const populationCost = unitDef.populationCost * amount;
  if (prevState.population.current + populationCost > prevState.population.capacity) {
      return [prevState, 'Nedostatek místa na farmě.'];
  }

  const newResources = { ...prevState.resources };
  for (const resType in totalCost) {
    const type = resType as ResourceType;
    newResources[type] -= totalCost[type] || 0;
  }

  const barracksModifier = 1 - (BUILDING_DEFINITIONS[BuildingType.BARRACKS].recruitTimeModifier || 0) * barracks.level;
  const recruitTime = (unitDef.buildTimeSeconds * amount * 1000 * barracksModifier) / WORLD_SPEED;
  const lastRecruitAction = prevState.currentActions.filter(a => a.type === GameActionType.UNIT_RECRUITMENT).sort((a,b) => b.endTime - a.endTime)[0];
  const startTime = lastRecruitAction ? lastRecruitAction.endTime : Date.now();

  const newAction: GameAction = {
    id: `recruit-${unitType}-${amount}-${Date.now()}`,
    type: GameActionType.UNIT_RECRUITMENT,
    startTime: startTime,
    endTime: startTime + recruitTime,
    details: { unitType, amount },
    message: `Verbuji ${amount}x ${unitDef.name}...`,
  };
  
  const newPopulation = { ...prevState.population, current: prevState.population.current + populationCost };

  let newTutorialStep = prevState.tutorialStep;
  if (prevState.tutorialActive && prevState.tutorialStep === 7 && unitType === UnitType.SPEARMAN && amount > 0) {
    newTutorialStep = 8; // Spearmen recruitment started
  }

  return [{ ...prevState, resources: newResources, population: newPopulation, currentActions: [...prevState.currentActions, newAction], messages: [...prevState.messages, newAction.message].slice(-20), tutorialStep: newTutorialStep }, null];
};


export const startAttack = (prevState: GameState): [GameState, string | null] => {
  if (prevState.currentActions.some(a => a.type === GameActionType.ATTACK_PREPARATION)) return [prevState, 'Útok již probíhá.'];
  const armyStats = calculateArmyStats(prevState.units);
  if (armyStats.attack <= 0) return [prevState, 'Nemáš žádné útočné jednotky!'];

  // Tutorial restriction
  if (prevState.tutorialActive && prevState.tutorialStep < 9) { // Disallow attack during tutorial
    return [prevState, 'Tutorial: Útok je během tutoriálu zakázán.'];
  }

  const opponentPower = BASE_OPPONENT_POWER_DEFENSE + Math.floor(Math.random() * OPPONENT_POWER_VARIANCE * 2) - OPPONENT_POWER_VARIANCE;

  const newAction: GameAction = {
    id: `attack-${Date.now()}`,
    type: GameActionType.ATTACK_PREPARATION,
    startTime: Date.now(),
    endTime: Date.now() + (ATTACK_SIMULATION_DURATION_SECONDS * 1000) / WORLD_SPEED,
    details: { opponentPower },
    message: `Probíhá útok na soupeře (Síla: ${opponentPower})...`,
  };

  return [{ ...prevState, currentActions: [...prevState.currentActions, newAction], messages: [...prevState.messages, newAction.message].slice(-20) }, null];
};

interface AttackOutcome { success: boolean; loot: number; losses: number; }

const simulateAttackOutcome = (playerAttack: number, opponentDefense: number): AttackOutcome => {
  const attackRatio = playerAttack / opponentDefense;
  if (attackRatio > 1.2) { // Strong win
    const loot = opponentDefense * 0.5;
    const losses = 10; // 10% losses
    return { success: true, loot, losses };
  } else if (attackRatio > 0.8) { // Pyrrhic victory
    const loot = opponentDefense * 0.25;
    const losses = 40; // 40% losses
    return { success: true, loot, losses };
  } else { // Loss
    const loot = 0;
    const losses = 80; // 80% losses
    return { success: false, loot, losses };
  }
};