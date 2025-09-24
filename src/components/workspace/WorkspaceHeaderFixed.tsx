import React, { useState } from 'react';
import { useWorkspace } from './WorkspaceProvider';

export const WorkspaceHeaderFixed: React.FC = () => {
  const { state, setMode, updateModeState } = useWorkspace();
  const { currentMode, coordinates } = state;
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [editAction, setEditAction] = useState<'add' | 'remove'>('add');

  // Simple mode list without external dependencies
  const modes = [
    { id: 'shape', name: 'Shape', color: '#007bff' },
    { id: 'view-solution', name: 'View', color: '#28a745' },
    { id: 'auto-solve', name: 'Solver', color: '#6f42c1' },
    { id: 'manual-solve', name: 'Puzzle', color: '#fd7e14' }
  ];

  const isEditMode = state.modeState[currentMode]?.editingEnabled === true;

  return (
    <header style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '0.75rem 1rem',
      background: 'white',
      borderBottom: '1px solid #e9ecef',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      gap: '0.5rem'
    }}>
      {/* Main header line */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Mode Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: modes.find(m => m.id === currentMode)?.color || '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {modes.find(m => m.id === currentMode)?.name || 'Shape'}
            <span style={{ fontSize: '12px' }}>▼</span>
          </button>

          {showModeDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 1000,
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '120px',
              marginTop: '4px'
            }}>
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setMode(mode.id as any);
                    setShowModeDropdown(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    background: currentMode === mode.id ? '#f8f9fa' : 'white',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '14px',
                    cursor: 'pointer',
                    borderRadius: currentMode === mode.id ? '4px' : '0'
                  }}
                >
                  {mode.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cell Counter */}
        <div style={{
          padding: '0.25rem 0.75rem',
          background: '#f8f9fa',
          borderRadius: '12px',
          fontSize: '12px',
          color: '#6c757d',
          fontWeight: '500'
        }}>
          {coordinates.length} cells
        </div>

        {/* Settings Button */}
        <button style={{
          padding: '0.5rem',
          background: 'none',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          ⚙️
        </button>
      </div>

      {/* Mode-specific controls */}
      {currentMode === 'shape' && coordinates.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid #f0f0f0'
        }}>
          <button style={{
            padding: '0.5rem 1rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}>
            Browse
          </button>
          
          <button style={{
            padding: '0.5rem 1rem',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}>
            Save
          </button>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '12px',
            cursor: 'pointer'
          }}>
            <input 
              type="checkbox" 
              checked={isEditMode}
              onChange={(e) => {
                const enabled = e.target.checked;
                updateModeState(currentMode, { 
                  editingEnabled: enabled,
                  editMode: enabled ? editAction : undefined
                });
              }}
            />
            Edit
          </label>

          {isEditMode && (
            <button
              onClick={() => {
                const newAction = editAction === 'add' ? 'remove' : 'add';
                setEditAction(newAction);
                updateModeState(currentMode, { editMode: newAction });
              }}
              style={{
                padding: '0.25rem 0.5rem',
                background: editAction === 'add' ? '#28a745' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {editAction === 'add' ? 'Add' : 'Remove'}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
