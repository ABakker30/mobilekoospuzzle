import React, { useState, useRef } from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';
import ShapeEditor3D, { ShapeEditor3DRef } from '../../shape/ShapeEditor3D';
import { useAuth } from '../../../hooks/useAuth';
import { useWorkspace } from '../../workspace/WorkspaceProvider';
import { shapeService } from '../../../services/content/ShapeService';

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

  const handleLoadShape = async () => {
    try {
      // Use the File System Access API or fallback to input element
      const fileHandle = await (window as any).showOpenFilePicker({
        types: [{
          description: 'Container files',
          accept: { 'application/json': ['.json'] }
        }]
      });
      
      const file = await fileHandle[0].getFile();
      const text = await file.text();
      const container = JSON.parse(text);
      
      // Convert container coordinates to FCCCoord format
      if (container.coordinates && Array.isArray(container.coordinates)) {
        const coordinates = container.coordinates.map((coord: any) => ({
          i: coord.i || 0,
          j: coord.j || 0, 
          k: coord.k || 0,
          x: coord.x || 0,
          y: coord.y || 0,
          z: coord.z || 0
        }));
        
        // Update workspace coordinates directly
        updateCoordinates(coordinates);
        alert(`Loaded ${coordinates.length} coordinates from container file`);
      }
    } catch (error) {
      // Fallback for browsers without File System Access API
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const text = await file.text();
          try {
            const container = JSON.parse(text);
            if (container.coordinates && Array.isArray(container.coordinates)) {
              const coordinates = container.coordinates.map((coord: any) => ({
                i: coord.i || 0,
                j: coord.j || 0, 
                k: coord.k || 0,
                x: coord.x || 0,
                y: coord.y || 0,
                z: coord.z || 0
              }));
              
              updateCoordinates(coordinates);
              alert(`Loaded ${coordinates.length} coordinates from container file`);
            }
          } catch (parseError) {
            alert('Invalid container file format');
          }
        }
      };
      input.click();
    }
  };

  const handleBrightnessChange = (brightness: number) => {
    onSettingsChange({ brightness });
  };

  return (
    <div style={{ 
      padding: '1rem', 
      background: '#f8f9fa', 
      borderBottom: '1px solid #dee2e6',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🧩</span>
        <div>
          <h3 style={{ margin: 0, color: '#007bff', fontSize: '1rem' }}>Puzzle Shape Mode</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#6c757d' }}>
            Create and edit 3D puzzle shapes
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: '#495057' }}>Brightness:</label>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.1"
            value={settings.brightness}
            onChange={(e) => handleBrightnessChange(parseFloat(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '0.75rem', color: '#6c757d', minWidth: '2rem' }}>
            {settings.brightness.toFixed(1)}
          </span>
        </div>

        <button
          onClick={handleLoadShape}
          style={{
            padding: '0.5rem 1rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          📁 Load Container
        </button>

        <button
          onClick={handleSaveShape}
          disabled={isLoading}
          style={{
            padding: '0.5rem 1rem',
            background: user ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: user ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Saving...' : user ? '💾 Save Shape' : '🔒 Sign in to Save'}
        </button>
      </div>
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
