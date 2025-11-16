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
      case BuildingType.HEADQUARTERS: return 'bg-gradient-to-br from-amber-600 to-yellow-800 border-amber-500 shadow-amber-900/50';
      case BuildingType.WOODCUTTER: return 'bg-gradient-to-br from-green-700 to-lime-900 border-green-600 shadow-green-900/50';
      case BuildingType.CLAY_PIT: return 'bg-gradient-to-br from-orange-700 to-red-900 border-orange-600 shadow-red-900/50';
      case BuildingType.IRON_MINE: return 'bg-gradient-to-br from-gray-600 to-slate-800 border-gray-500 shadow-slate-900/50';
      case BuildingType.FARM: return 'bg-gradient-to-br from-yellow-500 to-orange-600 border-yellow-400 shadow-orange-900/50';
      case BuildingType.WAREHOUSE: return 'bg-gradient-to-br from-stone-500 to-stone-700 border-stone-400 shadow-stone-900/50';
      case BuildingType.BARRACKS: return 'bg-gradient-to-br from-red-800 to-rose-900 border-red-700 shadow-rose-900/50';
      case BuildingType.WALL: return 'bg-gradient-to-br from-slate-600 to-gray-800 border-slate-500 shadow-gray-900/50';
      default: return 'bg-gradient-to-br from-stone-600 to-stone-700 border-stone-500 shadow-stone-900/50';
    }
  };

  const isHighlighted = tutorialHighlightId === `building-${buildingDef.type}`;

  const levelStyle: React.CSSProperties = {};
  if (level > 0) {
    const levelRatio = level / buildingDef.maxLevel;
    const brightness = 1 + levelRatio * 0.6; // More pronounced brightness increase (up to 160%)
    const saturation = 1 + levelRatio * 0.5; // Added saturation
    const glowStrength = levelRatio * 10 + 5; // Glow radius from 5px to 15px
    const glowOpacity = 0.2 + levelRatio * 0.6; // Glow opacity from 20% to 80%
    const scale = 1 + levelRatio * 0.02; // Subtle scale up to 102%

    levelStyle.filter = `brightness(${brightness}) saturate(${saturation})`;
    levelStyle.boxShadow = `0 0 ${glowStrength}px rgba(255, 220, 150, ${glowOpacity})`; // Golden glow
    levelStyle.transform = `scale(${scale})`; // Add subtle scale
  }

  return (
    <button
      onClick={() => onClick(buildingDef.type)}
      data-tutorial-id={`building-${buildingDef.type}`} // Tutorial ID for targeting
      style={levelStyle}
      className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-300 group relative h-full w-full
        border-2
        ${level > 0 ? getBuildingTheme(buildingDef.type) + ' animate-float-subtle' : 'border-dashed border-stone-500 bg-stone-800 hover:bg-stone-700'}
        ${isUnderConstruction ? 'animate-pulse-light border-sky-400 shadow-sky-600/50' : ''} /* Enhanced pulse and color */
        shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 /* Lift and scale on hover */
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-stone-900 z-45' : ''}
        focus:outline-none focus:ring-4 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-stone-900 /* Accessibility focus */
      `}
      aria-label={`${buildingDef.name}, Úroveň ${level}`}
    >
      <span className="text-4xl md:text-5xl mb-1 filter drop-shadow-md">{getIcon(buildingDef.type)}</span> {/* Icon shadow */}
      <p className="text-xs sm:text-sm font-bold text-center mt-1 text-amber-100 group-hover:text-white transition-colors duration-200 text-shadow-sm">{buildingDef.name}</p> {/* Text shadow */}
      <p className="text-xs text-stone-300 text-shadow-xs">Úr. {level}</p> {/* Text shadow */}
      {isUnderConstruction && (
        <span className="absolute top-1 right-1 bg-sky-600 text-white text-[0.6rem] px-1 py-0.5 rounded-full z-10 animate-bounce-slow"> {/* Bouncing icon */}
          🛠️
        </span>
      )}
    </button>
  );
};

export default VillageBuilding;