import React from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { getModeConfig } from './modeRegistry';

export const WorkspaceToolbar: React.FC = () => {
  const { state, updateSettings, updateModeState } = useWorkspace();
  const { currentMode, settings } = state;
  
  const modeConfig = getModeConfig(currentMode);
  const ToolbarComponent = modeConfig.toolbar;
  
  const handleSettingsChange = (newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
  };
  
  const handleModeStateChange = (newState: Record<string, any>) => {
    updateModeState(currentMode, newState);
  };

  return (
    <div className="workspace-toolbar" style={{ borderTopColor: modeConfig.color }}>
      <ToolbarComponent
        settings={settings}
        onSettingsChange={handleSettingsChange}
        modeState={state.modeState[currentMode]}
        onModeStateChange={handleModeStateChange}
      />
    </div>
  );
};
