// Storage service para gerenciar dados localmente (preparado para migração futura)

import { Event, User, AppState } from "./types";

const STORAGE_KEYS = {
  EVENTS: "nomeNaListaPro_events",
  CURRENT_USER: "nomeNaListaPro_currentUser",
  USERS: "nomeNaListaPro_users",
} as const;

// Interface que pode ser facilmente substituída por chamadas de API
export interface StorageService {
  // Events
  getEvents(): Event[];
  saveEvents(events: Event[]): void;
  getEventById(id: string): Event | null;
  
  // Users
  getCurrentUser(): User | null;
  setCurrentUser(user: User | null): void;
  getAllUsers(): User[];
  saveUsers(users: User[]): void;
  
  // App State
  getAppState(): AppState;
  saveAppState(state: Partial<AppState>): void;
  
  // Clear
  clearAll(): void;
}

class LocalStorageService implements StorageService {
  // Events
  getEvents(): Event[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading events:", error);
      return [];
    }
  }

  saveEvents(events: Event[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error("Error saving events:", error);
    }
  }

  getEventById(id: string): Event | null {
    const events = this.getEvents();
    return events.find((e) => e.id === id) || null;
  }

  // Users
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error loading current user:", error);
      return null;
    }
  }

  setCurrentUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (error) {
      console.error("Error saving current user:", error);
    }
  }

  getAllUsers(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading users:", error);
      return [];
    }
  }

  saveUsers(users: User[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users:", error);
    }
  }

  // App State
  getAppState(): AppState {
    return {
      currentUser: this.getCurrentUser(),
      events: this.getEvents(),
      selectedEvent: null,
    };
  }

  saveAppState(state: Partial<AppState>): void {
    if (state.currentUser !== undefined) {
      this.setCurrentUser(state.currentUser);
    }
    if (state.events) {
      this.saveEvents(state.events);
    }
  }

  // Clear
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.USERS);
  }
}

// Singleton instance
export const storage = new LocalStorageService();

// Helper functions para facilitar migração futura
export const storageHelpers = {
  // Simula delay de API (útil para testes)
  async withDelay<T>(fn: () => T, ms: number = 100): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return fn();
  },

  // Wrapper que pode ser facilmente substituído por chamadas de API
  async getEvents(): Promise<Event[]> {
    return storage.getEvents();
  },

  async saveEvents(events: Event[]): Promise<void> {
    storage.saveEvents(events);
  },

  async getCurrentUser(): Promise<User | null> {
    return storage.getCurrentUser();
  },

  async setCurrentUser(user: User | null): Promise<void> {
    storage.setCurrentUser(user);
  },
};
