// Solution Settings Modal Component
// Comprehensive settings matching Puzzle Shape page style

import React, { useState, useRef, useEffect } from 'react';
import { SolutionFile, SolutionSettings, DEFAULT_PIECE_COLORS } from '../../types/solution';

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
  
  const updateSettings = (updates: Partial<SolutionSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };
  
  const updatePieceColor = (pieceId: string, color: string) => {
    updateSettings({
      pieceColors: { ...settings.pieceColors, [pieceId]: color }
    });
  };

  const updateCamera = (updates: Partial<{ orthographic: boolean; focalLength: number }>) => {
    updateSettings({ camera: { ...settings.camera, ...updates } });
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
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
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: 2000,
      pointerEvents: 'none'
    }}>
      <div 
        ref={modalRef}
        style={{
          position: 'absolute',
          top: `calc(25% + ${position.y}px)`,
          left: `calc(50% + ${position.x}px)`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          color: 'black',
          borderRadius: '12px',
          width: '420px',
          height: '60vh',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
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
          
          {/* Appearance Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🎨 Appearance
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

          {/* Material Properties Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              ✨ Material Properties
            </h3>
            
            {/* Material Preset */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Material Preset
              </label>
              <select
                value={settings.material?.preset || 'basic'}
                onChange={(e) => updateSettings({ 
                  material: { 
                    ...settings.material, 
                    preset: e.target.value as 'basic' | 'gold' | 'stainlessSteel' | 'brushedSteel'
                  } 
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              >
                <option value="basic">Basic Material</option>
                <option value="gold">Gold (PBR)</option>
                <option value="stainlessSteel">Stainless Steel (PBR)</option>
                <option value="brushedSteel">Brushed Steel (PBR)</option>
              </select>
            </div>

            {/* Sheen Intensity */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Sheen Intensity: {settings.material?.sheen?.toFixed(2) || '0.30'}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.material?.sheen || 0.3}
                onChange={(e) => updateSettings({ 
                  material: { 
                    ...settings.material, 
                    sheen: parseFloat(e.target.value) 
                  } 
                })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Metalness */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Metalness: {settings.metalness?.toFixed(2) || '0.00'}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.metalness || 0}
                onChange={(e) => updateSettings({ metalness: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Reflectiveness */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Reflectiveness: {settings.reflectiveness?.toFixed(2) || '0.00'}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.reflectiveness || 0}
                onChange={(e) => updateSettings({ reflectiveness: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Transparency */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Transparency: {settings.transparency?.toFixed(2) || '0.00'}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.transparency || 0}
                onChange={(e) => updateSettings({ transparency: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Bonds Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🔗 Bonds
            </h3>
            
            {/* Enable Bonds */}
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
                  checked={settings.bonds?.enabled || false}
                  onChange={(e) => updateSettings({ 
                    bonds: { 
                      ...settings.bonds, 
                      enabled: e.target.checked 
                    } 
                  })}
                />
                Show Bonds Between Spheres
              </label>
            </div>

            {settings.bonds?.enabled && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Bond Thickness: {((settings.bonds?.thickness || 0.3) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={settings.bonds?.thickness || 0.3}
                  onChange={(e) => updateSettings({ 
                    bonds: { 
                      ...settings.bonds, 
                      thickness: parseFloat(e.target.value) 
                    } 
                  })}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          {/* HDR Environment Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🌟 HDR Environment
            </h3>
            
            {/* Enable HDR */}
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
                  checked={settings.hdr?.enabled || false}
                  onChange={(e) => updateSettings({ 
                    hdr: { 
                      ...settings.hdr, 
                      enabled: e.target.checked 
                    } 
                  })}
                />
                Use HDR Environment
              </label>
            </div>

            {settings.hdr?.enabled && (
              <>
                {/* HDR Environment Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                    Environment
                  </label>
                  <select
                    value={settings.hdr?.environment || 'studio'}
                    onChange={(e) => updateSettings({ 
                      hdr: { 
                        ...settings.hdr, 
                        environment: e.target.value as 'studio' | 'outdoor' | 'sunset'
                      } 
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      fontSize: '14px'
                    }}
                  >
                    <option value="studio">Studio Lighting</option>
                    <option value="outdoor">Outdoor Natural</option>
                    <option value="sunset">Golden Hour</option>
                  </select>
                </div>

                {/* HDR Intensity */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                    HDR Intensity: {settings.hdr?.intensity?.toFixed(1) || '1.0'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={settings.hdr?.intensity || 1.0}
                    onChange={(e) => updateSettings({ 
                      hdr: { 
                        ...settings.hdr, 
                        intensity: parseFloat(e.target.value) 
                      } 
                    })}
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Piece Colors Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🌈 Piece Colors
            </h3>
            
            {/* Individual Piece Colors */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '8px',
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
                  padding: '6px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <label style={{ 
                    fontSize: '11px', 
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
                      width: '30px',
                      height: '25px',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ))}
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
                  onChange={(e) => updateCamera({ orthographic: e.target.checked })}
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
                  onChange={(e) => updateCamera({ focalLength: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Done Button */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
