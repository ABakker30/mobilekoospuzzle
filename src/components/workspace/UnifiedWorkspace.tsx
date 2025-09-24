import React from 'react';
import { WorkspaceProvider } from './WorkspaceProvider';
import { WorkspaceHeader } from './WorkspaceHeader';
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
        </div>
        <DebugModal isOpen={isOpen} onClose={closeDebugModal} />
      </div>
    </WorkspaceProvider>
  );
};
