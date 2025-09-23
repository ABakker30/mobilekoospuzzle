// Firebase Authentication Service
// This will be implemented when Firebase is set up

import { UserProfile } from '../../types/workspace';

export interface AuthService {
  // Authentication methods
  signInWithEmail(email: string, password: string): Promise<UserProfile>;
  signInWithGoogle(): Promise<UserProfile>;
  signInAnonymously(): Promise<UserProfile>;
  signOut(): Promise<void>;
  
  // User management
  getCurrentUser(): Promise<UserProfile | null>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
  deleteAccount(): Promise<void>;
  
  // Auth state
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void;
}

// Mock implementation for development
export class MockAuthService implements AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: ((user: UserProfile | null) => void)[] = [];

  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    // Mock authentication
    const user: UserProfile = {
      uid: `mock-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      createdAt: Date.now(),
      stats: {
        shapesCreated: 0,
        solutionsFound: 0,
        puzzlesSolved: 0,
        communityRank: 0
      },
      preferences: {
        defaultMaterial: 'standard',
        defaultCamera: {
          orthographic: false,
          focalLength: 50
        },
        notifications: {
          newSolutions: true,
          communityUpdates: true,
          achievements: true
        }
      }
    };
    
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  async signInWithGoogle(): Promise<UserProfile> {
    const user: UserProfile = {
      uid: `google-${Date.now()}`,
      email: 'user@gmail.com',
      displayName: 'Google User',
      avatar: 'https://via.placeholder.com/40',
      createdAt: Date.now(),
      stats: {
        shapesCreated: 3,
        solutionsFound: 7,
        puzzlesSolved: 5,
        communityRank: 15
      },
      preferences: {
        defaultMaterial: 'pbr-gold',
        defaultCamera: {
          orthographic: false,
          focalLength: 50
        },
        notifications: {
          newSolutions: true,
          communityUpdates: false,
          achievements: true
        }
      }
    };
    
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  async signInAnonymously(): Promise<UserProfile> {
    const user: UserProfile = {
      uid: `anon-${Date.now()}`,
      displayName: 'Anonymous User',
      createdAt: Date.now(),
      stats: {
        shapesCreated: 0,
        solutionsFound: 0,
        puzzlesSolved: 0,
        communityRank: 0
      },
      preferences: {
        defaultMaterial: 'standard',
        defaultCamera: {
          orthographic: false,
          focalLength: 50
        },
        notifications: {
          newSolutions: false,
          communityUpdates: false,
          achievements: false
        }
      }
    };
    
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.notifyListeners();
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return this.currentUser;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates };
      this.notifyListeners();
    }
  }

  async deleteAccount(): Promise<void> {
    this.currentUser = null;
    this.notifyListeners();
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

// Export singleton instance
export const authService = new MockAuthService();
