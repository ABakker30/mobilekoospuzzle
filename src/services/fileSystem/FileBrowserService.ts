import { FileType, ContainerFile, SolutionFile, StatusFile, UnifiedFile, FileBrowserOptions, OrientationData } from '../../types/fileSystem';
import { FileOrientationService } from './FileOrientationService';

export class FileBrowserService {
  private static instance: FileBrowserService;
  private baseUrl = '/content'; // GitHub public folder
  private orientationService = FileOrientationService.getInstance();

  static getInstance(): FileBrowserService {
    if (!FileBrowserService.instance) {
      FileBrowserService.instance = new FileBrowserService();
    }
    return FileBrowserService.instance;
  }

  /**
   * Browse files by type with filtering options
   */
  async browseFiles(options: FileBrowserOptions): Promise<UnifiedFile[]> {
    const files: UnifiedFile[] = [];

    // Load containers if requested
    if (options.supportedTypes.includes(FileType.CONTAINER)) {
      const containers = await this.loadContainers();
      files.push(...containers);
    }

    // Load solutions if requested (placeholder for future implementation)
    if (options.supportedTypes.includes(FileType.SOLUTION)) {
      const solutions = await this.loadSolutions();
      files.push(...solutions);
    }

    // Load status files if requested (placeholder for future implementation)
    if (options.supportedTypes.includes(FileType.STATUS)) {
      const statusFiles = await this.loadStatusFiles();
      files.push(...statusFiles);
    }

    return files;
  }

  /**
   * Load a specific file by path with automatic orientation calculation
   */
  async loadFile(path: string, type: FileType): Promise<UnifiedFile | null> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      const content = await response.json();
      const fileName = path.split('/').pop() || 'unknown';
      
      // Calculate orientation data automatically for files with coordinates
      let orientation: OrientationData | undefined = undefined;
      if (type === FileType.CONTAINER || type === FileType.SOLUTION) {
        console.log(`🔍 FileBrowserService: Calculating orientation for ${fileName}`);
        const calculatedOrientation = this.orientationService.calculateOrientation(content as ContainerFile | SolutionFile);
        
        if (calculatedOrientation) {
          orientation = calculatedOrientation;
          console.log(`🔍 FileBrowserService: Orientation calculated for ${fileName} - ${orientation.coordinateCount} coordinates, largest face area: ${orientation.largestFaceArea.toFixed(3)}`);
        }
      }
      
      return {
        type,
        name: fileName,
        path,
        size: JSON.stringify(content).length,
        lastModified: new Date(), // GitHub doesn't provide this easily
        content,
        orientation
      };
    } catch (error) {
      console.error(`Error loading file ${path}:`, error);
      return null;
    }
  }

  /**
   * Load all container files from GitHub
   */
  private async loadContainers(): Promise<UnifiedFile[]> {
    try {
      // Get list of container files from the containers directory
      const containerFiles = await this.getContainerFileList();
      const containers: UnifiedFile[] = [];

      for (const fileName of containerFiles) {
        const path = `${this.baseUrl}/containers/${fileName}`;
        const file = await this.loadFile(path, FileType.CONTAINER);
        if (file) {
          containers.push(file);
        }
      }

      return containers;
    } catch (error) {
      console.error('Error loading containers:', error);
      return [];
    }
  }

  /**
   * Get list of container files (hardcoded for now, will be dynamic later)
   */
  private async getContainerFileList(): Promise<string[]> {
    // For now, return the known container files
    // In the future, this could query GitHub API or a manifest file
    return [
      '16 cell container.fcc.json',
      '40 cell.fcc.json',
      'Shape_1.fcc.json',
      'Shape_2.fcc.json',
      'Shape_3.fcc.json',
      'Shape_4.fcc.json',
      'Shape_5.fcc.json',
      'Shape_6.fcc.json',
      'Shape_7.fcc.json',
      'Shape_8.fcc.json',
      'Shape_9.fcc.json',
      'Shape_10.fcc.json',
      'Shape_11.fcc.json',
      'Shape_12.fcc.json',
      'Shape_13.fcc.json',
      'Shape_14.fcc.json',
      'Shape_15.fcc.json',
      'Shape_16.fcc.json',
      'Shape_17.fcc.json',
      'Shape_18.fcc.json',
      'Shape_19.fcc.json',
      'Shape_20.fcc.json',
      'Shape_21.fcc.json',
      'Shape_22.fcc.json',
      'Shape_23.fcc.json',
      'Shape_24.fcc.json',
      'hollow_pyramid.fcc.json',
      'hollowpyramid.py.fcc.json'
    ];
  }

  /**
   * Load solutions (placeholder for future implementation)
   */
  private async loadSolutions(): Promise<UnifiedFile[]> {
    // TODO: Implement solution file loading
    return [];
  }

  /**
   * Load status files (placeholder for future implementation)
   */
  private async loadStatusFiles(): Promise<UnifiedFile[]> {
    // TODO: Implement status file loading from localStorage or server
    return [];
  }

  /**
   * Convert container file to CellRecord format
   */
  convertContainerToCellRecords(container: ContainerFile): { i: number; j: number; k: number }[] {
    return container.cells.map(([i, j, k]) => ({ i, j, k }));
  }

  /**
   * Get file preview information
   */
  getFilePreview(file: UnifiedFile): string {
    switch (file.type) {
      case FileType.CONTAINER:
        const container = file.content as ContainerFile;
        return `${container.cells.length} cells, ${container.designer?.name || 'Unknown designer'}`;
      
      case FileType.SOLUTION:
        const solution = file.content as SolutionFile;
        return `${solution.pieces.length} pieces, ${solution.metadata?.algorithm || 'Unknown algorithm'}`;
      
      case FileType.STATUS:
        const status = file.content as StatusFile;
        return `${status.mode} mode, ${status.progress.completedPieces?.length || 0} pieces completed`;
      
      default:
        return 'Unknown file type';
    }
  }
}
