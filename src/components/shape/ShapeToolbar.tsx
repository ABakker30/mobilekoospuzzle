// UI-only port; engines remain upstream.
import React from 'react';

interface ShapeToolbarProps {
  cellCount: number;
  currentCID: string;
  originalCID: string;
  editMode: 'add' | 'delete';
  editingEnabled: boolean;
  canUndo: boolean;
  onSave: () => void;
  onBrowseLibrary: () => void;
  onSettings: () => void;
  onEditModeChange: (mode: 'add' | 'delete') => void;
  onEditingEnabledChange: (enabled: boolean) => void;
  onUndo: () => void;
  onCenterOrient: () => void;
  loading?: boolean;
}

export default function ShapeToolbar({
  cellCount,
  currentCID,
  originalCID,
  editMode,
  editingEnabled,
  canUndo,
  onSave,
  onBrowseLibrary,
  onSettings,
  onEditModeChange,
  onEditingEnabledChange,
  onUndo,
  onCenterOrient,
  loading = false
}: ShapeToolbarProps) {
  const hasChanges = originalCID && currentCID !== originalCID;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Top row - Main actions and cell count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={onBrowseLibrary}
            disabled={loading}
            style={{
              padding: '6px 12px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Browse
          </button>
          
          <button
            onClick={onSave}
            disabled={loading || cellCount === 0}
            style={{
              padding: '6px 12px',
              backgroundColor: cellCount === 0 ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: (loading || cellCount === 0) ? 'not-allowed' : 'pointer',
              opacity: (loading || cellCount === 0) ? 0.6 : 1
            }}
          >
            Save
          </button>
          
          <button
            onClick={onSettings}
            disabled={loading}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Settings"
          >
            ⚙️
          </button>

          <button
            onClick={onCenterOrient}
            disabled={loading || cellCount === 0}
            style={{
              padding: '8px 12px',
              backgroundColor: cellCount > 0 ? '#17a2b8' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: (loading || cellCount === 0) ? 'not-allowed' : 'pointer',
              opacity: (loading || cellCount === 0) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Center & Orient Shape"
          >
            🎯
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: '600',
          color: '#495057',
          backgroundColor: '#f8f9fa',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          Cells: {cellCount}
        </div>
      </div>

      {/* Second row - Edit mode controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Edit Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={editingEnabled}
              onChange={(e) => onEditingEnabledChange(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>
              Edit Mode
            </span>
          </label>
        </div>

        {/* Edit controls - only show when editing is enabled */}
        {editingEnabled && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onEditModeChange('add')}
              style={{
                padding: '6px 12px',
                backgroundColor: editMode === 'add' ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '60px'
              }}
            >
              + Add
            </button>
            
            <button
              onClick={() => onEditModeChange('delete')}
              style={{
                padding: '6px 12px',
                backgroundColor: editMode === 'delete' ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '60px'
              }}
            >
              - Delete
            </button>
            
            <button
              onClick={onUndo}
              disabled={!canUndo}
              style={{
                padding: '6px 12px',
                backgroundColor: canUndo ? '#ffc107' : '#6c757d',
                color: canUndo ? '#212529' : 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                opacity: canUndo ? 1 : 0.6,
                minWidth: '60px'
              }}
              title="Undo last action"
            >
              ↶ Undo
            </button>
          </div>
        )}
      </div>

      {/* Bottom row - CID (compact) */}
      {currentCID && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          padding: '4px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <span style={{ color: '#6c757d', fontWeight: '500' }}>CID:</span>
          <code style={{
            backgroundColor: hasChanges ? '#fff3cd' : 'transparent',
            color: hasChanges ? '#856404' : '#6c757d',
            padding: '1px 4px',
            borderRadius: '2px',
            fontSize: '9px',
            fontFamily: 'monospace',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentCID}
          </code>
          {hasChanges && (
            <span style={{
              color: '#856404',
              fontSize: '9px',
              fontWeight: '500'
            }}>
              (modified)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
