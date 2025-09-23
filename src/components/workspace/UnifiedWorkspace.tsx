import React from 'react';
import { WorkspaceProvider } from './WorkspaceProvider';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { WorkspaceViewer } from './WorkspaceViewer';
import { DebugModal } from '../debug/DebugModal';
import { useDebugModal } from '../../hooks/useDebugModal';
import './UnifiedWorkspace.css';

export const UnifiedWorkspace: React.FC = () => {
  const { isOpen, closeDebugModal } = useDebugModal();

  return (
    <WorkspaceProvider>
      <div className="unified-workspace">
        <WorkspaceHeader />
        <div className="workspace-main">
          <WorkspaceViewer />
          <WorkspaceToolbar />
        </div>
        <DebugModal isOpen={isOpen} onClose={closeDebugModal} />
        
        {/* Debug Indicator - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-indicator">
            🐛 Alt+D for Debug
          </div>
        )}
      </div>
    </WorkspaceProvider>
  );
};
