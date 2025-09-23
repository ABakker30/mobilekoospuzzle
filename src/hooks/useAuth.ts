import { useEffect } from 'react';
import { useWorkspace } from '../components/workspace/WorkspaceProvider';
import { authService } from '../services/auth/AuthService';

/**
 * Hook to integrate authentication with workspace state
 * Automatically syncs auth state with workspace context
 */
export const useAuth = () => {
  const { state, setUser, setSyncStatus } = useWorkspace();

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setSyncStatus(user ? 'synced' : 'offline');
    });

    // Initialize with current user
    authService.getCurrentUser().then((user) => {
      setUser(user);
      setSyncStatus(user ? 'synced' : 'offline');
    });

    return unsubscribe;
  }, [setUser, setSyncStatus]);

  // Auth actions
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setSyncStatus('syncing');
      const user = await authService.signInWithEmail(email, password);
      setSyncStatus('synced');
      return user;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setSyncStatus('syncing');
      const user = await authService.signInWithGoogle();
      setSyncStatus('synced');
      return user;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  const signInAnonymously = async () => {
    try {
      setSyncStatus('syncing');
      const user = await authService.signInAnonymously();
      setSyncStatus('synced');
      return user;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setSyncStatus('syncing');
      await authService.signOut();
      setSyncStatus('offline');
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<NonNullable<typeof state.user>>) => {
    if (!state.user) throw new Error('No user logged in');
    
    try {
      setSyncStatus('syncing');
      await authService.updateProfile(updates);
      setSyncStatus('synced');
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  return {
    // Current state
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isOnline: state.isOnline,
    syncStatus: state.syncStatus,
    
    // Auth actions
    signInWithEmail,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    updateProfile,
    
    // Utility
    isLoading: state.syncStatus === 'syncing'
  };
};
