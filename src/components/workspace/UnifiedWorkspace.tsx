import React from 'react';
import { WorkspaceProvider } from './WorkspaceProvider';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { WorkspaceViewer } from './WorkspaceViewer';
import './UnifiedWorkspace.css';

export const UnifiedWorkspace: React.FC = () => {
  return (
    <WorkspaceProvider>
      <div className="unified-workspace">
        <WorkspaceHeader />
        <div className="workspace-main">
          <WorkspaceViewer />
          <WorkspaceToolbar />
        </div>
      </div>
    </WorkspaceProvider>
  );
};
