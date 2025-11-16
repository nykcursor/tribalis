
import React from 'react';
import { UnitType } from '../types';
import { UNIT_DEFINITIONS } from '../constants';

interface UnitOverviewProps {
  units: Record<UnitType, number>;
}

const getUnitIcon = (type: UnitType) => {
    switch (type) {
        case UnitType.SPEARMAN: return '🛡️';
        case UnitType.SWORDSMAN: return '⚔️';
        case UnitType.AXEMAN: return '🪓';
        case UnitType.ARCHER: return '🏹';
        case UnitType.SCOUT: return '🏇';
        case UnitType.LIGHT_CAVALRY: return '🐎';
        default: return '❓';
    }
};

const UnitOverview: React.FC<UnitOverviewProps> = ({ units }) => {
    const ownedUnits = Object.entries(units).filter(([, count]) => count > 0);

    return (
        <div className="bg-stone-800 p-3 rounded-lg shadow-lg mb-4 border border-stone-700">
            <h2 className="text-lg font-semibold text-amber-200 mb-2">Jednotky ve vesnici</h2>
            {ownedUnits.length === 0 ? (
                <p className="text-stone-400 text-center italic">Nemáš žádné jednotky.</p>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center">
                    {ownedUnits.map(([type, count]) => (
                        <div key={type} className="bg-stone-700 p-2 rounded-md shadow-sm">
                            <span className="text-2xl" role="img" aria-label={UNIT_DEFINITIONS[type as UnitType].name}>{getUnitIcon(type as UnitType)}</span>
                            <p className="font-bold text-lg text-white">{count}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UnitOverview;
