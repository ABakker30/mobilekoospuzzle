// UI-only port; engines remain upstream.
import React from 'react';

interface ShapeToolbarProps {
  cellCount: number;
  currentCID: string;
  originalCID: string;
  editMode: 'add' | 'delete';
  editingEnabled: boolean;
  onSave: () => void;
  onBrowseLibrary: () => void;
  onSettings: () => void;
  onEditModeChange: (mode: 'add' | 'delete') => void;
  onEditingEnabledChange: (enabled: boolean) => void;
  loading?: boolean;
}

export default function ShapeToolbar({
  cellCount,
  currentCID,
  originalCID,
  editMode,
  editingEnabled,
  onSave,
  onBrowseLibrary,
  onSettings,
  onEditModeChange,
  onEditingEnabledChange,
  loading = false
}: ShapeToolbarProps) {
  const hasChanges = originalCID && currentCID !== originalCID;

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Top row - Browse Library/Save and Cell count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onBrowseLibrary}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Browse Library
          </button>
          
          <button
            onClick={onSettings}
            disabled={loading}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
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
            onClick={onSave}
            disabled={loading || cellCount === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: cellCount === 0 ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (loading || cellCount === 0) ? 'not-allowed' : 'pointer',
              opacity: (loading || cellCount === 0) ? 0.6 : 1
            }}
          >
            Save
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <span style={{ color: '#495057' }}>
            Cells: {cellCount}
          </span>
        </div>
      </div>

      {/* Second row - Edit mode controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Edit Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={editingEnabled}
              onChange={(e) => onEditingEnabledChange(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Edit Mode
            </span>
          </label>
        </div>

        {/* Add/Delete buttons - only show when editing is enabled */}
        {editingEnabled && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onEditModeChange('add')}
              style={{
                padding: '8px 16px',
                backgroundColor: editMode === 'add' ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '80px'
              }}
            >
              + Add
            </button>
            
            <button
              onClick={() => onEditModeChange('delete')}
              style={{
                padding: '8px 16px',
                backgroundColor: editMode === 'delete' ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '80px'
              }}
            >
              - Delete
            </button>
          </div>
        )}
      </div>

      {/* Bottom row - CID */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px'
      }}>
        <span style={{ color: '#495057', fontWeight: '500' }}>CID:</span>
          <code style={{
            backgroundColor: hasChanges ? '#fff3cd' : '#e9ecef',
            color: hasChanges ? '#856404' : '#495057',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '11px',
            fontFamily: 'monospace'
          }}>
            {currentCID || 'computing...'}
          </code>
          {hasChanges && (
            <span style={{
              color: '#856404',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              (modified)
            </span>
          )}
      </div>
    </div>
  );
}
