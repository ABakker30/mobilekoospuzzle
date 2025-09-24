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
    // Prevent stale state updates - if we have a newer solution, ignore old updates
    const currentSolutionName = state.modeState[currentMode]?.solutionName;
    const newSolutionName = newState.solutionName;
    
    if (currentSolutionName && newSolutionName && currentSolutionName !== newSolutionName) {
      // Check if this is an older solution trying to update
      const currentTime = state.modeState[currentMode]?.lastUpdated || 0;
      const newTime = Date.now();
      
      // If the new state has an older solution name, it's probably stale
      if (!newState.lastUpdated || newState.lastUpdated < currentTime) {
        console.log('🚫 Blocking stale state update:', { 
          current: currentSolutionName, 
          incoming: newSolutionName,
          reason: 'stale_data'
        });
        return;
      }
    }
    
    // Add timestamp to track update order
    const stateWithTimestamp = { ...newState, lastUpdated: Date.now() };
    updateModeState(currentMode, stateWithTimestamp);
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
