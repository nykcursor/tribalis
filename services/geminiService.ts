import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIAdvice, BuildingDefinition, BuildingType, GameState, ResourceType, UnitType } from '../types';
import { AI_ADVISOR_SYSTEM_INSTRUCTION, BUILDING_DEFINITIONS, UNIT_DEFINITIONS } from '../constants';

const API_KEY = process.env.API_KEY;

const formatGameStateForAI = (gameState: GameState): string => {
  const resources = Object.entries(gameState.resources)
    .map(([type, amount]) => `${type}: ${Math.floor(amount)}/${gameState.resourceCapacity}`)
    .join(', ');

  const buildings = gameState.buildings
    .map(b => `${BUILDING_DEFINITIONS[b.type].name} (Level ${b.level}${b.isUnderConstruction ? ', Under Construction' : ''})`)
    .join('; ');

  const units = Object.entries(gameState.units)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${UNIT_DEFINITIONS[type as UnitType].name}: ${count}`)
    .join(', ');

  const actions = gameState.currentActions
    .map(a => `${a.message} (Ends: ${new Date(a.endTime).toLocaleTimeString()})`)
    .join('; ');

  return `
Current Resources: ${resources}
Population: ${gameState.population.current}/${gameState.population.capacity}
Buildings: ${buildings}
Units: ${units || 'None'}
Current Actions: ${actions || 'None'}
Player Level: ${gameState.playerLevel}

What is the most critical next step for my settlement?
`;
};

export const getStrategicAdvice = async (gameState: GameState): Promise<AIAdvice | null> => {
  if (!API_KEY) {
    console.error("Gemini API Key is not configured.");
    return {
      action: 'none',
      reason: 'Gemini API Key is missing. Cannot provide AI advice.',
      priority: 1,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = formatGameStateForAI(gameState);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        systemInstruction: AI_ADVISOR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "The recommended action (build, upgrade, recruit, attack, defend, none).",
              enum: ["build", "upgrade", "recruit", "attack", "defend", "none"]
            },
            target: {
              type: Type.STRING,
              description: "If 'build'/'upgrade', the building type. If 'recruit', the unit type. If 'attack'/'defend', 'enemy'/'self'."
            },
            reason: {
              type: Type.STRING,
              description: "A concise explanation for the recommended action."
            },
            priority: {
              type: Type.INTEGER,
              description: "A numerical priority for the action (1-5, 5 being highest)."
            }
          },
          required: ["action", "reason", "priority"]
        },
      },
    });

    const jsonStr = response.text.trim();
    const advice: AIAdvice = JSON.parse(jsonStr);
    return advice;

  } catch (error) {
    console.error("Error fetching AI advice from Gemini:", error);
    return {
      action: 'none',
      reason: `Failed to get AI advice: ${(error as Error).message}.`,
      priority: 1,
    };
  }
};