
import React, { useEffect, useState } from 'react';
import { GameState, BuildingType, UnitType } from '../types';

interface TutorialOverlayProps {
  tutorialStep: number;
  tutorialHighlightId: string | null;
  onAdvance: (step: number) => void;
  onComplete: () => void;
  gameState: GameState;
}

const tutorialMessages: { [key: number]: { title: string; text: string; buttonText: string; advanceOnAction?: boolean; } } = {
  0: {
    title: 'Vítej v osadě!',
    text: 'Tvé dobrodružství začíná v malé vesnici. Nejprve vylepšíme "Hlavní budovu". Klikni na ni.',
    buttonText: 'Rozumím',
    advanceOnAction: true,
  },
  1: {
    title: 'Hlavní budova',
    text: 'Vylepšení Hlavní budovy zrychlí stavbu ostatních budov. Klikni na "Vylepšit" a začni s první stavbou.',
    buttonText: 'Vylepšit',
    advanceOnAction: true,
  },
  2: {
    title: 'Stavba probíhá...',
    text: 'Výborně! Hlavní budova se vylepšuje. Jakmile bude hotová, posuneme se dál. Můžeš sledovat "Aktivní akce" pod vesnicí.',
    buttonText: 'Pokračovat',
    advanceOnAction: false, // This button will advance the tutorial manually
  },
  3: {
    title: 'Získávání surovin',
    text: 'Skvěle! Nyní potřebujeme suroviny. Klikni na slot "Dřevorubec" a postav jej.',
    buttonText: 'Rozumím',
    advanceOnAction: true,
  },
  4: {
    title: 'Postavit dřevorubce',
    text: 'Dřevorubec ti bude těžit dřevo. Klikni na "Postavit" pro zahájení stavby.',
    buttonText: 'Postavit',
    advanceOnAction: true,
  },
  5: {
    title: 'Příprava na obranu',
    text: 'Výborně! Dřevorubec se staví. Abychom byli v bezpečí, postavíme "Kasárna". Klikni na jeho slot.',
    buttonText: 'Rozumím',
    advanceOnAction: true,
  },
  6: {
    title: 'Postavit kasárna',
    text: 'Kasárna ti umožní verbovat vojenské jednotky. Klikni na "Postavit" pro zahájení stavby.',
    buttonText: 'Postavit',
    advanceOnAction: true,
  },
  7: {
    title: 'Verbování jednotek',
    text: 'Skvěle! Kasárna se staví. Nyní naverbujeme první jednotky. Klikni na tlačítko "Verbovat" v dolním menu.',
    buttonText: 'Verbovat',
    advanceOnAction: true,
  },
  8: {
    title: 'První kopiníci',
    text: 'Zvol "Kopiník", zadej počet (např. 5) a klikni na "Verbovat".',
    buttonText: 'Naverbovat',
    advanceOnAction: true,
  },
  9: {
    title: 'Tutoriál dokončen!',
    text: 'Gratulujeme! Dokončil jsi základní tutoriál. Nyní jsi připraven rozvíjet svou vesnici a čelit výzvám. Hodně štěstí!',
    buttonText: 'Pokračovat do hry',
    advanceOnAction: false, // This button will complete the tutorial
  },
};

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  tutorialStep,
  tutorialHighlightId,
  onAdvance,
  onComplete,
  gameState,
}) => {
  // Fix: Initialize positionStyle with React.CSSProperties type
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});
  const [isMessagePopOverVisible, setIsMessagePopOverVisible] = useState(true);

  const currentMessage = tutorialMessages[tutorialStep];

  // Reset message visibility when tutorial step changes
  useEffect(() => {
    setIsMessagePopOverVisible(true);
  }, [tutorialStep]);

  useEffect(() => {
    if (tutorialHighlightId && isMessagePopOverVisible) {
      const targetElement = document.querySelector(`[data-tutorial-id="${tutorialHighlightId}"]`);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        // Position overlay relative to the highlighted element
        const top = rect.bottom + window.scrollY + 10;
        const left = rect.left + window.scrollX + rect.width / 2;
        setPositionStyle({
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translateX(-50%)',
          maxWidth: '300px',
        });
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // If highlight ID is set but element not found, default to bottom position
        setPositionStyle({
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '350px',
          width: 'calc(100% - 2rem)', // Fill most of the width on mobile
        });
      }
    } else if (!tutorialHighlightId && isMessagePopOverVisible) {
      // Default to bottom position if no highlight ID
      setPositionStyle({
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '350px',
        width: 'calc(100% - 2rem)', // Fill most of the width on mobile
      });
    } else {
      setPositionStyle({}); // Hide popover when not visible
    }
  }, [tutorialHighlightId, tutorialStep, isMessagePopOverVisible]);


  const handleButtonClick = () => {
    if (tutorialStep === 9) { // Final step, completes tutorial
      onComplete();
      return;
    }

    // For steps that don't auto-advance on game action (or step 2 which is a waiting step), advance manually
    if (!currentMessage.advanceOnAction || tutorialStep === 2) {
      onAdvance(tutorialStep + 1);
      return;
    }

    // For advanceOnAction steps, simply hide the message popover after acknowledgment
    setIsMessagePopOverVisible(false);
  };

  // Skip steps if the required building is already constructed/upgraded. This might happen on page refresh.
  useEffect(() => {
    // Check for Headquarters level 2 completion
    if (tutorialStep <= 2) { // Handles step 0, 1, 2
        const hqBuilding = gameState?.buildings.find(b => b.type === BuildingType.HEADQUARTERS);
        if (hqBuilding?.level === 2 && !hqBuilding.isUnderConstruction) {
            onAdvance(3);
            return;
        }
    }
    // Check for Woodcutter level 1 completion
    if (tutorialStep <= 4) { // Handles step 3, 4
      const woodcutterBuilding = gameState?.buildings.find(b => b.type === BuildingType.WOODCUTTER);
      if (woodcutterBuilding?.level === 1 && !woodcutterBuilding.isUnderConstruction) {
        onAdvance(5);
        return;
      }
    }
    // Check for Barracks level 1 completion
    if (tutorialStep <= 6) { // Handles step 5, 6
      const barracksBuilding = gameState?.buildings.find(b => b.type === BuildingType.BARRACKS);
      if (barracksBuilding?.level === 1 && !barracksBuilding.isUnderConstruction) {
        onAdvance(7);
        return;
      }
    }
    // Check for Spearman recruitment completion
    if (tutorialStep <= 8) { // Handles step 7, 8
        const recruitedSpearmen = gameState?.units[UnitType.SPEARMAN] || 0;
        if (recruitedSpearmen > 0 && !gameState?.currentActions.some(a => a.type === 'unit_recruitment' && a.details.unitType === UnitType.SPEARMAN)) {
            onAdvance(9); // All spearmen recruited and action is complete
            return;
        }
    }
  }, [tutorialStep, gameState, onAdvance]);


  if (!currentMessage || tutorialStep === 99) return null; // Tutorial finished

  // Access position directly as it's now typed
  const isPopoverAbsolute = positionStyle.position === 'absolute';

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-70 z-40 transition-all duration-300
        ${!isMessagePopOverVisible ? 'pointer-events-none' : ''}
      `}
      aria-hidden={isMessagePopOverVisible ? 'false' : 'true'}
    >
      {isMessagePopOverVisible && (
        <div
          className={`bg-stone-800 border border-stone-600 rounded-lg shadow-2xl p-4 text-stone-100 text-center flex flex-col items-center pointer-events-auto z-46
            ${isPopoverAbsolute ? '' : 'w-11/12 max-w-sm'}
          `}
          style={positionStyle}
        >
          <h3 className="text-xl font-bold text-amber-100 mb-2">{currentMessage.title}</h3>
          <p className="text-sm text-stone-300 mb-4">{currentMessage.text}</p>
          <button
            onClick={handleButtonClick}
            // Button is disabled only if it's an advanceOnAction step and message is hidden AND it's not step 7 (recruit button)
            disabled={currentMessage.advanceOnAction && !isMessagePopOverVisible && tutorialStep !== 7}
            data-tutorial-id={tutorialStep === 9 ? 'tutorial-finish-button' : undefined} // For targeting the final button
            className={`px-6 py-2 rounded-md font-semibold transition-colors duration-200
              ${(currentMessage.advanceOnAction && !isMessagePopOverVisible && tutorialStep !== 7)
                ? 'bg-stone-600 text-stone-400 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500'
              }
              ${(tutorialHighlightId === 'footer-button-recruit' && tutorialStep === 7) || (tutorialHighlightId === 'tutorial-finish-button' && tutorialStep === 9) ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-stone-900 z-10' : ''}
            `}
          >
            {currentMessage.buttonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default TutorialOverlay;