// Solution Toolbar Component
// Toolbar for solution viewer with load and settings buttons

import React, { useState, useRef } from 'react';

interface SolutionToolbarProps {
  onLoadFile: (file: File) => void;
  onLoadFromUrl: (filename: string) => void;
  onSettings: () => void;
  loading: boolean;
  hasSolution: boolean;
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
  hasSolution
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
      position: 'absolute',
      top: '16px',
      left: '16px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Main Toolbar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        {/* Load Solution Button */}
        <button
          onClick={handleLoadClick}
          disabled={loading}
          style={{
            padding: '8px 12px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            minWidth: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Loading...
            </>
          ) : (
            <>📁 Load Solution</>
          )}
        </button>
        
        {/* Settings Button */}
        <button
          onClick={onSettings}
          disabled={!hasSolution || loading}
          style={{
            padding: '8px 12px',
            backgroundColor: (!hasSolution || loading) ? '#e9ecef' : '#28a745',
            color: (!hasSolution || loading) ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: (!hasSolution || loading) ? 'not-allowed' : 'pointer',
            minWidth: '80px'
          }}
        >
          ⚙️ Settings
        </button>
      </div>
      
      {/* File Selection Dropdown */}
      {showFileList && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e9ecef',
          maxHeight: '300px',
          overflowY: 'auto',
          minWidth: '300px'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e9ecef',
            fontWeight: '600',
            fontSize: '14px',
            color: '#333'
          }}>
            Select Solution File
          </div>
          
          {/* Local File Option */}
          <div
            onClick={handleFileSelect}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #f8f9fa',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#007bff'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            📂 Browse Local Files...
          </div>
          
          {/* Available Solutions */}
          <div style={{
            padding: '8px 0'
          }}>
            <div style={{
              padding: '8px 16px',
              fontSize: '12px',
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
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '13px',
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
            padding: '8px 16px',
            borderTop: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setShowFileList(false)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
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
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
