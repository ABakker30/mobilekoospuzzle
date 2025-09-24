import React, { useRef, useEffect } from 'react';
import ShapeEditor3D, { ShapeEditor3DRef } from '../../shape/ShapeEditor3D';
import { FileOrientationService } from '../../../services/fileSystem';
import { useWorkspace } from '../../workspace/WorkspaceProvider';
import { shapeService } from '../../../services/content/ShapeService';
import { LibraryBrowser } from '../../library/LibraryBrowser';

// Convert workspace settings to V1 AppSettings format
const convertToV1Settings = (workspaceSettings: any) => {
  return {
    brightness: workspaceSettings.brightness || 1.0,
    backgroundColor: workspaceSettings.backgroundColor || '#ffffff',
    camera: {
      orthographic: workspaceSettings.camera?.orthographic || false,
      focalLength: workspaceSettings.camera?.focalLength || 50
    },
    material: {
      type: workspaceSettings.material?.type || 'standard',
      color: workspaceSettings.material?.color || '#4a90e2',
      metalness: workspaceSettings.material?.metalness || 0.1,
      transparency: workspaceSettings.material?.transparency || 0.0,
      reflectiveness: workspaceSettings.material?.reflectiveness || 0.5
    }
  };
};

export const PuzzleShapeToolbar: React.FC<ModeToolbarProps> = ({
  settings,
  onSettingsChange,
  modeState,
  onModeStateChange
}) => {
  const { user } = useAuth();
  const { updateCoordinates } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editAction, setEditAction] = useState<'add' | 'delete'>('add');

  const handleSaveShape = async () => {
    if (!user) {
      alert('Please sign in to save shapes');
      return;
    }

    // For now, we'll save empty coordinates - this will be enhanced when we connect to the viewer
    try {
      setIsLoading(true);
      const cid = await shapeService.createShape([], {
        creator: user.uid,
        title: `Shape ${Date.now()}`,
        description: `Created in Puzzle Shape Mode`,
        tags: ['user-created'],
        difficulty: 1,
        isPublic: true,
        featured: false
      });
      
      alert(`Shape saved with ID: ${cid}`);
    } catch (error) {
      console.error('Failed to save shape:', error);
      alert('Failed to save shape. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseLibrary = () => {
    setShowLibrary(true);
  };

  const handleLibraryShapeSelect = (coordinates: any[]) => {
    updateCoordinates(coordinates);
    alert(`Loaded ${coordinates.length} coordinates from library shape`);
  };


  return (
    <div style={{ 
      padding: '0.75rem', 
      background: '#f8f9fa', 
      borderBottom: '1px solid #dee2e6',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      {/* Mode-specific controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleBrowseLibrary}
          style={{
            padding: '0.75rem 1.25rem',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📚 Browse
        </button>

        <button
          onClick={handleSaveShape}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.25rem',
            background: user ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: user ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: '500',
            opacity: isLoading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {isLoading ? 'Saving...' : user ? '💾 Save' : '🔒 Sign in'}
        </button>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          <input
            type="checkbox"
            checked={isEditMode}
            onChange={(e) => setIsEditMode(e.target.checked)}
            style={{ transform: 'scale(1.2)' }}
          />
          ✏️ Edit
        </label>

        {isEditMode && (
          <button
            onClick={() => setEditAction(editAction === 'add' ? 'delete' : 'add')}
            style={{
              padding: '0.5rem 1rem',
              background: editAction === 'add' ? '#28a745' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s ease'
            }}
          >
            {editAction === 'add' ? '➕ Add' : '➖ Remove'}
          </button>
        )}
      </div>

      <LibraryBrowser
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onShapeSelect={handleLibraryShapeSelect}
      />
    </div>
  );
};

export const PuzzleShapeViewer: React.FC<ModeViewerProps> = ({
  coordinates,
  settings,
  modeState,
  onCoordinatesChange,
  onModeStateChange
}) => {
  const editorRef = useRef<ShapeEditor3DRef>(null);
  
  // Get edit mode from mode state, default to 'add'
  const editMode = modeState.editMode || 'add';
  const editingEnabled = modeState.editingEnabled === true && coordinates.length > 0; // Only enable when explicitly set AND coordinates exist

  const handleModeStateChange = (updates: any) => {
    onModeStateChange({ ...modeState, ...updates });
  };

  // Handle automatic orientation when file is loaded
  useEffect(() => {
    if (modeState.shouldAutoOrient && modeState.pendingOrientation && editorRef.current && coordinates.length > 0) {
      console.log(`🎯 PuzzleShapeMode: Applying automatic orientation`);
      
      setTimeout(async () => {
        try {
          if (editorRef.current && editorRef.current.applyCenterOrientTransform) {
            const orientationMatrix = FileOrientationService.arrayToMatrix4(modeState.pendingOrientation.orientationMatrix);
            await editorRef.current.applyCenterOrientTransform(orientationMatrix);
            console.log(`🎯 PuzzleShapeMode: Hull orientation applied successfully`);
            
            // Store the applied orientation and clear pending
            handleModeStateChange({ 
              shouldAutoOrient: false, 
              pendingOrientation: null,
              appliedOrientation: modeState.pendingOrientation // Store for mode switching
            });
          }
        } catch (error) {
          console.error(`🎯 PuzzleShapeMode: Failed to apply orientation:`, error);
        }
      }, 300); // Short delay to ensure ShapeEditor3D is ready
    }
  }, [modeState.shouldAutoOrient, modeState.pendingOrientation, coordinates.length]);

  // Reapply stored orientation when switching back to this mode
  useEffect(() => {
    if (modeState.appliedOrientation && editorRef.current && coordinates.length > 0 && !modeState.shouldAutoOrient) {
      console.log(`🔄 PuzzleShapeMode: Reapplying stored orientation after mode switch`);
      
      setTimeout(async () => {
        try {
          if (editorRef.current && editorRef.current.applyCenterOrientTransform) {
            const orientationMatrix = FileOrientationService.arrayToMatrix4(modeState.appliedOrientation.orientationMatrix);
            await editorRef.current.applyCenterOrientTransform(orientationMatrix);
            console.log(`🔄 PuzzleShapeMode: Stored orientation reapplied successfully`);
          }
        } catch (error) {
          console.error(`🔄 PuzzleShapeMode: Failed to reapply stored orientation:`, error);
        }
      }, 300);
    }
  }, [coordinates.length, modeState.appliedOrientation]);

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <ShapeEditor3D
        ref={editorRef}
        coordinates={coordinates}
        onCoordinatesChange={onCoordinatesChange}
        editMode={editMode}
        editingEnabled={editingEnabled}
        settings={convertToV1Settings(settings)}
      />
    </div>
  );
};
