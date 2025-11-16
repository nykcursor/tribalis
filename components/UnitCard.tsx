import React, { useState, useMemo } from 'react';
import { UnitDefinition, UnitType, ResourceType } from '../types';

interface UnitCardProps {
  unitDef: UnitDefinition;
  playerResources: Record<ResourceType, number>;
  population: { current: number; capacity: number };
  onRecruit: (type: UnitType, amount: number) => void;
}

const UnitCard: React.FC<UnitCardProps> = ({ unitDef, playerResources, population, onRecruit }) => {
  const [amount, setAmount] = useState<string>('');

  const numAmount = parseInt(amount) || 0;
  const totalCost = useMemo(() => {
    const cost: Partial<Record<ResourceType, number>> = {};
    for (const resType in unitDef.cost) {
      const type = resType as ResourceType;
      cost[type] = (unitDef.cost[type] || 0) * numAmount;
    }
    return cost;
  }, [unitDef, numAmount]);

  const canAfford = useMemo(() => {
    if (numAmount <= 0) return false;
    for (const resType in totalCost) {
      const type = resType as ResourceType;
      if ((totalCost[type] || 0) > playerResources[type]) {
        return false;
      }
    }
    if (population.current + (unitDef.populationCost * numAmount) > population.capacity) {
        return false;
    }
    return true;
  }, [totalCost, playerResources, numAmount, population, unitDef.populationCost]);
  
  const handleMaxClick = () => {
      let maxAffordable = Infinity;
      for (const resType in unitDef.cost) {
          const type = resType as ResourceType;
          const costPerUnit = unitDef.cost[type] || 0;
          if (costPerUnit > 0) {
              maxAffordable = Math.min(maxAffordable, Math.floor(playerResources[type] / costPerUnit));
          }
      }
      const maxByPop = unitDef.populationCost > 0 ? Math.floor((population.capacity - population.current) / unitDef.populationCost) : Infinity;
      maxAffordable = Math.min(maxAffordable, maxByPop);
      
      setAmount(String(Math.max(0, maxAffordable)));
  }

  const handleRecruitClick = () => {
    if (canAfford && numAmount > 0) {
      onRecruit(unitDef.type, numAmount);
      setAmount('');
    }
  };

  return (
    <div className="bg-stone-800 border border-stone-900 rounded-lg shadow-md p-3 flex flex-col sm:flex-row justify-between items-center gap-3 text-stone-200">
      <div className="flex-1">
        <h4 className="text-md font-bold text-amber-100">{unitDef.name}</h4>
        <div className="text-xs text-stone-300 grid grid-cols-3 gap-x-2">
            <span>⚔️ {unitDef.attack}</span>
            <span>🛡️ {unitDef.defenseInfantry}</span>
            <span>🐴 {unitDef.defenseCavalry}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-16 p-1 rounded-md border border-stone-600 bg-stone-700 text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button onClick={handleMaxClick} className="text-xs bg-stone-600 hover:bg-stone-500 px-2 py-1 rounded-md">Max</button>
        <button
          onClick={handleRecruitClick}
          disabled={!canAfford}
          className={`px-3 py-1 rounded-md font-semibold transition-colors duration-200 text-sm
            ${!canAfford
              ? 'bg-stone-600 text-stone-400 cursor-not-allowed'
              : 'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500'
            }`}
        >
          Verbovat
        </button>
      </div>
    </div>
  );
};

export default UnitCard;
