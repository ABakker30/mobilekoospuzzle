// V3 File Service - Clean abstraction for all file operations
// Supports GitHub, localStorage, and future backend integration

import { FCCCoord } from '../../lib/coords/fcc';

// File type definitions
export interface ContainerFile {
  name: string;
  coordinates: FCCCoord[];
  metadata?: {
    created?: string;
    modified?: string;
    author?: string;
    description?: string;
  };
}

export interface SolutionFile {
  name: string;
  shape: FCCCoord[];
  pieces: Array<{
    id: string;
    coordinates: FCCCoord[];
    position: FCCCoord;
    orientation?: number;
  }>;
  metadata?: {
    created?: string;
    modified?: string;
    author?: string;
    difficulty?: number;
    solveTime?: number;
  };
}

export interface FileMetadata {
  name: string;
  size: number;
  modified: string;
  source: 'github' | 'localStorage' | 'backend';
  type: 'container' | 'solution';
}

// File service interface
export interface IFileService {
  // Browse operations
  listContainers(): Promise<FileMetadata[]>;
  listSolutions(): Promise<FileMetadata[]>;
  
  // Load operations
  loadContainer(name: string): Promise<ContainerFile>;
  loadSolution(name: string): Promise<SolutionFile>;
  
  // Save operations
  saveContainer(file: ContainerFile): Promise<void>;
  saveSolution(file: SolutionFile): Promise<void>;
  
  // Delete operations
  deleteContainer(name: string): Promise<void>;
  deleteSolution(name: string): Promise<void>;
  
  // Utility operations
  exists(name: string, type: 'container' | 'solution'): Promise<boolean>;
  getMetadata(name: string, type: 'container' | 'solution'): Promise<FileMetadata>;
}

// V3 File Service Implementation
export class FileService implements IFileService {
  private githubBaseUrl = 'https://raw.githubusercontent.com/ABakker30/mobilekoospuzzle/main/public/content';
  
  constructor() {
    // Initialize service
  }

  // Browse operations
  async listContainers(): Promise<FileMetadata[]> {
    const [githubFiles, localFiles] = await Promise.all([
      this.listGithubContainers(),
      this.listLocalContainers()
    ]);
    
    return [...githubFiles, ...localFiles];
  }

  async listSolutions(): Promise<FileMetadata[]> {
    const [githubFiles, localFiles] = await Promise.all([
      this.listGithubSolutions(),
      this.listLocalSolutions()
    ]);
    
    return [...githubFiles, ...localFiles];
  }

  // Load operations
  async loadContainer(name: string): Promise<ContainerFile> {
    // Try localStorage first, then GitHub
    try {
      return await this.loadLocalContainer(name);
    } catch {
      return await this.loadGithubContainer(name);
    }
  }

  async loadSolution(name: string): Promise<SolutionFile> {
    // Try localStorage first, then GitHub
    try {
      return await this.loadLocalSolution(name);
    } catch {
      return await this.loadGithubSolution(name);
    }
  }

  // Save operations (localStorage only for now)
  async saveContainer(file: ContainerFile): Promise<void> {
    const key = `container_${file.name}`;
    const data = {
      ...file,
      metadata: {
        ...file.metadata,
        modified: new Date().toISOString()
      }
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  }

  async saveSolution(file: SolutionFile): Promise<void> {
    const key = `solution_${file.name}`;
    const data = {
      ...file,
      metadata: {
        ...file.metadata,
        modified: new Date().toISOString()
      }
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Delete operations (localStorage only)
  async deleteContainer(name: string): Promise<void> {
    const key = `container_${name}`;
    localStorage.removeItem(key);
  }

  async deleteSolution(name: string): Promise<void> {
    const key = `solution_${name}`;
    localStorage.removeItem(key);
  }

  // Utility operations
  async exists(name: string, type: 'container' | 'solution'): Promise<boolean> {
    const key = `${type}_${name}`;
    return localStorage.getItem(key) !== null;
  }

  async getMetadata(name: string, type: 'container' | 'solution'): Promise<FileMetadata> {
    const key = `${type}_${name}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      throw new Error(`File not found: ${name}`);
    }
    
    const parsed = JSON.parse(data);
    return {
      name,
      size: data.length,
      modified: parsed.metadata?.modified || 'Unknown',
      source: 'localStorage',
      type
    };
  }

  // Private GitHub operations
  private async listGithubContainers(): Promise<FileMetadata[]> {
    // Real container files from GitHub
    const containerFiles = [
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
      'hollow_pyramid.fcc.json',
      'hollowpyramid.py.fcc.json'
    ];

    return containerFiles.map(filename => ({
      name: filename,
      size: 4000, // Approximate size
      modified: '2024-09-13',
      source: 'github' as const,
      type: 'container' as const
    }));
  }

  private async listGithubSolutions(): Promise<FileMetadata[]> {
    // Mock implementation - replace with actual GitHub API calls
    return [
      {
        name: 'tetris-solution-a.solution.json',
        size: 4096,
        modified: '2024-09-22',
        source: 'github',
        type: 'solution'
      }
    ];
  }

  private async listLocalContainers(): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('container_')) {
        const name = key.replace('container_', '');
        try {
          const metadata = await this.getMetadata(name, 'container');
          files.push(metadata);
        } catch {
          // Skip invalid files
        }
      }
    }
    
    return files;
  }

  private async listLocalSolutions(): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('solution_')) {
        const name = key.replace('solution_', '');
        try {
          const metadata = await this.getMetadata(name, 'solution');
          files.push(metadata);
        } catch {
          // Skip invalid files
        }
      }
    }
    
    return files;
  }

  private async loadGithubContainer(name: string): Promise<ContainerFile> {
    const url = `${this.githubBaseUrl}/containers/${name}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load container from GitHub: ${name}`);
    }
    
    const rawData = await response.json();
    
    // Convert from GitHub format to our format
    const coordinates = rawData.cells.map((cell: number[]) => ({
      x: cell[0],
      y: cell[1], 
      z: cell[2]
    }));
    
    return {
      name: name.replace('.fcc.json', ''),
      coordinates,
      metadata: {
        created: rawData.designer?.date || 'Unknown',
        author: rawData.designer?.name || 'Unknown',
        description: `CID: ${rawData.cid || 'Unknown'}`
      }
    };
  }

  private async loadGithubSolution(name: string): Promise<SolutionFile> {
    const url = `${this.githubBaseUrl}/solutions/${name}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load solution from GitHub: ${name}`);
    }
    
    return await response.json();
  }

  private async loadLocalContainer(name: string): Promise<ContainerFile> {
    const key = `container_${name}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      throw new Error(`Container not found in localStorage: ${name}`);
    }
    
    return JSON.parse(data);
  }

  private async loadLocalSolution(name: string): Promise<SolutionFile> {
    const key = `solution_${name}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      throw new Error(`Solution not found in localStorage: ${name}`);
    }
    
    return JSON.parse(data);
  }
}

// Export singleton instance
export const fileService = new FileService();
