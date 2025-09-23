import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../workspace/WorkspaceProvider';
import { getAllModes } from '../workspace/modeRegistry';
import './DebugModal.css';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose }) => {
  const { state, setMode, updateSettings, updateCoordinates } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'state' | 'actions' | 'performance'>('state');
  const allModes = getAllModes();

  if (!isOpen) return null;

  const handleModeSwitch = (modeId: string) => {
    setMode(modeId as any);
  };

  const handleAddTestCoordinates = () => {
    const testCoords = [
      { i: 0, j: 0, k: 0 },
      { i: 1, j: 0, k: 0 },
      { i: 0, j: 1, k: 0 },
      { i: 0, j: 0, k: 1 }
    ];
    updateCoordinates(testCoords);
  };

  const handleClearCoordinates = () => {
    updateCoordinates([]);
  };

  const handleUpdateBrightness = (brightness: number) => {
    updateSettings({ brightness });
  };

  return (
    <div className="debug-modal-overlay" onClick={onClose}>
      <div className="debug-modal" onClick={(e) => e.stopPropagation()}>
        <div className="debug-modal-header">
          <h3>🐛 V2 Debug Console</h3>
          <div className="debug-modal-tabs">
            <button 
              className={activeTab === 'state' ? 'active' : ''}
              onClick={() => setActiveTab('state')}
            >
              State
            </button>
            <button 
              className={activeTab === 'actions' ? 'active' : ''}
              onClick={() => setActiveTab('actions')}
            >
              Actions
            </button>
            <button 
              className={activeTab === 'performance' ? 'active' : ''}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
          </div>
          <button className="debug-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="debug-modal-content">
          {activeTab === 'state' && (
            <div className="debug-tab-content">
              <div className="debug-section">
                <h4>Current Mode</h4>
                <div className="debug-current-mode">
                  <span className="mode-indicator" style={{ backgroundColor: getAllModes().find(m => m.id === state.currentMode)?.color }}>
                    {getAllModes().find(m => m.id === state.currentMode)?.icon}
                  </span>
                  <span>{getAllModes().find(m => m.id === state.currentMode)?.displayName}</span>
                </div>
              </div>

              <div className="debug-section">
                <h4>Coordinates ({state.coordinates.length})</h4>
                <div className="debug-coordinates">
                  {state.coordinates.length === 0 ? (
                    <span className="debug-empty">No coordinates</span>
                  ) : (
                    <pre>{JSON.stringify(state.coordinates.slice(0, 5), null, 2)}</pre>
                  )}
                  {state.coordinates.length > 5 && (
                    <span className="debug-truncated">... and {state.coordinates.length - 5} more</span>
                  )}
                </div>
              </div>

              <div className="debug-section">
                <h4>Settings</h4>
                <div className="debug-settings">
                  <div className="debug-setting">
                    <span>Brightness:</span>
                    <span>{state.settings.brightness}</span>
                  </div>
                  <div className="debug-setting">
                    <span>Background:</span>
                    <span>{state.settings.backgroundColor}</span>
                  </div>
                  <div className="debug-setting">
                    <span>Material:</span>
                    <span>{state.settings.material.type}</span>
                  </div>
                  <div className="debug-setting">
                    <span>Camera:</span>
                    <span>{state.settings.camera.orthographic ? 'Orthographic' : 'Perspective'}</span>
                  </div>
                </div>
              </div>

              <div className="debug-section">
                <h4>Mode State</h4>
                <pre className="debug-json">
                  {JSON.stringify(state.modeState[state.currentMode], null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="debug-tab-content">
              <div className="debug-section">
                <h4>Mode Switching</h4>
                <div className="debug-mode-buttons">
                  {allModes.map((mode) => (
                    <button
                      key={mode.id}
                      className={`debug-mode-btn ${state.currentMode === mode.id ? 'active' : ''}`}
                      style={{ borderColor: mode.color }}
                      onClick={() => handleModeSwitch(mode.id)}
                    >
                      {mode.icon} {mode.displayName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="debug-section">
                <h4>Coordinate Testing</h4>
                <div className="debug-action-buttons">
                  <button onClick={handleAddTestCoordinates}>
                    Add Test Coordinates
                  </button>
                  <button onClick={handleClearCoordinates}>
                    Clear Coordinates
                  </button>
                </div>
              </div>

              <div className="debug-section">
                <h4>Settings Testing</h4>
                <div className="debug-settings-controls">
                  <label>
                    Brightness:
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={state.settings.brightness}
                      onChange={(e) => handleUpdateBrightness(parseFloat(e.target.value))}
                    />
                    <span>{state.settings.brightness.toFixed(1)}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="debug-tab-content">
              <div className="debug-section">
                <h4>React Performance</h4>
                <div className="debug-performance">
                  <div className="debug-metric">
                    <span>Renders:</span>
                    <span>Tracking in development...</span>
                  </div>
                  <div className="debug-metric">
                    <span>Mode Switches:</span>
                    <span>Tracking transitions...</span>
                  </div>
                </div>
              </div>

              <div className="debug-section">
                <h4>Memory Usage</h4>
                <div className="debug-memory">
                  <div className="debug-metric">
                    <span>Coordinates:</span>
                    <span>{state.coordinates.length} objects</span>
                  </div>
                  <div className="debug-metric">
                    <span>Mode States:</span>
                    <span>{Object.keys(state.modeState).length} modes</span>
                  </div>
                </div>
              </div>

              <div className="debug-section">
                <h4>Build Info</h4>
                <div className="debug-build-info">
                  <div className="debug-metric">
                    <span>Environment:</span>
                    <span>{import.meta.env.MODE}</span>
                  </div>
                  <div className="debug-metric">
                    <span>Version:</span>
                    <span>V2 Framework Development</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="debug-modal-footer">
          <span className="debug-hotkey">Press Alt+D to toggle</span>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
