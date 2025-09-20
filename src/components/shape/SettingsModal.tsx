import React, { useState, useRef } from 'react';

export interface MaterialSettings {
  type: 'glass' | 'metal' | 'paint' | 'plastic' | 'rusty_paint';
  color: string;
  metalness: number;
  transparency: number;
  reflectiveness: number; // Controls roughness (inverse relationship)
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

const materialPresets = {
  glass: { metalness: 0.0, transparency: 0.7, reflectiveness: 0.95, color: '#87CEEB' },
  metal: { metalness: 1.0, transparency: 0.0, reflectiveness: 0.9, color: '#C0C0C0' },
  paint: { metalness: 0.0, transparency: 0.0, reflectiveness: 0.2, color: '#4a90e2' },
  plastic: { metalness: 0.1, transparency: 0.0, reflectiveness: 0.3, color: '#FF6B6B' },
  rusty_paint: { metalness: 0.3, transparency: 0.0, reflectiveness: 0.1, color: '#CD853F' }
};

export default function SettingsModal({ settings, onSettingsChange, onClose }: SettingsModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

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
    const preset = materialPresets[type];
    updateMaterial({
      type,
      metalness: preset.metalness,
      transparency: preset.transparency,
      reflectiveness: preset.reflectiveness,
      color: preset.color
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
                <option value="glass">🔍 Glass</option>
                <option value="metal">⚡ Metal</option>
                <option value="paint">🎨 Paint</option>
                <option value="plastic">🧊 Plastic</option>
                <option value="rusty_paint">🦀 Rusty Paint</option>
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
