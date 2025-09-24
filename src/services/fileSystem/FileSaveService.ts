import { FileType, ContainerFile, SolutionFile, StatusFile, FileSaveOptions } from '../../types/fileSystem';

export class FileSaveService {
  private static instance: FileSaveService;

  static getInstance(): FileSaveService {
    if (!FileSaveService.instance) {
      FileSaveService.instance = new FileSaveService();
    }
    return FileSaveService.instance;
  }

  /**
   * Save file with unified interface
   */
  async saveFile(
    content: ContainerFile | SolutionFile | StatusFile,
    options: FileSaveOptions
  ): Promise<string> {
    switch (options.type) {
      case FileType.CONTAINER:
        return this.saveContainer(content as ContainerFile, options);
      
      case FileType.SOLUTION:
        return this.saveSolution(content as SolutionFile, options);
      
      case FileType.STATUS:
        return this.saveStatus(content as StatusFile, options);
      
      default:
        throw new Error(`Unsupported file type: ${options.type}`);
    }
  }

  /**
   * Save container file
   */
  private async saveContainer(container: ContainerFile, options: FileSaveOptions): Promise<string> {
    const fileName = options.suggestedName || `container_${Date.now()}.fcc.json`;
    
    // For now, save to localStorage (later will integrate with backend)
    const fileData = {
      ...container,
      metadata: {
        ...container.metadata,
        ...options.metadata,
        savedAt: new Date().toISOString()
      }
    };

    try {
      // Save to localStorage with a key that includes the file type
      const storageKey = `container_${fileName}`;
      localStorage.setItem(storageKey, JSON.stringify(fileData));
      
      console.log(`Container saved to localStorage: ${storageKey}`);
      return storageKey;
    } catch (error) {
      console.error('Error saving container:', error);
      throw new Error('Failed to save container file');
    }
  }

  /**
   * Save solution file
   */
  private async saveSolution(solution: SolutionFile, options: FileSaveOptions): Promise<string> {
    const fileName = options.suggestedName || `solution_${Date.now()}.sol.json`;
    
    const fileData = {
      ...solution,
      metadata: {
        ...solution.metadata,
        ...options.metadata,
        savedAt: new Date().toISOString()
      }
    };

    try {
      const storageKey = `solution_${fileName}`;
      localStorage.setItem(storageKey, JSON.stringify(fileData));
      
      console.log(`Solution saved to localStorage: ${storageKey}`);
      return storageKey;
    } catch (error) {
      console.error('Error saving solution:', error);
      throw new Error('Failed to save solution file');
    }
  }

  /**
   * Save status file
   */
  private async saveStatus(status: StatusFile, options: FileSaveOptions): Promise<string> {
    const fileName = options.suggestedName || `status_${Date.now()}.status.json`;
    
    const fileData = {
      ...status,
      timestamp: new Date().toISOString(),
      userState: {
        ...status.userState,
        ...options.metadata
      }
    };

    try {
      const storageKey = `status_${fileName}`;
      localStorage.setItem(storageKey, JSON.stringify(fileData));
      
      console.log(`Status saved to localStorage: ${storageKey}`);
      return storageKey;
    } catch (error) {
      console.error('Error saving status:', error);
      throw new Error('Failed to save status file');
    }
  }

  /**
   * Create container file from coordinates
   */
  createContainerFile(
    coordinates: { i: number; j: number; k: number }[],
    metadata?: {
      title?: string;
      description?: string;
      designer?: string;
      tags?: string[];
    }
  ): ContainerFile {
    return {
      version: '1.0',
      lattice: 'fcc',
      cells: coordinates.map(coord => [coord.i, coord.j, coord.k]),
      designer: metadata?.designer ? {
        name: metadata.designer,
        date: new Date().toISOString().split('T')[0]
      } : undefined,
      metadata: {
        title: metadata?.title,
        description: metadata?.description,
        tags: metadata?.tags || [],
        difficulty: 1 // Default difficulty
      }
    };
  }

  /**
   * Create solution file
   */
  createSolutionFile(
    containerCid: string,
    pieces: any[],
    metadata?: {
      solver?: string;
      algorithm?: string;
      solveTime?: number;
    }
  ): SolutionFile {
    return {
      version: '1.0',
      containerCid,
      pieces: pieces.map(piece => ({
        id: piece.id || `piece_${Date.now()}`,
        type: piece.type || 'unknown',
        coordinates: piece.coordinates || [],
        rotation: piece.rotation,
        position: piece.position
      })),
      metadata: {
        solver: metadata?.solver,
        algorithm: metadata?.algorithm,
        solveTime: metadata?.solveTime,
        steps: pieces.length
      }
    };
  }

  /**
   * Create status file
   */
  createStatusFile(
    mode: string,
    progress: any,
    userState: Record<string, any>,
    containerCid?: string,
    solutionCid?: string
  ): StatusFile {
    return {
      version: '1.0',
      mode,
      containerCid,
      solutionCid,
      progress: {
        currentStep: progress.currentStep || 0,
        totalSteps: progress.totalSteps || 0,
        completedPieces: progress.completedPieces || [],
        timeElapsed: progress.timeElapsed || 0
      },
      userState,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Download file to user's device
   */
  downloadFile(content: any, fileName: string, mimeType: string = 'application/json'): void {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}
