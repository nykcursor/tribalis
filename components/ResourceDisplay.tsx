import React from 'react';
import { ResourceType } from '../types';
import { WORLD_SPEED } from '../constants';

interface ResourceDisplayProps {
  resources: Record<ResourceType, number>;
  capacity: number;
  population: { current: number; capacity: number };
  productionRates: Partial<Record<ResourceType, number>>;
}

const ResourceDisplay: React.FC<ResourceDisplayProps> = ({ resources, capacity, population, productionRates }) => {
  const resourceOrder: ResourceType[] = [ResourceType.WOOD, ResourceType.CLAY, ResourceType.IRON, ResourceType.FOOD];

  const getIcon = (type: ResourceType | 'population') => {
    switch (type) {
      case ResourceType.WOOD: return '🪵';
      case ResourceType.CLAY: return '🧱';
      case ResourceType.IRON: return '⛏️';
      case ResourceType.FOOD: return '🌾';
      case 'population': return '👨‍👩‍👧';
      default: return '❓';
    }
  };

  const formatProduction = (rate: number) => {
    const perHour = (rate * 3600 * WORLD_SPEED).toFixed(0);
    return `+${perHour}/h`;
  }

  return (
    <div className="grid grid-cols-5 gap-1 bg-stone-900 text-amber-50 p-2 rounded-b-lg shadow-lg">
      {resourceOrder.map(type => (
        <div key={type} className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
          <span className="text-lg sm:text-xl">{getIcon(type)}</span>
          <div className="flex flex-col items-start">
            <span className="font-bold whitespace-nowrap">
              {Math.floor(resources[type] || 0)}{type !== ResourceType.FOOD ? `/${Math.floor(capacity)}` : ''}
            </span>
             <span className="text-stone-400 text-xs whitespace-nowrap">
                {formatProduction(productionRates[type] || 0)}
              </span>
          </div>
        </div>
      ))}
       <div key="population" className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
          <span className="text-lg sm:text-xl">{getIcon('population')}</span>
          <div className="flex flex-col items-start">
            <span className="font-bold whitespace-nowrap">
              {population.current}/{population.capacity}
            </span>
          </div>
        </div>
    </div>
  );
};

export default ResourceDisplay;