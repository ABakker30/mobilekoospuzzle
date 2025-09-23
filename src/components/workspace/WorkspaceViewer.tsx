import React from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { getModeConfig } from './modeRegistry';

export const WorkspaceViewer: React.FC = () => {
  const { state, updateCoordinates, updateModeState } = useWorkspace();
  const { currentMode, coordinates, settings } = state;
  
  const modeConfig = getModeConfig(currentMode);
  const ViewerComponent = modeConfig.viewer;
  
  const handleCoordinatesChange = (newCoordinates: typeof coordinates) => {
    updateCoordinates(newCoordinates);
  };
  
  const handleModeStateChange = (newState: Record<string, any>) => {
    updateModeState(currentMode, newState);
  };

  return (
    <div className="workspace-viewer">
      <ViewerComponent
        coordinates={coordinates}
        settings={settings}
        modeState={state.modeState[currentMode]}
        onCoordinatesChange={handleCoordinatesChange}
        onModeStateChange={handleModeStateChange}
      />
    </div>
  );
};
