
import React, { useMemo } from 'react';
import { BuildingDefinition, BuildingType, PlayerBuilding, ResourceType } from '../types';
import { INITIAL_GAME_STATE, WORLD_SPEED } from '../constants';

interface BuildingCardProps {
  buildingDef: BuildingDefinition;
  playerBuilding?: PlayerBuilding;
  playerResources: Record<ResourceType, number>;
  onBuildOrUpgrade: (type: BuildingType, isUpgrade: boolean) => void;
  isBuildingActionActive: boolean;
  tutorialHighlightId?: string | null; // New prop for tutorial highlighting
}

const BuildingCard: React.FC<BuildingCardProps> = ({
  buildingDef,
  playerBuilding,
  playerResources,
  onBuildOrUpgrade,
  isBuildingActionActive,
  tutorialHighlightId,
}) => {
  const currentLevel = playerBuilding?.level || 0;
  const isMaxLevel = currentLevel >= buildingDef.maxLevel;
  const isUnderConstruction = playerBuilding?.isUnderConstruction || false;

  const cost = useMemo(() => {
    const calculatedCost: Partial<Record<ResourceType, number>> = {};
    for (const resType in buildingDef.baseCost) {
      const type = resType as ResourceType;
      calculatedCost[type] = Math.round((buildingDef.baseCost[type] || 0) * Math.pow(buildingDef.costMultiplier, currentLevel));
    }
    return calculatedCost;
  }, [buildingDef, currentLevel]);

  const canAfford = useMemo(() => {
    for (const resType in cost) {
      const type = resType as ResourceType;
      if ((cost[type] || 0) > playerResources[type]) {
        return false;
      }
    }
    return true;
  }, [cost, playerResources]);

  const nextLevelBonusText = useMemo(() => {
    const nextLevel = currentLevel + 1;
    if (isMaxLevel) return null;

    const { productionFactor, storageBonus, populationBonus, buildTimeModifier, recruitTimeModifier, defenseBonus } = buildingDef;

    if (productionFactor) {
      const resType = Object.keys(productionFactor)[0] as ResourceType;
      const factor = productionFactor[resType]!;
      const baseRate = 0.5; // From gameService
      const currentLevelProduction = currentLevel > 0 ? baseRate * Math.pow(factor, currentLevel - 1) : 0;
      const nextLevelProduction = baseRate * Math.pow(factor, nextLevel - 1);
      const increase = (nextLevelProduction - currentLevelProduction) * 3600 * WORLD_SPEED;
      return `Produkce: +${increase.toFixed(0)}/h`;
    }
    if (storageBonus) {
      return `Kapacita: +${storageBonus}`;
    }
    if (populationBonus) {
       return `Populace: +${populationBonus}`;
    }
    if (buildTimeModifier) {
        const currentBonusPercent = currentLevel > 0 ? (1 - Math.pow(1 - buildTimeModifier, currentLevel)) * 100 : 0;
        const nextBonusPercent = (1 - Math.pow(1 - buildTimeModifier, nextLevel)) * 100;
        return `Rychlost stavby: ${currentBonusPercent.toFixed(1)}% -> ${nextBonusPercent.toFixed(1)}%`;
    }
    if (recruitTimeModifier) {
        const nextBonusPercent = (1 - Math.pow(1 - recruitTimeModifier, nextLevel)) * 100;
        return `Rychlost verbování na úr. ${nextLevel}: ${nextBonusPercent.toFixed(1)}%`;
    }
    if (defenseBonus) {
        return `Bonus obrany: +${defenseBonus}`;
    }
    return null;
  }, [buildingDef, currentLevel, isMaxLevel]);

  const buttonText = currentLevel === 0 ? 'Postavit' : 'Vylepšit';
  const buttonDisabled = isMaxLevel || isUnderConstruction || !canAfford || isBuildingActionActive;

  const isUpgradeButtonHighlighted = tutorialHighlightId === `upgrade-button-${buildingDef.type}`;
  const isBuildButtonHighlighted = tutorialHighlightId === `build-button-${buildingDef.type}`;

  return (
    <div className="bg-stone-800 border border-stone-900 rounded-lg shadow-md p-4 flex flex-col justify-between h-full text-stone-200">
      <div>
        <h3 className="text-lg md:text-xl font-bold text-amber-100 mb-2">{buildingDef.name}</h3>
        <p className="text-sm text-stone-300 mb-3">{buildingDef.description}</p>
        <p className="text-base text-stone-100 mb-1">Úroveň: {currentLevel} / {buildingDef.maxLevel}</p>
        {isUnderConstruction && (
          <p className="text-sky-400 font-semibold mb-2">Staví se...</p>
        )}
        {!isMaxLevel && !isUnderConstruction && (
          <>
            <div className="mb-3">
              <p className="text-stone-100 text-sm md:text-base mb-1">Cena za úroveň {currentLevel + 1}:</p>
              <div className="grid grid-cols-2 gap-x-4 text-stone-300 text-xs md:text-sm">
                {Object.entries(cost).map(([resType, amount]) => (
                  <div key={resType} className={`flex justify-between ${playerResources[resType as ResourceType] < amount ? 'text-red-400' : ''}`}>
                    <span>{resType.charAt(0).toUpperCase() + resType.slice(1)}:</span>
                    <span>{amount}</span>
                  </div>
                ))}
              </div>
            </div>
            {nextLevelBonusText && (
              <div className="bg-stone-900 p-2 rounded-md mb-3">
                 <p className="text-sm text-sky-300 font-semibold">{nextLevelBonusText}</p>
              </div>
            )}
          </>
        )}
      </div>
      <button
        onClick={() => onBuildOrUpgrade(buildingDef.type, currentLevel > 0)}
        disabled={buttonDisabled}
        data-tutorial-id={currentLevel === 0 ? `build-button-${buildingDef.type}` : `upgrade-button-${buildingDef.type}`} // Tutorial ID for targeting
        className={`w-full mt-2 py-2 px-4 rounded-md font-semibold transition-colors duration-200
          ${buttonDisabled
            ? 'bg-stone-600 text-stone-400 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
          }
          ${isUpgradeButtonHighlighted || isBuildButtonHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-stone-900 z-45' : ''}
          `}
      >
        {isMaxLevel ? 'Max. úroveň' : isUnderConstruction ? 'Staví se...' : isBuildingActionActive ? 'Fronta je plná' : buttonText}
      </button>
    </div>
  );
};

export default BuildingCard;