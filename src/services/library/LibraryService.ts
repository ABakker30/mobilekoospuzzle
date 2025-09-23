// GitHub Library Service - fetches public containers like in V1
// This will be replaced with proper database when backend is implemented

export interface LibraryShape {
  name: string;
  filename: string;
  description?: string;
  downloadUrl: string;
  size: number;
  lastModified: string;
}

export interface LibraryService {
  getShapes(): Promise<LibraryShape[]>;
  downloadShape(shape: LibraryShape): Promise<any>;
}

// GitHub-based library service (V1 compatibility)
export class GitHubLibraryService implements LibraryService {
  private readonly baseUrl = 'https://api.github.com/repos/ballpuzzle/ballpuzzle4/contents/public/containers';
  private readonly rawBaseUrl = 'https://raw.githubusercontent.com/ballpuzzle/ballpuzzle4/main/public/containers';

  async getShapes(): Promise<LibraryShape[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const files = await response.json();
      
      // Filter for JSON files and format for library
      return files
        .filter((file: any) => file.name.endsWith('.json') && file.type === 'file')
        .map((file: any) => ({
          name: file.name.replace('.json', '').replace(/[-_]/g, ' '),
          filename: file.name,
          description: `Container shape from V1 library`,
          downloadUrl: file.download_url,
          size: file.size,
          lastModified: new Date().toISOString() // GitHub doesn't provide this easily
        }))
        .sort((a: LibraryShape, b: LibraryShape) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to fetch library shapes:', error);
      // Return some fallback shapes for development
      return this.getFallbackShapes();
    }
  }

  async downloadShape(shape: LibraryShape): Promise<any> {
    try {
      const response = await fetch(shape.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download shape: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to download shape:', error);
      throw error;
    }
  }

  private getFallbackShapes(): LibraryShape[] {
    // Fallback shapes for development/offline use
    return [
      {
        name: 'Simple Cube',
        filename: 'cube.json',
        description: 'A basic 2x2x2 cube shape',
        downloadUrl: '',
        size: 1024,
        lastModified: new Date().toISOString()
      },
      {
        name: 'L Shape',
        filename: 'l-shape.json', 
        description: 'Classic L-shaped tetromino',
        downloadUrl: '',
        size: 512,
        lastModified: new Date().toISOString()
      },
      {
        name: 'Cross Pattern',
        filename: 'cross.json',
        description: 'Cross-shaped puzzle container',
        downloadUrl: '',
        size: 768,
        lastModified: new Date().toISOString()
      }
    ];
  }
}

// Export singleton instance
export const libraryService = new GitHubLibraryService();
