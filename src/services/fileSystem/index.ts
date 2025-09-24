// Unified File I/O System - Main exports
export { FileBrowserService } from './FileBrowserService';
export { FileSaveService } from './FileSaveService';
export { FileOrientationService } from './FileOrientationService';

// Re-export types for convenience
export type {
  FileType,
  ContainerFile,
  SolutionFile,
  StatusFile,
  UnifiedFile,
  FileBrowserOptions,
  FileSaveOptions,
  CellRecord
} from '../../types/fileSystem';
