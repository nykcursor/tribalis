import React from 'react';
import { BuildingType, PlayerBuilding } from '../types';
import { BUILDING_DEFINITIONS } from '../constants';
import VillageBuilding from './VillageBuilding';

interface VillageViewProps {
  buildings: PlayerBuilding[];
  onBuildingClick: (type: BuildingType) => void;
}

const buildingPositions: Record<BuildingType, string> = {
  [BuildingType.HEADQUARTERS]: 'col-start-2 row-start-2 col-span-2 row-span-2',
  [BuildingType.WOODCUTTER]: 'col-start-1 row-start-2',
  [BuildingType.CLAY_PIT]: 'col-start-1 row-start-3',
  [BuildingType.IRON_MINE]: 'col-start-1 row-start-4',
  [BuildingType.FARM]: 'col-start-4 row-start-1',
  [BuildingType.WAREHOUSE]: 'col-start-2 row-start-4',
  [BuildingType.BARRACKS]: 'col-start-4 row-start-4',
  [BuildingType.WALL]: 'col-start-1 row-start-1 col-span-4',
};

const VillageView: React.FC<VillageViewProps> = ({ buildings, onBuildingClick }) => {
  return (
    <div className="bg-green-900 bg-opacity-40 p-2 sm:p-4 rounded-lg border-2 border-stone-700 max-w-2xl mx-auto flex-grow">
      <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full">
        {Object.values(BUILDING_DEFINITIONS).map(def => (
          <div key={def.type} className={buildingPositions[def.type] || ''}>
            <VillageBuilding
              buildingDef={def}
              playerBuilding={buildings.find(b => b.type === def.type)}
              onClick={onBuildingClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VillageView;