
import React from 'react';
import { BuildingDefinition, PlayerBuilding, BuildingType } from '../types';

interface VillageBuildingProps {
  buildingDef: BuildingDefinition;
  playerBuilding?: PlayerBuilding;
  onClick: (type: BuildingDefinition['type']) => void;
  tutorialHighlightId?: string | null; // New prop for tutorial highlighting
}

const VillageBuilding: React.FC<VillageBuildingProps> = ({ buildingDef, playerBuilding, onClick, tutorialHighlightId }) => {
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

  const getBuildingTheme = (type: BuildingType) => {
    switch (type) {
      case BuildingType.HEADQUARTERS: return 'bg-gradient-to-br from-amber-700 to-amber-900 border-amber-600';
      case BuildingType.WOODCUTTER: return 'bg-gradient-to-br from-lime-700 to-green-900 border-green-700';
      case BuildingType.CLAY_PIT: return 'bg-gradient-to-br from-red-800 to-orange-900 border-red-700';
      case BuildingType.IRON_MINE: return 'bg-gradient-to-br from-gray-700 to-gray-900 border-gray-600';
      case BuildingType.FARM: return 'bg-gradient-to-br from-yellow-600 to-orange-700 border-yellow-700';
      case BuildingType.WAREHOUSE: return 'bg-gradient-to-br from-stone-600 to-stone-800 border-stone-500';
      case BuildingType.BARRACKS: return 'bg-gradient-to-br from-red-900 to-red-950 border-red-800';
      case BuildingType.WALL: return 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600';
      default: return 'bg-gradient-to-br from-stone-700 to-stone-800 border-stone-600';
    }
  };

  const isHighlighted = tutorialHighlightId === `building-${buildingDef.type}`;

  return (
    <div
      onClick={() => onClick(buildingDef.type)}
      data-tutorial-id={`building-${buildingDef.type}`} // Tutorial ID for targeting
      className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-200 group relative h-full
        border-2
        ${level > 0 ? getBuildingTheme(buildingDef.type) : 'border-dashed border-stone-500 bg-stone-800 hover:bg-stone-700'}
        ${isUnderConstruction ? 'animate-pulse border-sky-500' : ''}
        shadow-md hover:shadow-lg transform hover:scale-105
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-stone-900 z-45' : ''}
      `}
    >
      <span className="text-4xl md:text-5xl mb-1">{getIcon(buildingDef.type)}</span>
      <p className="text-xs sm:text-sm font-bold text-center mt-1 text-amber-100 group-hover:text-white transition-colors duration-200">{buildingDef.name}</p>
      <p className="text-xs text-stone-300">Úr. {level}</p>
      {isUnderConstruction && (
        <span className="absolute top-1 right-1 bg-sky-600 text-white text-[0.6rem] px-1 py-0.5 rounded-full z-10">
          🛠️
        </span>
      )}
    </div>
  );
};

export default VillageBuilding;
