import { User, GameState } from '../types';
import { getInitialGameStateForUser } from './gameService';

interface AuthServiceResponse {
  success: boolean;
  message?: string;
  user?: User;
}

const LOCAL_STORAGE_USERS_KEY = 'ss_users';
const LOCAL_STORAGE_CURRENT_USER_ID_KEY = 'ss_current_user_id';

const getUsers = (): Record<string, User> => {
  const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : {};
};

const saveUsers = (users: Record<string, User>) => {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
};

export const registerUser = async (email: string, password: string, villageName: string): Promise<AuthServiceResponse> => {
  const users = getUsers();

  if (Object.values(users).some(user => user.email === email)) {
    return { success: false, message: 'Uživatel s tímto e-mailem již existuje.' };
  }
  if (Object.values(users).some(user => user.villageName === villageName)) {
    return { success: false, message: 'Vesnice s tímto názvem již existuje.' };
  }

  // Simulate password hashing
  const hashedPassword = btoa(password); // Simple base64 for simulation

  const newUser: User = {
    id: `user-${Date.now()}`,
    email,
    villageName,
    hashedPassword,
    gameState: getInitialGameStateForUser(villageName),
  };

  users[newUser.id] = newUser;
  saveUsers(users);

  localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_ID_KEY, newUser.id);
  return { success: true, user: newUser, message: 'Registrace úspěšná!' };
};

export const loginUser = async (email: string, password: string): Promise<AuthServiceResponse> => {
  const users = getUsers();
  const user = Object.values(users).find(u => u.email === email);

  if (!user) {
    return { success: false, message: 'Nesprávný e-mail nebo heslo.' };
  }

  // Simulate password verification
  if (user.hashedPassword !== btoa(password)) {
    return { success: false, message: 'Nesprávný e-mail nebo heslo.' };
  }

  localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_ID_KEY, user.id);
  return { success: true, user, message: 'Přihlášení úspěšné!' };
};

export const logoutUser = () => {
  localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_ID_KEY);
};

export const getCurrentUser = (): User | null => {
  const currentUserId = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_ID_KEY);
  if (!currentUserId) {
    return null;
  }
  const users = getUsers();
  return users[currentUserId] || null;
};

export const saveGameState = (userId: string, gameState: GameState) => {
  const users = getUsers();
  if (users[userId]) {
    users[userId].gameState = gameState;
    saveUsers(users);
  } else {
    console.error(`Attempted to save game state for non-existent user ID: ${userId}`);
  }
};

export type { User };