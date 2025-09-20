// UI-only port; engines remain upstream.
import React from 'react';

interface ShapeToolbarProps {
  cellCount: number;
  currentCID: string;
  originalCID: string;
  brightness: number;
  editMode: 'add' | 'delete';
  onSave: () => void;
  onBrowseLibrary: () => void;
  onBrightnessChange: (brightness: number) => void;
  onEditModeChange: (mode: 'add' | 'delete') => void;
  loading?: boolean;
}

export default function ShapeToolbar({
  cellCount,
  currentCID,
  originalCID,
  brightness,
  editMode,
  onSave,
  onBrowseLibrary,
  onBrightnessChange,
  onEditModeChange,
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

      {/* Middle row - Edit mode buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '4px'
      }}>
        <button
          onClick={() => onEditModeChange('add')}
          style={{
            padding: '10px 20px',
            backgroundColor: editMode === 'add' ? '#28a745' : '#e9ecef',
            color: editMode === 'add' ? 'white' : '#495057',
            border: 'none',
            borderRadius: '6px 0 0 6px',
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
            padding: '10px 20px',
            backgroundColor: editMode === 'delete' ? '#dc3545' : '#e9ecef',
            color: editMode === 'delete' ? 'white' : '#495057',
            border: 'none',
            borderRadius: '0 6px 6px 0',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            minWidth: '80px'
          }}
        >
          - Delete
        </button>
      </div>

      {/* Bottom row - Brightness and CID */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '200px'
        }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>
            Brightness:
          </label>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={brightness}
            onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
            style={{
              flex: 1,
              minWidth: '100px',
              height: '6px',
              borderRadius: '3px',
              background: '#ddd',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '12px', color: '#6c757d', minWidth: '30px' }}>
            {brightness.toFixed(1)}
          </span>
        </div>

        <div style={{
          display: 'flex',
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
    </div>
  );
}
