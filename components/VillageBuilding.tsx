import React from 'react';
import { BuildingDefinition, PlayerBuilding } from '../types';

interface VillageBuildingProps {
  buildingDef: BuildingDefinition;
  playerBuilding?: PlayerBuilding;
  onClick: (type: BuildingDefinition['type']) => void;
}

const VillageBuilding: React.FC<VillageBuildingProps> = ({ buildingDef, playerBuilding, onClick }) => {
  const level = playerBuilding?.level || 0;
  const isUnderConstruction = playerBuilding?.isUnderConstruction || false;

  const getIcon = (type: BuildingDefinition['type']) => {
    switch (type) {
      case 'headquarters': return '🏛️';
      case 'woodcutter': return '🌲';
      case 'clay_pit': return '🧱';
      case 'iron_mine': return '⛏️';
      case 'farm': return '🌾';
      case 'warehouse': return '📦';
      case 'barracks': return '⚔️';
      case 'wall': return '🛡️';
      default: return '❓';
    }
  };

  return (
    <div
      onClick={() => onClick(buildingDef.type)}
      className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-200
        border-2 
        ${level > 0 ? 'border-amber-700 bg-stone-700 hover:bg-stone-600' : 'border-dashed border-stone-500 bg-stone-800 hover:bg-stone-700'}
        ${isUnderConstruction ? 'animate-pulse border-sky-500' : ''}
      `}
    >
      <span className="text-3xl md:text-4xl">{getIcon(buildingDef.type)}</span>
      <p className="text-xs sm:text-sm font-bold text-center mt-1 text-amber-100">{buildingDef.name}</p>
      <p className="text-xs text-stone-300">Úr. {level}</p>
      {isUnderConstruction && <p className="text-xs text-sky-400">Staví se...</p>}
    </div>
  );
};

export default VillageBuilding;
