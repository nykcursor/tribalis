
import React from 'react';
import { BuildingType, PlayerBuilding } from '../types';
import { BUILDING_DEFINITIONS } from '../constants';
import VillageBuilding from './VillageBuilding';

interface VillageViewProps {
  buildings: PlayerBuilding[];
  onBuildingClick: (type: BuildingType) => void;
  tutorialHighlightId?: string | null; // New prop
}

const buildingPositions: Record<BuildingType, string> = {
  [BuildingType.HEADQUARTERS]: 'col-start-2 row-start-2 col-span-2 row-span-2',
  [BuildingType.WOODCUTTER]: 'col-start-1 row-start-2',
  [BuildingType.CLAY_PIT]: 'col-start-1 row-start-3',
  [BuildingType.IRON_MINE]: 'col-start-1 row-start-4',
  [BuildingType.FARM]: 'col-start-4 row-start-1',
  [BuildingType.WAREHOUSE]: 'col-start-2 row-start-4',
  [BuildingType.BARRACKS]: 'col-start-4 row-start-4',
  [BuildingType.WALL]: 'col-start-1 row-start-1 col-span-4', // Wall spans across the top
};

const VillageView: React.FC<VillageViewProps> = ({ buildings, onBuildingClick, tutorialHighlightId }) => {
  return (
    <div
      className="relative p-2 sm:p-4 rounded-lg border-2 border-stone-700 max-w-2xl mx-auto flex-grow min-h-0 overflow-hidden shadow-inner
                 bg-stone-700/80" // Base village ground color, slightly transparent
      style={{
        backgroundImage: `
          radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%), /* Darker edges */
          linear-gradient(to bottom, #5C4A4A 0%, #382B2A 70%) /* Top-down shading for depth */
        `,
        backgroundSize: 'cover',
      }}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' viewBox=\'0 0 10 10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%236B6B6B\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'2\'/%3E%3Cpath d=\'M5 0h5L0 5v5h5L10 5V0z\'/%3E%3C/g%3E%3C/svg%3E')] opacity-30 pointer-events-none"></div>

      {/* Central path / village square for visual interest */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-3/5 h-3/5 rounded-full bg-yellow-900/10 opacity-30 blur-2xl"></div> {/* Central glow/path highlight */}
      </div>

      <div className="grid grid-cols-4 grid-rows-4 gap-4 h-full relative z-10">
        {Object.values(BUILDING_DEFINITIONS).map(def => (
          <div key={def.type} className={buildingPositions[def.type] || ''}>
            <VillageBuilding
              buildingDef={def}
              playerBuilding={buildings.find(b => b.type === def.type)}
              onClick={onBuildingClick}
              tutorialHighlightId={tutorialHighlightId}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VillageView;