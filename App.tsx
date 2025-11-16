import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BuildingType,
  GameState,
  AIAdvice,
  PlayerBuilding,
  UnitType,
} from './types';
import {
  BUILDING_DEFINITIONS,
  GAME_TICK_INTERVAL_MS,
  UNIT_DEFINITIONS,
} from './constants';
import * as gameService from './services/gameService';
import { getStrategicAdvice } from './services/geminiService';

import ResourceDisplay from './components/ResourceDisplay';
import BuildingCard from './components/BuildingCard';
import Modal from './components/Modal';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import LoadingSpinner from './components/LoadingSpinner';
import ActionButton from './components/ActionButton';
import UnitCard from './components/UnitCard';
import VillageView from './components/VillageView';

enum ActiveModal {
  NONE,
  OVERVIEW,
  RECRUIT,
  AI_ADVISOR,
  ATTACK,
  LOG,
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(gameService.getInitialGameState());
  const [activeModal, setActiveModal] = useState<ActiveModal>(ActiveModal.NONE);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; message: string }[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const gameMessageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const gameTickInterval = setInterval(() => {
      setGameState(prevState => gameService.updateGameState(prevState));
    }, GAME_TICK_INTERVAL_MS);
    return () => clearInterval(gameTickInterval);
  }, []);

  const productionRates = useMemo(() => gameService.calculateCurrentProduction(gameState.buildings), [gameState.buildings]);

  const isBuildingActionActive = useMemo(() => {
    return gameState.currentActions.some(action => action.type === 'building_construction');
  }, [gameState.currentActions]);
  
  const isAttackActionActive = useMemo(() => {
    return gameState.currentActions.some(action => action.type === 'attack_preparation');
  }, [gameState.currentActions]);

  const showGameMessage = useCallback((message: string) => {
    if (gameMessageTimeoutRef.current) {
      clearTimeout(gameMessageTimeoutRef.current);
    }
    setGameMessage(message);
    gameMessageTimeoutRef.current = window.setTimeout(() => {
      setGameMessage(null);
    }, 4000);
  }, []);

  const handleBuildOrUpgrade = useCallback((buildingType: BuildingType, isUpgrade: boolean) => {
    setGameState(prevState => {
      const [newState, error] = gameService.startConstruction(prevState, buildingType, isUpgrade);
      if (error) {
        showGameMessage(error)
      } else {
        setSelectedBuilding(null);
      };
      return newState;
    });
  }, [showGameMessage]);

  const handleRecruit = useCallback((unitType: UnitType, amount: number) => {
      setGameState(prevState => {
          const [newState, error] = gameService.startRecruitment(prevState, unitType, amount);
          if (error) showGameMessage(error);
          else showGameMessage(`Verbování ${amount}x ${UNIT_DEFINITIONS[unitType].name} zařazeno do fronty.`);
          return newState;
      })
  }, [showGameMessage]);

  const handleAttack = useCallback(() => {
    setGameState(prevState => {
      const [newState, error] = gameService.startAttack(prevState);
      if (error) showGameMessage(error);
      return newState;
    });
  }, [showGameMessage]);

  const handleGetAIAdvice = useCallback(async (userQuestion: string) => {
    setAiLoading(true);
    setChatMessages(prev => [...prev, { sender: 'user', message: userQuestion }]);
    try {
      const advice: AIAdvice | null = await getStrategicAdvice(gameState);
      if (advice) {
        const adviceMessage = `AI Rádce (Priorita ${advice.priority}/5):\nAkce: ${advice.action}${advice.target ? ` (${advice.target})` : ''}\nDůvod: ${advice.reason}`;
        setChatMessages(prev => [...prev, { sender: 'ai', message: adviceMessage }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', message: 'Nepodařilo se získat radu.' }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'ai', message: `Chyba: ${(error as Error).message}` }]);
    } finally {
      setAiLoading(false);
    }
  }, [gameState]);

  const openModal = useCallback((modal: ActiveModal) => setActiveModal(modal), []);
  const closeModal = useCallback(() => setActiveModal(ActiveModal.NONE), []);
  const handleBuildingClick = useCallback((type: BuildingType) => setSelectedBuilding(type), []);
  const closeBuildingModal = useCallback(() => setSelectedBuilding(null), []);

  const armyStats = useMemo(() => gameService.calculateArmyStats(gameState.units), [gameState.units]);
  const barracksLevel = useMemo(() => gameState.buildings.find(b => b.type === BuildingType.BARRACKS)?.level || 0, [gameState.buildings]);
  const selectedBuildingDef = selectedBuilding ? BUILDING_DEFINITIONS[selectedBuilding] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900 text-stone-200 flex flex-col">
      <header className="py-3 px-4 bg-stone-900 shadow-lg z-10 sticky top-0 border-b-2 border-stone-950">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-amber-200 tracking-wider">
          Settlement Saga
        </h1>
      </header>

      <div className="sticky top-[57px] md:top-[65px] z-10">
        <ResourceDisplay 
          resources={gameState.resources} 
          capacity={gameState.resourceCapacity} 
          population={gameState.population}
          productionRates={productionRates}
        />
      </div>

      <main className="flex-grow p-2 md:p-4 pb-24 flex flex-col">
        {gameMessage && (
          <div className="bg-orange-800 bg-opacity-80 text-amber-100 p-3 rounded-lg text-center mb-4 shadow-md fixed top-24 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-50">
            {gameMessage}
          </div>
        )}

        {gameState.currentActions.length > 0 && (
          <div className="bg-stone-800 p-3 rounded-lg shadow-lg mb-4 border border-stone-700">
            <h2 className="text-lg font-semibold text-amber-200 mb-2">Aktivní akce</h2>
            <div className="space-y-2">
              {gameState.currentActions.map(action => (
                <div key={action.id} className="bg-stone-700 p-2 rounded-md flex justify-between items-center shadow-sm">
                  <span className="text-sm text-stone-200">{action.message}</span>
                  <span className="text-xs text-stone-400">{Math.max(0, Math.ceil((action.endTime - Date.now()) / 1000))}s</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <VillageView buildings={gameState.buildings} onBuildingClick={handleBuildingClick} />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-stone-900 border-t-2 border-stone-950 p-2 shadow-2xl grid grid-cols-5 gap-2 z-20">
        <ActionButton onClick={() => openModal(ActiveModal.OVERVIEW)} text="Přehled" icon="📊" />
        <ActionButton onClick={() => openModal(ActiveModal.RECRUIT)} text="Verbovat" icon="⚔️" disabled={barracksLevel === 0} />
        <ActionButton onClick={() => openModal(ActiveModal.ATTACK)} text="Útok" icon="💥" disabled={isAttackActionActive} />
        <ActionButton onClick={() => openModal(ActiveModal.AI_ADVISOR)} text="Rádce" icon="🧠" disabled={aiLoading} />
        <ActionButton onClick={() => openModal(ActiveModal.LOG)} text="Log" icon="📜" />
      </footer>

      {selectedBuildingDef && (
        <Modal isOpen={!!selectedBuilding} onClose={closeBuildingModal} title={selectedBuildingDef.name}>
          <BuildingCard
            buildingDef={selectedBuildingDef}
            playerBuilding={gameState.buildings.find(b => b.type === selectedBuildingDef.type)}
            playerResources={gameState.resources}
            onBuildOrUpgrade={handleBuildOrUpgrade}
            isBuildingActionActive={isBuildingActionActive}
          />
        </Modal>
      )}

      <Modal isOpen={activeModal === ActiveModal.OVERVIEW} onClose={closeModal} title="Přehled vesnice">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-stone-700 p-3 rounded-md shadow-sm">
              <h3 className="font-bold text-base text-stone-300">Síla útoku</h3>
              <p className="text-green-400 text-xl">{Math.floor(armyStats.attack)}</p>
            </div>
            <div className="bg-stone-700 p-3 rounded-md shadow-sm">
              <h3 className="font-bold text-base text-stone-300">Síla obrany</h3>
              <p className="text-red-400 text-xl">{Math.floor(armyStats.defense)}</p>
            </div>
          </div>
      </Modal>

      <Modal isOpen={activeModal === ActiveModal.RECRUIT} onClose={closeModal} title={`Kasárna (Úroveň ${barracksLevel})`}>
        {barracksLevel > 0 ? (
            <div className="grid grid-cols-1 gap-4">
                {Object.values(UNIT_DEFINITIONS).map(def => (
                    <UnitCard 
                        key={def.type}
                        unitDef={def}
                        playerResources={gameState.resources}
                        onRecruit={handleRecruit}
                        population={gameState.population}
                    />
                ))}
            </div>
        ) : (
            <p className="text-center text-stone-300 p-4">Musíš nejprve postavit kasárna, abys mohl verbovat jednotky.</p>
        )}
      </Modal>

      <Modal isOpen={activeModal === ActiveModal.AI_ADVISOR} onClose={closeModal} title="AI strategický rádce">
        <div className="flex flex-col h-[70vh] bg-stone-800 rounded-lg shadow-inner">
          <div className="flex-grow p-4 overflow-y-auto space-y-3">
            {chatMessages.length === 0 && <p className="text-stone-400 text-center italic">Zeptej se svého AI rádce na strategii!</p>}
            {chatMessages.map((msg, index) => <ChatMessage key={index} sender={msg.sender} message={msg.message} />)}
            {aiLoading && <LoadingSpinner />}
            <div ref={chatMessagesEndRef} />
          </div>
          <ChatInput onSendMessage={handleGetAIAdvice} disabled={aiLoading} />
        </div>
      </Modal>

      <Modal isOpen={activeModal === ActiveModal.ATTACK} onClose={closeModal} title="Útok na soupeře">
        <div className="p-4 flex flex-col items-center text-stone-200">
          <h3 className="text-lg text-center mb-4">Vyšli své jednotky do boje za slávou a kořistí!</h3>
          <div className='w-full bg-stone-900 p-4 rounded-lg mb-6'>
            <h4 className='font-bold text-amber-200 mb-2'>Tvoje armáda:</h4>
            <ul className='grid grid-cols-2 gap-1 text-sm'>
              {Object.entries(gameState.units).filter(([,count]) => count > 0).length > 0 ? (
                Object.entries(gameState.units).filter(([,count]) => count > 0).map(([type, count]) => (
                  <li key={type}>{UNIT_DEFINITIONS[type as UnitType].name}: <span className='font-bold'>{count}</span></li>
                ))
              ) : (
                <li className='col-span-2 italic text-stone-400'>Nemáš žádné jednotky.</li>
              )}
            </ul>
          </div>
          <ActionButton onClick={handleAttack} text={isAttackActionActive ? "Útok probíhá..." : "Zaútočit se vším"} icon="💥" disabled={isAttackActionActive || armyStats.attack === 0} className="w-full md:w-auto px-8 py-3 text-lg" />
          {isAttackActionActive && <p className="mt-4 text-sky-400 text-center font-semibold animate-pulse">Útok již probíhá. Sleduj aktivní akce.</p>}
          {!isAttackActionActive && armyStats.attack === 0 && <p className="mt-4 text-red-400 text-center">Musíš vycvičit jednotky, abys mohl útočit!</p>}
        </div>
      </Modal>

      <Modal isOpen={activeModal === ActiveModal.LOG} onClose={closeModal} title="Herní deník">
        <div className="flex flex-col h-[70vh] bg-stone-800 rounded-lg shadow-inner overflow-y-auto p-4 space-y-2">
          {gameState.messages.length === 0 ? <p className="text-stone-400 text-center italic">Žádné události.</p> : (
            [...gameState.messages].reverse().map((msg, index) => (
              <div key={index} className="text-sm text-stone-200 bg-stone-700 p-2 rounded-md">{msg}</div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default App;