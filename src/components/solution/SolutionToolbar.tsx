// Solution Toolbar Component
// Toolbar for solution viewer with load and settings buttons

import React, { useState, useRef } from 'react';

interface SolutionToolbarProps {
  onLoadFile: (file: File) => void;
  onLoadFromUrl: (filename: string) => void;
  onSettings: () => void;
  loading: boolean;
  hasSolution: boolean;
  solutionName: string;
  visiblePieceCount: number;
  totalPieces: number;
  onVisibilityChange: (count: number) => void;
}

// Available solution files (can be expanded or loaded dynamically)
const AVAILABLE_SOLUTIONS = [
  '16_cell_container.fcc_16cell_dlx_corrected_001.json',
  '16_cell_container.fcc_16cell_dlx_corrected_002.json',
  '16_cell_container.fcc_16cell_dlx_corrected_003.json',
  'Shape_2.json',
  'Shape_2.result1.json',
  'Shape_3.json',
  'Shape_4.json',
  'Shape_5.json',
  'shape_16.current.json',
  'shape_17.result1.json',
  'shape_18.current.json',
  'shape_19.current.json',
  'shape_20.current.json'
];

export default function SolutionToolbar({
  onLoadFile,
  onLoadFromUrl,
  onSettings,
  loading,
  hasSolution,
  solutionName,
  visiblePieceCount,
  totalPieces,
  onVisibilityChange
}: SolutionToolbarProps) {
  const [showFileList, setShowFileList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleLoadClick = () => {
    setShowFileList(!showFileList);
  };
  
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoadFile(file);
      setShowFileList(false);
    }
  };
  
  const handleUrlSelect = (filename: string) => {
    onLoadFromUrl(filename);
    setShowFileList(false);
  };
  
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      {/* Top row - Main actions and solution name */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={handleLoadClick}
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
            {loading ? 'Loading...' : 'Load Solution'}
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
        </div>

        {solutionName && (
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
            Solution: {solutionName}
          </div>
        )}
      </div>
      
      {/* Piece Visibility Slider */}
      {hasSolution && totalPieces > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 0',
          fontSize: '12px',
          maxWidth: '300px'
        }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#495057',
            minWidth: '80px'
          }}>
            👁️ Visible: {visiblePieceCount}/{totalPieces}
          </span>
          <input
            type="range"
            min="0"
            max={totalPieces}
            step="1"
            value={visiblePieceCount}
            onChange={(e) => onVisibilityChange(parseInt(e.target.value))}
            style={{
              width: '150px',
              height: '4px',
              background: '#e9ecef',
              borderRadius: '2px',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      )}
      
      {/* File Selection Dropdown */}
      {showFileList && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e9ecef',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1001
        }}>
          {/* Header */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid #e9ecef',
            fontWeight: '600',
            fontSize: '12px',
            color: '#333'
          }}>
            Select Solution File
          </div>
          
          {/* Local File Option */}
          <div
            onClick={handleFileSelect}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderBottom: '1px solid #f8f9fa',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#007bff'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            📂 Browse Local Files...
          </div>
          
          {/* Available Solutions */}
          <div style={{
            padding: '4px 0'
          }}>
            <div style={{
              padding: '4px 12px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#666',
              textTransform: 'uppercase'
            }}>
              Available Solutions
            </div>
            {AVAILABLE_SOLUTIONS.map((filename) => (
              <div
                key={filename}
                onClick={() => handleUrlSelect(filename)}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#333',
                  fontFamily: 'monospace'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {filename}
              </div>
            ))}
          </div>
          
          {/* Close Button */}
          <div style={{
            padding: '6px 12px',
            borderTop: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setShowFileList(false)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
