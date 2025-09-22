import React, { useState, useRef, useEffect } from 'react';
import { PBR_PRESETS, ExtendedMaterialSettings, DEFAULT_PBR_SETTINGS, HDR_ENVIRONMENTS } from '../../lib/materials/pbrPresets';
import { PBRAssetManager } from '../../services/pbrAssets';

// Enhanced material settings with PBR support (extends legacy)
export interface MaterialSettings {
  // Legacy properties
  type: 'glass' | 'metal' | 'paint' | 'plastic' | 'rusty_paint' | 'pbr_gold' | 'pbr_steel' | 'pbr_brushed';
  color: string;
  metalness: number;
  transparency: number;
  reflectiveness: number; // Controls roughness (inverse relationship)
  
  // New PBR properties (optional for backward compatibility)
  roughness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  anisotropy?: number;
  useHDR?: boolean;
  hdrIntensity?: number;
  hdrEnvironment?: string; // Key from HDR_ENVIRONMENTS
  preset?: string; // Key from PBR_PRESETS
}

export interface CameraSettings {
  orthographic: boolean;
  focalLength: number; // in mm, 35-200 range
}

export interface AppSettings {
  brightness: number;
  backgroundColor: string;
  material: MaterialSettings;
  camera: CameraSettings;
}

interface SettingsModalProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onClose: () => void;
}

// Material preset type
type MaterialPreset = Partial<MaterialSettings> & {
  metalness: number;
  transparency: number;
  reflectiveness: number;
  color: string;
};

// Legacy material presets
const legacyMaterialPresets: Record<string, MaterialPreset> = {
  glass: { metalness: 0.0, transparency: 0.7, reflectiveness: 0.95, color: '#87CEEB' },
  metal: { metalness: 1.0, transparency: 0.0, reflectiveness: 0.9, color: '#C0C0C0' },
  paint: { metalness: 0.0, transparency: 0.0, reflectiveness: 0.2, color: '#4a90e2' },
  plastic: { metalness: 0.1, transparency: 0.0, reflectiveness: 0.3, color: '#FF6B6B' },
  rusty_paint: { metalness: 0.3, transparency: 0.0, reflectiveness: 0.1, color: '#CD853F' }
};

// PBR material presets (converted to MaterialSettings format)
const pbrMaterialPresets: Record<string, MaterialPreset> = {
  pbr_gold: {
    metalness: 1.0,
    transparency: 0.0,
    reflectiveness: 0.78, // Inverse of roughness 0.22
    color: '#D4AF37',
    roughness: 0.22,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
    useHDR: true,
    hdrIntensity: 1.0,
    hdrEnvironment: 'studio',
    preset: 'gold'
  },
  pbr_steel: {
    metalness: 1.0,
    transparency: 0.0,
    reflectiveness: 0.97, // Inverse of roughness 0.03
    color: '#ffffff',
    roughness: 0.03,
    useHDR: true,
    hdrIntensity: 1.0,
    hdrEnvironment: 'studio',
    preset: 'stainlessSteel'
  },
  pbr_brushed: {
    metalness: 1.0,
    transparency: 0.0,
    reflectiveness: 0.75, // Inverse of roughness 0.25
    color: '#ffffff',
    roughness: 0.25,
    anisotropy: 0.9,
    useHDR: true,
    hdrIntensity: 1.0,
    hdrEnvironment: 'outdoor',
    preset: 'brushedSteel'
  }
};

// Combined material presets
const allMaterialPresets: Record<string, MaterialPreset> = { ...legacyMaterialPresets, ...pbrMaterialPresets };

