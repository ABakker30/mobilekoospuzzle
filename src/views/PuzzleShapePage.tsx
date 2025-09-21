// Placeholder notice removed—page now functional.
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ShapeEditor3D from '../components/shape/ShapeEditor3D';
import ShapeToolbar from '../components/shape/ShapeToolbar';
import LibraryBrowser from '../components/shape/LibraryBrowser';
import SettingsModal, { AppSettings } from '../components/shape/SettingsModal';
import { FCCCoord } from '../lib/coords/fcc';
import { computeShortCID } from '../lib/cid';
import { saveJSONFile } from '../services/files';
import { validateContainerV1, containerToV1Format } from '../lib/guards/containerV1';

export default function PuzzleShapePage() {
  // Removed excessive logging to prevent console spam
  
  const [coordinates, setCoordinates] = useState<FCCCoord[]>([]);
  const [coordinatesHistory, setCoordinatesHistory] = useState<FCCCoord[][]>([]);
  const [editMode, setEditMode] = useState<'add' | 'delete'>('add');
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [currentCID, setCurrentCID] = useState<string>('');
  const [originalCID, setOriginalCID] = useState<string>('');
  const [containerName, setContainerName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showLibraryBrowser, setShowLibraryBrowser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Load settings from localStorage or use defaults
  const loadSettings = (): AppSettings => {
    try {
      const savedSettings = localStorage.getItem('puzzleShapeSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Validate that all required properties exist, merge with defaults if needed
        return {
          brightness: parsed.brightness ?? 1.8,
          backgroundColor: parsed.backgroundColor ?? '#ffffff',
          material: {
            type: parsed.material?.type ?? 'paint',
            color: parsed.material?.color ?? '#4a90e2',
            metalness: parsed.material?.metalness ?? 0.0,
            transparency: parsed.material?.transparency ?? 0.0,
            reflectiveness: parsed.material?.reflectiveness ?? 0.2
          },
          camera: {
            orthographic: parsed.camera?.orthographic ?? false,
            focalLength: parsed.camera?.focalLength ?? 50
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    
    // Return defaults if loading failed
    return {
      brightness: 1.8,
      backgroundColor: '#ffffff',
      material: {
        type: 'paint',
        color: '#4a90e2',
        metalness: 0.0,
        transparency: 0.0,
        reflectiveness: 0.2
      },
      camera: {
        orthographic: false,
        focalLength: 50
      }
    };
  };

  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Handle coordinate changes with history tracking
  const handleCoordinatesChange = (newCoordinates: FCCCoord[]) => {
    // Add current coordinates to history before changing (max 10 steps)
    setCoordinatesHistory(prev => {
      const newHistory = [coordinates, ...prev].slice(0, 10);
      return newHistory;
    });
    setCoordinates(newCoordinates);
  };

  // Undo function
  const handleUndo = () => {
    if (coordinatesHistory.length > 0) {
      const [previousCoordinates, ...remainingHistory] = coordinatesHistory;
      setCoordinates(previousCoordinates);
      setCoordinatesHistory(remainingHistory);
    }
  };
  
  // Detect if this is a page reload and persist state
  useEffect(() => {
    console.log('PuzzleShapePage: Component mounted/unmounted');
    
    // Try to restore state from sessionStorage on mount
    const savedState = sessionStorage.getItem('puzzleShapeState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        console.log('PuzzleShapePage: Restoring state from sessionStorage:', state);
        if (state.coordinates && state.coordinates.length > 0) {
          setCoordinates(state.coordinates);
          setContainerName(state.containerName || 'Restored Container');
          setOriginalCID(state.originalCID || '');
        }
      } catch (err) {
        console.error('Failed to restore state:', err);
      }
    }
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('PuzzleShapePage: Page is about to reload/navigate away!');
      
      // Only prevent navigation for intentional user actions, not automatic reloads
      // Check if this is likely an intentional navigation (user clicked back, refresh, etc.)
      if (coordinates.length > 0 && e.type === 'beforeunload') {
        // Don't prevent on mobile - let the sessionStorage handle recovery
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
          e.preventDefault();
          e.returnValue = 'You have a loaded container. Are you sure you want to leave?';
          return 'You have a loaded container. Are you sure you want to leave?';
        }
      }
    };
    
    const handleUnload = (e: Event) => {
      console.log('PuzzleShapePage: Page is unloading!');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    return () => {
      console.log('PuzzleShapePage: Component unmounting - cleanup');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []); // Only run once on mount, not when coordinates change
  
  // Removed state logging to prevent console spam

  // Update CID when coordinates change
  useEffect(() => {
    const updateCID = async () => {
      try {
        const cid = await computeShortCID(coordinates);
        setCurrentCID(cid);
      } catch (err) {
        console.error('Failed to compute CID:', err);
        setCurrentCID('error');
      }
    };
    
    updateCID();
  }, [coordinates]);

  // Save state to sessionStorage when coordinates change
  useEffect(() => {
    if (coordinates.length > 0) {
      const state = {
        coordinates,
        containerName,
        originalCID
      };
      sessionStorage.setItem('puzzleShapeState', JSON.stringify(state));
    }
  }, [coordinates, containerName, originalCID]);


  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      const coordsArray = coordinates.map(coord => [coord.x, coord.y, coord.z]);
      const fullCID = `sha256:${currentCID}${'0'.repeat(56)}`; // Placeholder for demo
      
      const container = containerToV1Format(
        coordsArray,
        containerName || 'Untitled Container',
        fullCID,
        {
          name: 'Mobile Shape Editor',
          date: new Date().toISOString().split('T')[0]
        }
      );
      
      const filename = containerName 
        ? `${containerName.toLowerCase().replace(/\s+/g, '_')}.fcc.json`
        : 'container.fcc.json';
      
      await saveJSONFile(container, filename);
      
      // Update original CID after successful save
      setOriginalCID(currentCID);
      
    } catch (err) {
      setError(`Save failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseLibrary = () => {
    setShowLibraryBrowser(true);
  };

  const handleLibraryContainerSelect = (container: any, name: string) => {
    // Clear all existing data first
    setCoordinates([]);
    setContainerName('');
    setCurrentCID('');
    setOriginalCID('');
    setError('');
    
    // Process the container the same way as file loading
    const validation = validateContainerV1(container);
    
    if (!validation.valid) {
      setError(`Invalid container: ${validation.error}`);
      return;
    }
    
    const validContainer = validation.container!;
    const fccCoords: FCCCoord[] = validContainer.cells!.map(([x, y, z]) => ({ x, y, z }));
    
    setCoordinates(fccCoords);
    setContainerName(name.replace('.fcc.json', ''));
    
    // Set original CID for comparison
    if (validContainer.cid) {
      const shortOriginalCID = validContainer.cid.substring(7, 15);
      setOriginalCID(shortOriginalCID);
    } else {
      setOriginalCID('');
    }
  };

  const handleLibraryClose = () => {
    setShowLibraryBrowser(false);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('puzzleShapeSettings', JSON.stringify(settings));
      console.log('Settings saved to localStorage');
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const handleSettingsClose = () => {
    setShowSettings(false);
    // Controls will be re-enabled automatically through the settings effect
  };

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100dvh',
      margin: 0,
      padding: 0,
      fontFamily: 'system-ui, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{ flexShrink: 0 }}>
        <ShapeToolbar
          cellCount={coordinates.length}
          currentCID={currentCID}
          originalCID={originalCID}
          editMode={editMode}
          editingEnabled={editingEnabled}
          canUndo={coordinatesHistory.length > 0}
          onSave={handleSave}
          onBrowseLibrary={handleBrowseLibrary}
          onSettings={handleSettings}
          onEditModeChange={setEditMode}
          onEditingEnabledChange={setEditingEnabled}
          onUndo={handleUndo}
          loading={loading}
        />
      </div>
      
      <div style={{ 
        flex: 1, 
        position: 'relative',
        backgroundColor: '#f0f0f0' // Container background (not 3D scene)
      }}>
        <ShapeEditor3D
          coordinates={coordinates}
          settings={settings}
          editMode={editMode}
          editingEnabled={editingEnabled}
          onCoordinatesChange={handleCoordinatesChange}
        />
      </div>
      
      {/* Back to Home - floating button */}
      <Link 
        to="/" 
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          display: 'inline-block',
          padding: '12px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        ← Home
      </Link>
      
      {/* Error display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '160px',
          left: '20px',
          right: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #f5c6cb',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          {error}
          <button
            onClick={() => setError('')}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#721c24',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Library Browser Modal */}
      {showLibraryBrowser && (
        <LibraryBrowser
          onContainerSelect={handleLibraryContainerSelect}
          onClose={handleLibraryClose}
          loading={loading}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={handleSettingsClose}
        />
      )}
    </div>
  );
}
