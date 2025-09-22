// Solution Settings Modal Component
// Settings for piece colors, visibility slider, and display options

import React, { useState, useRef, useEffect } from 'react';
import { SolutionFile, SolutionSettings } from '../../types/solution';

interface SolutionSettingsModalProps {
  settings: SolutionSettings;
  solution: SolutionFile;
  onSettingsChange: (settings: SolutionSettings) => void;
  onClose: () => void;
}

export default function SolutionSettingsModal({
  settings,
  solution,
  onSettingsChange,
  onClose
}: SolutionSettingsModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Get sorted piece list for consistent ordering
  const pieceList = Object.keys(solution.piecesUsed).sort();
  const totalPieces = pieceList.length;
  
  // Add CSS animation for modal
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes modalFadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const updateSettings = (updates: Partial<SolutionSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };
  
  const updatePieceColor = (pieceId: string, color: string) => {
    updateSettings({
      pieceColors: { ...settings.pieceColors, [pieceId]: color }
    });
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      pointerEvents: 'auto'
    }}>
      <div
        ref={modalRef}
        style={{
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          transform: `translate(${position.x}px, ${position.y}px)`,
          animation: 'modalFadeIn 0.2s ease-out',
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : 'default'
        }}>
        {/* Header */}
        <div 
          onMouseDown={handleMouseDown}
          style={{
            padding: '20px',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'grab',
            userSelect: 'none'
          }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            🧩 Solution Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Settings Content */}
        <div style={{ 
          flex: 1,
          padding: '20px', 
          overflowY: 'auto',
          minHeight: 0
        }}>
          
          {/* Piece Visibility Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🔍 Piece Visibility
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Visible Pieces: {settings.visiblePieceCount} of {totalPieces}
              </label>
              <input
                type="range"
                min="0"
                max={totalPieces}
                step="1"
                value={settings.visiblePieceCount}
                onChange={(e) => updateSettings({ visiblePieceCount: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '12px', 
                color: '#666',
                marginTop: '4px'
              }}>
                <span>None</span>
                <span>All ({totalPieces})</span>
              </div>
            </div>
          </div>

          {/* Piece Colors Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🎨 Piece Colors
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '8px',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              backgroundColor: '#f8f9fa'
            }}>
              {pieceList.map((pieceId) => (
                <div key={pieceId} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  <label style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    {pieceId}
                  </label>
                  <input
                    type="color"
                    value={settings.pieceColors[pieceId] || '#888888'}
                    onChange={(e) => updatePieceColor(pieceId, e.target.value)}
                    style={{
                      width: '40px',
                      height: '30px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Display Settings Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🖥️ Display
            </h3>
            
            {/* Background Color */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Background Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                  {settings.backgroundColor}
                </span>
              </div>
            </div>

            {/* Brightness */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Brightness: {settings.brightness.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={settings.brightness}
                onChange={(e) => updateSettings({ brightness: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Camera Settings Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              📷 Camera
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={settings.camera.orthographic}
                  onChange={(e) => updateSettings({ 
                    camera: { ...settings.camera, orthographic: e.target.checked }
                  })}
                />
                Orthographic View
              </label>
            </div>

            {!settings.camera.orthographic && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Focal Length: {settings.camera.focalLength}mm
                </label>
                <input
                  type="range"
                  min="35"
                  max="200"
                  step="5"
                  value={settings.camera.focalLength}
                  onChange={(e) => updateSettings({ 
                    camera: { ...settings.camera, focalLength: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0,
          padding: '16px 20px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: 'white'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