export default function SettingsModal({ settings, onSettingsChange, onClose }: SettingsModalProps) {
  // Add CSS animation for loading spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pbrLoading, setPbrLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Initialize PBR asset manager
  useEffect(() => {
    const assetManager = PBRAssetManager.getInstance();
    
    // Listen for loading state changes
    const unsubscribe = assetManager.onLoadingStateChange((state) => {
      setPbrLoading(state.isLoading);
    });
    
    return unsubscribe;
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateMaterial = (updates: Partial<MaterialSettings>) => {
    updateSettings({ material: { ...settings.material, ...updates } });
  };

  const updateCamera = (updates: Partial<CameraSettings>) => {
    updateSettings({ camera: { ...settings.camera, ...updates } });
  };

  const handleMaterialTypeChange = (type: MaterialSettings['type']) => {
    const preset = allMaterialPresets[type];
    if (!preset) return;
    
    updateMaterial({
      type,
      ...preset // Spread all preset properties (typed correctly now)
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
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  React.useEffect(() => {
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
          top: `calc(25% + ${position.y}px)`, // Position higher on screen
          left: `calc(50% + ${position.x}px)`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          color: 'black',
          borderRadius: '12px',
          width: '380px',
          height: '40vh', // Fixed height at 40% of viewport
          maxHeight: '500px', // Maximum height cap
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
            ⚙️ Settings
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
          minHeight: 0 // Allow flex item to shrink
        }}>
          
          {/* Appearance Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🎨 Appearance
            </h3>
            
            {/* Background Color Picker */}
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

            {/* Brightness Slider */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Brightness: {settings.brightness.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={settings.brightness}
                onChange={(e) => updateSettings({ brightness: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Camera Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              📷 Camera
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.camera.orthographic}
                  onChange={(e) => updateCamera({ orthographic: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span>Orthographic View</span>
              </label>
            </div>

            {/* Focal Length Slider (only for perspective camera) */}
            {!settings.camera.orthographic && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Focal Length: {settings.camera.focalLength}mm
                </label>
                <input
                  type="range"
                  min="35"
                  max="200"
                  step="1"
                  value={settings.camera.focalLength}
                  onChange={(e) => updateCamera({ focalLength: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          {/* Material Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🔮 Material
            </h3>
            
            {/* Material Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Material Type
              </label>
              <select
                value={settings.material.type}
                onChange={(e) => handleMaterialTypeChange(e.target.value as MaterialSettings['type'])}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: 'black'
                }}
              >
                <optgroup label="🎨 Basic Materials">
                  <option value="glass">🔍 Glass</option>
                  <option value="metal">⚡ Metal</option>
                  <option value="paint">🎨 Paint</option>
                  <option value="plastic">🧊 Plastic</option>
                  <option value="rusty_paint">🦀 Rusty Paint</option>
                </optgroup>
                <optgroup label="✨ PBR Materials">
                  <option value="pbr_gold">🥇 Gold (PBR)</option>
                  <option value="pbr_steel">🔧 Stainless Steel (PBR)</option>
                  <option value="pbr_brushed">🪚 Brushed Steel (PBR)</option>
                </optgroup>
              </select>
            </div>

            {/* Color Picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={settings.material.color}
                  onChange={(e) => updateMaterial({ color: e.target.value })}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                  {settings.material.color}
                </span>
              </div>
            </div>

            {/* Metalness Slider */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Metalness: {settings.material.metalness.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.material.metalness}
                onChange={(e) => updateMaterial({ metalness: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Reflectiveness Slider */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Reflectiveness: {settings.material.reflectiveness.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.material.reflectiveness}
                onChange={(e) => updateMaterial({ reflectiveness: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Transparency Slider */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Transparency: {settings.material.transparency.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.material.transparency}
                onChange={(e) => updateMaterial({ transparency: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* PBR Loading Indicator */}
            {pbrLoading && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#1976d2'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #1976d2',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Loading PBR assets...
              </div>
            )}

            {/* Mobile Debug Info */}
            {settings.material.type?.startsWith('pbr_') && (
              <div style={{
                marginBottom: '16px',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#666'
              }}>
                <div>📱 Device: {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}</div>
                <div>🖥️ Screen: {window.innerWidth}×{window.innerHeight}</div>
                <div>🌐 Browser: {navigator.userAgent.split(' ').pop()}</div>
                <div>💾 Memory: {(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'Unknown'}</div>
              </div>
            )}

            {/* Advanced PBR Controls */}
            {(settings.material.type?.startsWith('pbr_') || showAdvanced) && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                    ✨ Advanced PBR Settings
                  </h4>
                  {!settings.material.type?.startsWith('pbr_') && (
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#6c757d'
                      }}
                    >
                      {showAdvanced ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>

                {/* Roughness */}
                {settings.material.roughness !== undefined && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                      Roughness: {settings.material.roughness?.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.material.roughness || 0.5}
                      onChange={(e) => updateMaterial({ roughness: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                {/* Clearcoat */}
                {settings.material.clearcoat !== undefined && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                      Clearcoat: {settings.material.clearcoat?.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.material.clearcoat || 0}
                      onChange={(e) => updateMaterial({ clearcoat: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                {/* HDR Environment */}
                {settings.material.useHDR !== undefined && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={settings.material.useHDR || false}
                        onChange={(e) => updateMaterial({ useHDR: e.target.checked })}
                      />
                      Use HDR Environment (Realistic Reflections)
                    </label>
                  </div>
                )}

                {/* HDR Environment Selection */}
                {settings.material.useHDR && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                      HDR Environment
                    </label>
                    <select
                      value={settings.material.hdrEnvironment || 'studio'}
                      onChange={(e) => updateMaterial({ hdrEnvironment: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 'white'
                      }}
                    >
                      {Object.entries(HDR_ENVIRONMENTS).map(([key, env]) => (
                        <option key={key} value={key}>
                          {env.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* HDR Intensity */}
                {settings.material.useHDR && settings.material.hdrIntensity !== undefined && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                      HDR Intensity: {settings.material.hdrIntensity?.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={settings.material.hdrIntensity || 1}
                      onChange={(e) => updateMaterial({ hdrIntensity: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, // Don't shrink the footer
          padding: '16px 20px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: 'white' // Ensure footer has background
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
