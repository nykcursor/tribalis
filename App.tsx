
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
import * as authService from './services/authService';
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
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TutorialOverlay from './components/TutorialOverlay'; // New import

enum ActiveModal {
  NONE,
  OVERVIEW,
  RECRUIT,
  AI_ADVISOR,
  ATTACK,
  LOG,
}

enum AuthScreen {
  LOGIN,
  REGISTER,
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(ActiveModal.NONE);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; message: string }[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const gameMessageTimeoutRef = useRef<number | null>(null);

  const [loggedInUser, setLoggedInUser] = useState<authService.User | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>(AuthScreen.LOGIN);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Tutorial state derived from gameState
  const tutorialActive = gameState?.tutorialActive || false;
  const tutorialStep = gameState?.tutorialStep || 0;
  const [tutorialHighlightId, setTutorialHighlightId] = useState<string | null>(null); // State to control highlighting

  // Load user data on initial render
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setLoggedInUser(user);
      setGameState(user.gameState);
    }
  }, []);

  // Game tick interval
  useEffect(() => {
    if (!gameState || !loggedInUser) return;

    const gameTickInterval = setInterval(() => {
      setGameState(prevState => {
        if (!prevState) return null; // Should not happen if loggedInUser is true
        const newState = gameService.updateGameState(prevState);
        // Save game state periodically (e.g., every few ticks, or on significant change)
        authService.saveGameState(loggedInUser.id, newState);
        return newState;
      });
    }, GAME_TICK_INTERVAL_MS);
    return () => clearInterval(gameTickInterval);
  }, [gameState, loggedInUser]); // Re-run if gameState or loggedInUser changes (e.g. after login/logout)

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const productionRates = useMemo(() => {
    if (!gameState) return {};
    return gameService.calculateCurrentProduction(gameState.buildings);
  }, [gameState]);

  const isBuildingActionActive = useMemo(() => {
    if (!gameState) return false;
    return gameState.currentActions.some(action => action.type === 'building_construction');
  }, [gameState]);
  
  const isAttackActionActive = useMemo(() => {
    if (!gameState) return false;
    return gameState.currentActions.some(action => action.type === 'attack_preparation');
  }, [gameState]);

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
      if (!prevState) return null;
      // If tutorial is active, check if this action is allowed for the current step
      if (prevState.tutorialActive) {
        let tutorialRestrictionMessage: string | null = null;
        if (prevState.tutorialStep === 0 && (buildingType !== BuildingType.HEADQUARTERS || !isUpgrade)) {
          tutorialRestrictionMessage = 'Tutorial: Nejprve vylepši hlavní budovu na úroveň 2.';
        } else if (prevState.tutorialStep === 3 && (buildingType !== BuildingType.WOODCUTTER || isUpgrade)) {
          tutorialRestrictionMessage = 'Tutorial: Nyní postav dřevorubce.';
        } else if (prevState.tutorialStep === 5 && (buildingType !== BuildingType.BARRACKS || isUpgrade)) {
          tutorialRestrictionMessage = 'Tutorial: Nyní postav kasárna.';
        }

        if (tutorialRestrictionMessage) {
          showGameMessage(tutorialRestrictionMessage);
          return prevState; // Prevent action if tutorial restricts it
        }
      }

      const [newState, error] = gameService.startConstruction(prevState, buildingType, isUpgrade);
      if (error) {
        showGameMessage(error)
      } else {
        setSelectedBuilding(null);
      };
      return newState;
    });
  }, [showGameMessage, tutorialActive, tutorialStep]);

  const handleRecruit = useCallback((unitType: UnitType, amount: number) => {
      setGameState(prevState => {
          if (!prevState) return null;
          // Tutorial restriction
          if (prevState.tutorialActive && prevState.tutorialStep === 7 && (unitType !== UnitType.SPEARMAN || amount <= 0)) {
            showGameMessage('Tutorial: Nyní naverbuj alespoň jednoho kopiníka.');
            return prevState;
          }

          const [newState, error] = gameService.startRecruitment(prevState, unitType, amount);
          if (error) showGameMessage(error);
          else showGameMessage(`Verbování ${amount}x ${UNIT_DEFINITIONS[unitType].name} zařazeno do fronty.`);
          return newState;
      })
  }, [showGameMessage, tutorialActive, tutorialStep]);

  const handleAttack = useCallback(() => {
    setGameState(prevState => {
      if (!prevState) return null;
      // Tutorial restriction
      if (prevState.tutorialActive && prevState.tutorialStep < 9) { // Disallow attack during tutorial
        showGameMessage('Tutorial: Útok je během tutoriálu zakázán.');
        return prevState;
      }

      const [newState, error] = gameService.startAttack(prevState);
      if (error) showGameMessage(error);
      return newState;
    });
  }, [showGameMessage, tutorialActive, tutorialStep]);

  const handleGetAIAdvice = useCallback(async (userQuestion: string) => {
    if (!gameState) return;
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

  const openModal = useCallback((modal: ActiveModal) => {
    // Tutorial step 7: force open recruit modal if trying to open anything else
    if (tutorialActive && tutorialStep === 7 && modal !== ActiveModal.RECRUIT) {
      showGameMessage('Tutorial: Nyní otevři menu Verbovat.');
      setActiveModal(ActiveModal.RECRUIT); // Force recruit modal
      return;
    }
    setActiveModal(modal);
  }, [tutorialActive, tutorialStep, showGameMessage]);

  const closeModal = useCallback(() => setActiveModal(ActiveModal.NONE), []);

  const handleBuildingClick = useCallback((type: BuildingType) => {
    // Tutorial step 0: only allow clicking HQ
    if (tutorialActive && tutorialStep === 0 && type !== BuildingType.HEADQUARTERS) {
      showGameMessage('Tutorial: Nejprve klikni na Hlavní budovu.');
      return;
    }
    // Tutorial step 3: only allow clicking Woodcutter
    if (tutorialActive && tutorialStep === 3 && type !== BuildingType.WOODCUTTER) {
      showGameMessage('Tutorial: Nyní klikni na Dřevorubce.');
      return;
    }
    // Tutorial step 5: only allow clicking Barracks
    if (tutorialActive && tutorialStep === 5 && type !== BuildingType.BARRACKS) {
      showGameMessage('Tutorial: Nyní klikni na Kasárna.');
      return;
    }
    setSelectedBuilding(type);

    // No direct tutorial step advance here, App.tsx's useEffect for tutorialHighlightId
    // and TutorialOverlay's useEffect for gameState changes will handle progression after actions.
  }, [showGameMessage, tutorialActive, tutorialStep]);

  const closeBuildingModal = useCallback(() => setSelectedBuilding(null), []);

  const armyStats = useMemo(() => {
    if (!gameState) return { attack: 0, defense: 0 };
    return gameService.calculateArmyStats(gameState.units);
  }, [gameState]);
  const barracksLevel = useMemo(() => {
    if (!gameState) return 0;
    return gameState.buildings.find(b => b.type === BuildingType.BARRACKS)?.level || 0;
  }, [gameState]);
  const selectedBuildingDef = selectedBuilding ? BUILDING_DEFINITIONS[selectedBuilding] : null;

  const handleLogin = useCallback(async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    const result = await authService.loginUser(email, password);
    if (result.success && result.user) {
      setLoggedInUser(result.user);
      setGameState(result.user.gameState);
      setAuthError(null);
    } else {
      setAuthError(result.message);
    }
    setAuthLoading(false);
  }, []);

  const handleRegister = useCallback(async (email, password, villageName) => {
    setAuthLoading(true);
    setAuthError(null);
    const result = await authService.registerUser(email, password, villageName);
    if (result.success && result.user) {
      setLoggedInUser(result.user);
      setGameState(result.user.gameState);
      setAuthError(null);
    } else {
      setAuthError(result.message);
    }
    setAuthLoading(false);
  }, []);

  const handleLogout = useCallback(() => {
    authService.logoutUser();
    setLoggedInUser(null);
    setGameState(null);
    setChatMessages([]); // Clear chat on logout
    setAuthScreen(AuthScreen.LOGIN);
    closeModal(); // Close any open modals
    setTutorialHighlightId(null); // Clear tutorial highlight on logout
  }, [closeModal]);

  const setTutorialStepState = useCallback((step: number) => { // Renamed to avoid conflict
    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, tutorialStep: step };
    });
  }, []);

  const completeTutorial = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, tutorialActive: false, tutorialStep: 99 }; // Set to a high number to indicate completion
    });
    setTutorialHighlightId(null); // Clear highlight
  }, []);


  // Logic to determine tutorial highlight based on current tutorial step
  useEffect(() => {
    if (!tutorialActive || !gameState) {
      setTutorialHighlightId(null);
      return;
    }

    let highlightId: string | null = null;
    switch (tutorialStep) {
      case 0: // Click HQ
        highlightId = 'building-headquarters';
        break;
      case 1: // Upgrade HQ button
        highlightId = `upgrade-button-${BuildingType.HEADQUARTERS}`;
        break;
      case 2: // Waiting for HQ construction, then highlight Woodcutter
        const hqBuilding = gameState.buildings.find(b => b.type === BuildingType.HEADQUARTERS);
        if (hqBuilding && !hqBuilding.isUnderConstruction && hqBuilding.level === 2) {
            setTutorialStepState(3); // Advance
            return; // Exit to re-evaluate with new step
        } else if (selectedBuilding === BuildingType.HEADQUARTERS && hqBuilding?.isUnderConstruction) {
            highlightId = null; // Don't highlight other buttons while HQ modal is open or building
        } else if (selectedBuilding === null && hqBuilding?.isUnderConstruction) {
            highlightId = null; // Don't highlight anything while HQ is building, user should wait
        } else if (selectedBuilding === BuildingType.HEADQUARTERS) {
          highlightId = `upgrade-button-${BuildingType.HEADQUARTERS}`;
        }
        break;
      case 3: // Build Woodcutter button
        highlightId = `build-button-${BuildingType.WOODCUTTER}`;
        break;
      case 4: // Waiting for Woodcutter construction, then highlight Barracks
        const woodcutterBuilding = gameState.buildings.find(b => b.type === BuildingType.WOODCUTTER);
        if (woodcutterBuilding && !woodcutterBuilding.isUnderConstruction && woodcutterBuilding.level === 1) {
            setTutorialStepState(5); // Advance
            return; // Exit
        } else if (selectedBuilding === BuildingType.WOODCUTTER && woodcutterBuilding?.isUnderConstruction) {
            highlightId = null;
        } else if (selectedBuilding === null && woodcutterBuilding?.isUnderConstruction) {
            highlightId = null;
        }
        break;
      case 5: // Build Barracks button
        highlightId = `build-button-${BuildingType.BARRACKS}`;
        break;
      case 6: // Waiting for Barracks construction, then highlight Recruit footer button
        const barracksBuilding = gameState.buildings.find(b => b.type === BuildingType.BARRACKS);
        if (barracksBuilding && !barracksBuilding.isUnderConstruction && barracksBuilding.level === 1) {
            setTutorialStepState(7); // Advance
            return; // Exit
        } else if (selectedBuilding === BuildingType.BARRACKS && barracksBuilding?.isUnderConstruction) {
            highlightId = null;
        } else if (selectedBuilding === null && barracksBuilding?.isUnderConstruction) {
            highlightId = null;
        }
        break;
      case 7: // Recruit Spearmen input/button
        if (activeModal === ActiveModal.RECRUIT) {
          highlightId = `recruit-unit-${UnitType.SPEARMAN}-amount`; // Highlight amount input
        } else {
          highlightId = 'footer-button-recruit'; // Highlight recruit button
        }
        break;
      case 8: // Waiting for Spearman recruitment completion, then final step
        const recruitedSpearmen = gameState.units[UnitType.SPEARMAN] || 0;
        if (recruitedSpearmen > 0 && !gameState.currentActions.some(a => a.type === 'unit_recruitment' && a.details.unitType === UnitType.SPEARMAN)) {
            setTutorialStepState(9); // Advance
            return; // Exit
        }
        break;
      case 9: // Tutorial finished, waiting for user to click finish button
        highlightId = 'tutorial-finish-button';
        break;
      default:
        highlightId = null;
        break;
    }
    setTutorialHighlightId(highlightId);

    // If a modal is open but not the correct one for tutorial, close it
    if (tutorialActive) {
      if (tutorialStep === 1 && activeModal !== ActiveModal.NONE && selectedBuilding !== BuildingType.HEADQUARTERS) {
        closeModal();
        closeBuildingModal();
      } else if (tutorialStep === 4 && activeModal !== ActiveModal.NONE && selectedBuilding !== BuildingType.WOODCUTTER) {
        closeModal();
        closeBuildingModal();
      } else if (tutorialStep === 6 && activeModal !== ActiveModal.NONE && selectedBuilding !== BuildingType.BARRACKS) {
        closeModal();
        closeBuildingModal();
      } else if (tutorialStep < 7 && activeModal === ActiveModal.RECRUIT) { // Close recruit modal if not relevant yet
        closeModal();
      }
    }
    
  }, [tutorialStep, tutorialActive, gameState, activeModal, selectedBuilding, setTutorialStepState, closeModal, closeBuildingModal, barracksLevel]);


  if (!loggedInUser || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900 text-stone-200 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-amber-200 mb-8 tracking-wider">Settlement Saga</h1>
        {authScreen === AuthScreen.LOGIN ? (
          <LoginScreen
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthScreen(AuthScreen.REGISTER)}
            errorMessage={authError}
            isLoading={authLoading}
          />
        ) : (
          <RegisterScreen
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthScreen(AuthScreen.LOGIN)}
            errorMessage={authError}
            isLoading={authLoading}
          />
        )}
      </div>
    );
  }

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

      <main className="flex-grow p-2 md:p-4 pb-24 flex flex-col min-h-0">
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

        <VillageView 
          buildings={gameState.buildings} 
          onBuildingClick={handleBuildingClick} 
          tutorialHighlightId={tutorialHighlightId} // Pass highlight ID
        />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-stone-900 border-t-2 border-stone-950 p-2 shadow-2xl grid grid-cols-5 gap-2 z-20">
        <ActionButton onClick={() => openModal(ActiveModal.OVERVIEW)} text="Přehled" icon="📊" tutorialId="footer-button-overview" disabled={tutorialActive && tutorialStep < 9} tutorialHighlightId={tutorialHighlightId} />
        <ActionButton onClick={() => openModal(ActiveModal.RECRUIT)} text="Verbovat" icon="⚔️" tutorialId="footer-button-recruit" disabled={(barracksLevel === 0 && (!tutorialActive || tutorialStep < 6)) || (tutorialActive && tutorialStep < 7 && tutorialStep !== 6)} tutorialHighlightId={tutorialHighlightId} />
        <ActionButton onClick={() => openModal(ActiveModal.ATTACK)} text="Útok" icon="💥" tutorialId="footer-button-attack" disabled={isAttackActionActive || armyStats.attack === 0 || (tutorialActive && tutorialStep < 9)} tutorialHighlightId={tutorialHighlightId} />
        <ActionButton onClick={() => openModal(ActiveModal.AI_ADVISOR)} text="Rádce" icon="🧠" tutorialId="footer-button-advisor" disabled={aiLoading || (tutorialActive && tutorialStep < 9)} tutorialHighlightId={tutorialHighlightId} />
        <ActionButton onClick={() => openModal(ActiveModal.LOG)} text="Log" icon="📜" tutorialId="footer-button-log" disabled={tutorialActive && tutorialStep < 9} tutorialHighlightId={tutorialHighlightId} />
      </footer>

      {tutorialActive && (tutorialStep < 99) && (
        <TutorialOverlay
          tutorialStep={tutorialStep}
          tutorialHighlightId={tutorialHighlightId}
          onAdvance={setTutorialStepState} // Use renamed function
          onComplete={completeTutorial}
          gameState={gameState}
        />
      )}

      {selectedBuildingDef && (
        <Modal isOpen={!!selectedBuilding} onClose={closeBuildingModal} title={selectedBuildingDef.name}>
          <BuildingCard
            buildingDef={selectedBuildingDef}
            playerBuilding={gameState.buildings.find(b => b.type === selectedBuildingDef.type)}
            playerResources={gameState.resources}
            onBuildOrUpgrade={handleBuildOrUpgrade}
            isBuildingActionActive={isBuildingActionActive}
            tutorialHighlightId={tutorialHighlightId} // Pass highlight ID
          />
        </Modal>
      )}

      <Modal isOpen={activeModal === ActiveModal.OVERVIEW} onClose={closeModal} title={`Přehled vesnice ${gameState.villageName}`}>
          <div className="grid grid-cols-2 gap-3 text-center mb-4">
            <div className="bg-stone-700 p-3 rounded-md shadow-sm">
              <h3 className="font-bold text-base text-stone-300">Síla útoku</h3>
              <p className="text-green-400 text-xl">{Math.floor(armyStats.attack)}</p>
            </div>
            <div className="bg-stone-700 p-3 rounded-md shadow-sm">
              <h3 className="font-bold text-base text-stone-300">Síla obrany</h3>
              <p className="text-red-400 text-xl">{Math.floor(armyStats.defense)}</p>
            </div>
          </div>
          <div className="p-3 border-t-2 border-stone-900 flex justify-center bg-stone-800 rounded-b-lg mt-4">
            <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
                Odhlásit se
            </button>
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
                        tutorialHighlightId={tutorialHighlightId} // Pass highlight ID
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
          <ChatInput onSendMessage={handleGetAIAdvice} disabled={aiLoading || (tutorialActive && tutorialStep < 9)} />
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
          <ActionButton onClick={handleAttack} text={isAttackActionActive ? "Útok probíhá..." : "Zaútočit se vším"} icon="💥" disabled={isAttackActionActive || armyStats.attack === 0 || (tutorialActive && tutorialStep < 9)} className="w-full md:w-auto px-8 py-3 text-lg" tutorialHighlightId={tutorialHighlightId} />
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