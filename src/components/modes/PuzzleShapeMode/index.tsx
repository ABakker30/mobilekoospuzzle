import React, { useState, useRef } from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';
import ShapeEditor3D, { ShapeEditor3DRef } from '../../shape/ShapeEditor3D';
import { useAuth } from '../../../hooks/useAuth';
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
        gap: '0.75rem',
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

        <button
          style={{
            padding: '0.75rem 1.25rem',
            background: '#007bff',
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
          ✏️ Edit
        </button>
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
  const editingEnabled = modeState.editingEnabled !== false; // Default to true

  const handleModeStateChange = (updates: any) => {
    onModeStateChange({ ...modeState, ...updates });
  };

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
      
      {/* Mode-specific controls overlay */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: 'rgba(255,255,255,0.9)',
        padding: '0.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '0.5rem',
        zIndex: 10
      }}>
        <button
          onClick={() => handleModeStateChange({ editMode: 'add' })}
          style={{
            padding: '0.5rem 1rem',
            background: editMode === 'add' ? '#007bff' : 'white',
            color: editMode === 'add' ? 'white' : '#007bff',
            border: '1px solid #007bff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          ➕ Add
        </button>
        <button
          onClick={() => handleModeStateChange({ editMode: 'delete' })}
          style={{
            padding: '0.5rem 1rem',
            background: editMode === 'delete' ? '#dc3545' : 'white',
            color: editMode === 'delete' ? 'white' : '#dc3545',
            border: '1px solid #dc3545',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          🗑️ Delete
        </button>
        <button
          onClick={() => handleModeStateChange({ editingEnabled: !editingEnabled })}
          style={{
            padding: '0.5rem 1rem',
            background: editingEnabled ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {editingEnabled ? '🔓 Editing' : '🔒 Locked'}
        </button>
      </div>

      {/* Coordinates info */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        zIndex: 10
      }}>
        {coordinates.length} cells
      </div>
    </div>
  );
};
