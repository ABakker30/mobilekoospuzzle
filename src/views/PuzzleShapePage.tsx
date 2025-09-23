// Placeholder notice removed—page now functional.
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import ShapeEditor3D, { ShapeEditor3DRef } from '../components/shape/ShapeEditor3D';
import ShapeToolbar from '../components/shape/ShapeToolbar';
import LibraryBrowser from '../components/shape/LibraryBrowser';
import SettingsModal, { AppSettings } from '../components/shape/SettingsModal';
import { FCCCoord, fccToWorld } from '../lib/coords/fcc';
import { computeShortCID } from '../lib/cid';
import { saveJSONFile } from '../services/files';
import { validateContainerV1, containerToV1Format } from '../lib/guards/containerV1';
import { analyzeConvexHull, calculateOptimalCameraPosition } from '../lib/geometry/hull';
import { PBRIntegrationService } from '../services/pbrIntegration';

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
  const [needsAutoOrient, setNeedsAutoOrient] = useState(false);
  
  // Ref to access ShapeEditor3D for center & orient functionality
  const shapeEditorRef = useRef<ShapeEditor3DRef>(null);
  // Load settings from localStorage or use defaults
  const loadSettings = (): AppSettings => {
    try {
      const savedSettings = localStorage.getItem('puzzleShapeSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Validate that all required properties exist, merge with defaults if needed
        return {
          brightness: parsed.brightness ?? 4.0,
          backgroundColor: parsed.backgroundColor ?? '#000000',
          material: {
            type: parsed.material?.type ?? 'paint',
            color: parsed.material?.color ?? '#4a90e2',
            metalness: parsed.material?.metalness ?? 0.06,
            transparency: parsed.material?.transparency ?? 0.0,
            reflectiveness: parsed.material?.reflectiveness ?? 0.80
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
      brightness: 4.0,
      backgroundColor: '#000000',
      material: {
        type: 'paint',
        color: '#4a90e2',
        metalness: 0.06,
        transparency: 0.0,
        reflectiveness: 0.80
      },
      camera: {
        orthographic: false,
        focalLength: 50
      }
    };
  };

  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  
  // PBR Integration
  const pbrService = useRef<PBRIntegrationService>(PBRIntegrationService.getInstance());
  const [pbrState, setPbrState] = useState(pbrService.current.getState());
  
  // Initialize PBR integration when component mounts
  useEffect(() => {
    const unsubscribe = pbrService.current.onStateChange((state) => {
      setPbrState(state);
    });
    
    return unsubscribe;
  }, []);

  // Handle coordinate changes with history tracking
  const handleCoordinatesChange = (newCoordinates: FCCCoord[]) => {
    console.log(`📝 COORDINATE CHANGE: ${coordinates.length} → ${newCoordinates.length} cells`);
    
    // Add current coordinates to history before changing (max 10 steps)
    setCoordinatesHistory(prev => {
      const newHistory = [coordinates, ...prev].slice(0, 10);
      console.log(`📝 HISTORY: Added step, now ${newHistory.length} steps in history`);
      return newHistory;
    });
    setCoordinates(newCoordinates);
  };

  // Undo function
  const handleUndo = () => {
    if (coordinatesHistory.length > 0) {
      const [previousCoordinates, ...remainingHistory] = coordinatesHistory;
      console.log(`🔄 UNDO: Reverting to previous coordinates (${previousCoordinates.length} cells)`);
      console.log(`🔄 UNDO: Remaining history steps: ${remainingHistory.length}`);
      
      // Set coordinates directly (this will trigger the transformation-aware coordinate update)
      setCoordinates(previousCoordinates);
      setCoordinatesHistory(remainingHistory);
      
      console.log(`🔄 UNDO: Coordinates reverted, transformation state will be preserved if active`);
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

  // Handle auto-orient when coordinates are set after container load
  useEffect(() => {
    console.log('🎯 AUTO-ORIENT: useEffect triggered');
    console.log(`🎯 AUTO-ORIENT: needsAutoOrient = ${needsAutoOrient}`);
    console.log(`🎯 AUTO-ORIENT: coordinates.length = ${coordinates.length}`);
    
    const handleAutoOrient = async () => {
      // Check if we have a pending auto-orient request
      if (needsAutoOrient && coordinates.length >= 4) {
        console.log('🎯 AUTO-ORIENT: ✅ CONDITIONS MET - Starting auto-orient process');
        console.log(`🎯 AUTO-ORIENT: Have ${coordinates.length} coordinates`);
        
        // Clear the flag
        setNeedsAutoOrient(false);
        
        // Wait longer for first load after page refresh (Three.js needs more time to initialize)
        const isFirstLoad = !(window as any).hasLoadedBefore;
        const delay = isFirstLoad ? 2500 : 1000; // Longer delay for first load
        
        console.log(`🎯 AUTO-ORIENT: Using ${delay}ms delay (first load: ${isFirstLoad})`);
        
        setTimeout(async () => {
          // Enhanced readiness check for first load
          if (shapeEditorRef.current) {
            try {
              // Additional check: make sure ShapeEditor3D has cell records
              const cellRecords = shapeEditorRef.current.getCellRecords();
              if (!cellRecords || cellRecords.length === 0) {
                console.warn('🎯 AUTO-ORIENT: ShapeEditor3D exists but no cell records yet, skipping auto-orient');
                return;
              }
              
              console.log(`🎯 AUTO-ORIENT: ShapeEditor3D fully ready with ${cellRecords.length} cell records, triggering button press...`);
              await handleCenterOrient();
              console.log('🎯 AUTO-ORIENT: Auto-orient completed successfully');
              
              // Mark that we've successfully loaded at least once
              (window as any).hasLoadedBefore = true;
            } catch (err) {
              console.warn('🎯 AUTO-ORIENT: Auto-orient failed:', err);
            }
          } else {
            console.warn('🎯 AUTO-ORIENT: ShapeEditor3D not ready, skipping auto-orient');
          }
        }, delay);
      } else {
        console.log('🎯 AUTO-ORIENT: ❌ CONDITIONS NOT MET');
        console.log(`🎯 AUTO-ORIENT: needsAutoOrient = ${needsAutoOrient}`);
        console.log(`🎯 AUTO-ORIENT: coordinates.length = ${coordinates.length} (need >= 4)`);
      }
    };
    
    handleAutoOrient();
  }, [coordinates, needsAutoOrient]);

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
    if (coordinates.length === 0) {
      setError('Cannot save empty shape. Add some cells first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('💾 SAVE: Starting save process...');
      console.log(`💾 SAVE: Saving ${coordinates.length} cells in engine format`);
      
      // Convert coordinates to engine format (integer arrays)
      const coordsArray = coordinates.map(coord => [coord.x, coord.y, coord.z]);
      console.log(`💾 SAVE: Engine coordinates:`, coordsArray);
      
      // Generate proper full CID from current coordinates
      const fullCID = await computeShortCID(coordinates);
      const properCID = `sha256:${fullCID}${'0'.repeat(64 - fullCID.length)}`;
      console.log(`💾 SAVE: Generated CID: ${properCID}`);
      
      const container = containerToV1Format(
        coordsArray,
        containerName || 'Untitled Container',
        properCID,
        {
          name: 'Mobile Shape Editor',
          date: new Date().toISOString().split('T')[0],
          email: 'user@koospuzzle.com'
        }
      );
      
      console.log(`💾 SAVE: Container format:`, container);
      
      const filename = containerName 
        ? `${containerName.toLowerCase().replace(/\s+/g, '_')}.fcc.json`
        : 'container.fcc.json';
      
      console.log(`💾 SAVE: Saving to file: ${filename}`);
      await saveJSONFile(container, filename);
      
      // Update original CID after successful save
      setOriginalCID(currentCID);
      
      console.log('💾 SAVE: File saved successfully!');
      console.log(`💾 SAVE: Updated original CID to: ${currentCID}`);
      
    } catch (err) {
      setError(`Save failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseLibrary = () => {
    setShowLibraryBrowser(true);
  };

  const handleCenterOrient = async () => {
    console.log(`🎯 HULL: handleCenterOrient called with ${coordinates.length} coordinates`);
    
    if (coordinates.length < 4) {
      console.log('🎯 HULL: Not enough coordinates for hull analysis');
      setError('Need at least 4 cells for hull analysis');
      return;
    }

    try {
      setLoading(true);
      console.log('🎯 HULL: Starting hull analysis...');
      
      // Get ShapeEditor3D reference
      if (!shapeEditorRef.current || !shapeEditorRef.current.getCellRecords) {
        setError('ShapeEditor3D not ready for orientation');
        return;
      }

      // Get fresh world coordinates using the SAME method that works for initial load
      // This ensures we analyze coordinates in the exact same way as the working auto-orient
      console.log('🎯 Getting fresh world coordinates using ShapeEditor3D reset method...');
      
      // Force a reset to get fresh coordinates in the same format as initial load
      const resetRecords = shapeEditorRef.current.resetToOriginalTransform ? 
        shapeEditorRef.current.resetToOriginalTransform(coordinates) :
        shapeEditorRef.current.getCellRecords();
      
      if (!resetRecords || resetRecords.length === 0) {
        setError('Failed to get reset coordinates for hull analysis');
        return;
      }
      
      // Extract world coordinates from the reset records (same as initial load)
      const freshWorldPoints = resetRecords.map((record: any) => record.worldCoord);
      
      console.log('🎯 Using ShapeEditor3D reset coordinates for hull analysis');
      console.log(`🎯 Fresh coordinates: ${freshWorldPoints.length} points`);
      
      // Perform convex hull analysis on the reset coordinates
      const hullAnalysis = analyzeConvexHull(freshWorldPoints);
      
      console.log(`🎯 Center & Orient: Hull analysis complete`);
      console.log(`🎯 Largest face area: ${hullAnalysis.largestFace.area.toFixed(3)}`);
      
      // Apply orientation transformation to all cell records
      if (shapeEditorRef.current.applyCenterOrientTransform) {
        await shapeEditorRef.current.applyCenterOrientTransform(hullAnalysis.orientationMatrix);
        console.log('🎯 Center & Orient: Transformation applied successfully');
      } else {
        setError('ShapeEditor3D does not support center & orient transformation');
      }
      
    } catch (err) {
      console.error('🎯 Center & Orient Error:', err);
      setError(`Center & Orient failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLibraryContainerSelect = async (container: any, name: string) => {
    console.log('📦 CONTAINER LOAD: Starting container selection process...');
    console.log(`📦 CONTAINER LOAD: Loading container: ${name}`);
    
    // Clear all existing data first - comprehensive reset
    console.log('📦 CONTAINER LOAD: Clearing all existing state...');
    setCoordinates([]);
    setContainerName('');
    setCurrentCID('');
    setOriginalCID('');
    setError('');
    setLoading(false); // Ensure loading state is cleared
    
    // Force ShapeEditor3D to completely reset transformation state if it exists
    if (shapeEditorRef.current && shapeEditorRef.current.resetToOriginalTransform) {
      console.log('📦 CONTAINER LOAD: Forcing complete ShapeEditor3D transformation reset...');
      try {
        // Reset with empty coordinates to clear all transformation state
        shapeEditorRef.current.resetToOriginalTransform([]);
        console.log('📦 CONTAINER LOAD: ShapeEditor3D transformation state cleared');
      } catch (err) {
        console.warn('📦 CONTAINER LOAD: Failed to reset ShapeEditor3D state:', err);
      }
    }
    
    // Small delay to ensure state is fully cleared before loading new container
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Process the container the same way as file loading
    console.log('📦 CONTAINER LOAD: Validating container format...');
    const validation = validateContainerV1(container);
    
    if (!validation.valid) {
      console.error('📦 CONTAINER LOAD: Container validation failed:', validation.error);
      setError(`Invalid container: ${validation.error}`);
      return;
    }
    
    const validContainer = validation.container!;
    const fccCoords: FCCCoord[] = validContainer.cells!.map(([x, y, z]) => ({ x, y, z }));
    
    console.log(`📦 CONTAINER LOAD: Setting coordinates (${fccCoords.length} cells)...`);
    setCoordinates(fccCoords);
    setContainerName(name.replace('.fcc.json', ''));
    
    console.log('📦 CONTAINER LOAD: Container data loaded, coordinates set');
    
    // Set original CID for comparison
    if (validContainer.cid) {
      const shortOriginalCID = validContainer.cid.substring(7, 15);
      setOriginalCID(shortOriginalCID);
    } else {
      setOriginalCID('');
    }

    // Mark that we want to auto-orient this shape (will be handled by useEffect)
    if (fccCoords.length >= 4) {
      console.log('🎯 AUTO-ORIENT: Marking shape for auto-orient...');
      console.log(`🎯 AUTO-ORIENT: Shape has ${fccCoords.length} cells, will auto-orient when coordinates are set`);
      
      // Set React state to trigger auto-orient
      console.log('🎯 AUTO-ORIENT: Setting needsAutoOrient to true...');
      setNeedsAutoOrient(true);
    } else {
      console.log(`🎯 AUTO-ORIENT: Shape has only ${fccCoords.length} cells, skipping auto-orient (need 4+)`);
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
    
    // Update PBR materials when settings change
    if (shapeEditorRef.current) {
      console.log('🎨 Settings changed, updating PBR materials...');
      shapeEditorRef.current.updateMaterialSettings(newSettings.material);
    }
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
          onCenterOrient={handleCenterOrient}
          loading={loading}
        />
      </div>
      
      <div style={{ 
        flex: 1, 
        position: 'relative',
        backgroundColor: '#f0f0f0' // Container background (not 3D scene)
      }}>
        <ShapeEditor3D
          ref={shapeEditorRef}
          coordinates={coordinates}
          onCoordinatesChange={handleCoordinatesChange}
          editMode={editMode}
          editingEnabled={editingEnabled}
          settings={settings}
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
