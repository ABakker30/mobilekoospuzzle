// Shape Content Management Service
// This will integrate with Firebase when backend is set up

import { FCCCoord } from '../../lib/coords/fcc';

export interface ShapeMetadata {
  cid: string;                    // Content-addressable ID
  creator: string;                // User UID
  createdAt: number;              // timestamp
  title?: string;
  description?: string;
  tags: string[];
  difficulty: number;             // 1-10 scale
  popularity: number;             // View/usage count
  isPublic: boolean;
  featured: boolean;              // Curated content
}

export interface ShapeData {
  coordinates: FCCCoord[];
  metadata: ShapeMetadata;
}

export interface ShapeService {
  // Shape CRUD operations
  createShape(coordinates: FCCCoord[], metadata: Omit<ShapeMetadata, 'cid' | 'createdAt' | 'popularity'>): Promise<string>;
  getShape(cid: string): Promise<ShapeData | null>;
  updateShape(cid: string, updates: Partial<ShapeMetadata>): Promise<void>;
  deleteShape(cid: string): Promise<void>;
  
  // Shape discovery
  searchShapes(query: string, filters?: ShapeSearchFilters): Promise<ShapeMetadata[]>;
  getFeaturedShapes(): Promise<ShapeMetadata[]>;
  getUserShapes(userId: string): Promise<ShapeMetadata[]>;
  getPopularShapes(limit?: number): Promise<ShapeMetadata[]>;
  
  // Shape interactions
  likeShape(cid: string): Promise<void>;
  unlikeShape(cid: string): Promise<void>;
  incrementViews(cid: string): Promise<void>;
}

export interface ShapeSearchFilters {
  tags?: string[];
  difficulty?: { min?: number; max?: number };
  creator?: string;
  featured?: boolean;
  sortBy?: 'popularity' | 'created' | 'difficulty';
  sortOrder?: 'asc' | 'desc';
}

// Mock implementation for development
export class MockShapeService implements ShapeService {
  private shapes: Map<string, ShapeData> = new Map();
  private userLikes: Set<string> = new Set();

  constructor() {
    // Add some mock shapes for testing
    this.initializeMockData();
  }

  async createShape(
    coordinates: FCCCoord[], 
    metadata: Omit<ShapeMetadata, 'cid' | 'createdAt' | 'popularity'>
  ): Promise<string> {
    const cid = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const shapeData: ShapeData = {
      coordinates,
      metadata: {
        ...metadata,
        cid,
        createdAt: Date.now(),
        popularity: 0
      }
    };
    
    this.shapes.set(cid, shapeData);
    return cid;
  }

  async getShape(cid: string): Promise<ShapeData | null> {
    const shape = this.shapes.get(cid);
    if (shape) {
      // Increment view count
      shape.metadata.popularity += 1;
    }
    return shape || null;
  }

  async updateShape(cid: string, updates: Partial<ShapeMetadata>): Promise<void> {
    const shape = this.shapes.get(cid);
    if (shape) {
      shape.metadata = { ...shape.metadata, ...updates };
    }
  }

  async deleteShape(cid: string): Promise<void> {
    this.shapes.delete(cid);
    this.userLikes.delete(cid);
  }

  async searchShapes(query: string, filters?: ShapeSearchFilters): Promise<ShapeMetadata[]> {
    let results = Array.from(this.shapes.values()).map(shape => shape.metadata);
    
    // Filter by query (search in title, description, tags)
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(shape => 
        shape.title?.toLowerCase().includes(lowerQuery) ||
        shape.description?.toLowerCase().includes(lowerQuery) ||
        shape.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply filters
    if (filters) {
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(shape => 
          filters.tags!.some(tag => shape.tags.includes(tag))
        );
      }
      
      if (filters.difficulty) {
        results = results.filter(shape => {
          const difficulty = shape.difficulty;
          return (!filters.difficulty!.min || difficulty >= filters.difficulty!.min) &&
                 (!filters.difficulty!.max || difficulty <= filters.difficulty!.max);
        });
      }
      
      if (filters.creator) {
        results = results.filter(shape => shape.creator === filters.creator);
      }
      
      if (filters.featured !== undefined) {
        results = results.filter(shape => shape.featured === filters.featured);
      }
    }
    
    // Sort results
    if (filters?.sortBy) {
      results.sort((a, b) => {
        let aVal: number, bVal: number;
        
        switch (filters.sortBy) {
          case 'popularity':
            aVal = a.popularity;
            bVal = b.popularity;
            break;
          case 'created':
            aVal = a.createdAt;
            bVal = b.createdAt;
            break;
          case 'difficulty':
            aVal = a.difficulty;
            bVal = b.difficulty;
            break;
          default:
            return 0;
        }
        
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        return (aVal - bVal) * order;
      });
    }
    
    return results;
  }

  async getFeaturedShapes(): Promise<ShapeMetadata[]> {
    return this.searchShapes('', { featured: true, sortBy: 'popularity', sortOrder: 'desc' });
  }

  async getUserShapes(userId: string): Promise<ShapeMetadata[]> {
    return this.searchShapes('', { creator: userId, sortBy: 'created', sortOrder: 'desc' });
  }

  async getPopularShapes(limit = 10): Promise<ShapeMetadata[]> {
    const results = await this.searchShapes('', { sortBy: 'popularity', sortOrder: 'desc' });
    return results.slice(0, limit);
  }

  async likeShape(cid: string): Promise<void> {
    this.userLikes.add(cid);
    const shape = this.shapes.get(cid);
    if (shape) {
      shape.metadata.popularity += 1;
    }
  }

  async unlikeShape(cid: string): Promise<void> {
    this.userLikes.delete(cid);
    const shape = this.shapes.get(cid);
    if (shape) {
      shape.metadata.popularity = Math.max(0, shape.metadata.popularity - 1);
    }
  }

  async incrementViews(cid: string): Promise<void> {
    const shape = this.shapes.get(cid);
    if (shape) {
      shape.metadata.popularity += 1;
    }
  }

  private initializeMockData() {
    // Create some sample shapes for testing
    const sampleShapes = [
      {
        coordinates: [
          { i: 0, j: 0, k: 0, x: 0, y: 0, z: 0 },
          { i: 1, j: 0, k: 0, x: 1, y: 0, z: 0 },
          { i: 0, j: 1, k: 0, x: 0, y: 1, z: 0 },
          { i: 0, j: 0, k: 1, x: 0, y: 0, z: 1 }
        ],
        metadata: {
          creator: 'system',
          title: 'Tetrahedral Base',
          description: 'A simple tetrahedral arrangement perfect for beginners',
          tags: ['beginner', 'tetrahedral', 'simple'],
          difficulty: 2,
          isPublic: true,
          featured: true
        }
      },
      {
        coordinates: [
          { i: 0, j: 0, k: 0, x: 0, y: 0, z: 0 },
          { i: 1, j: 0, k: 0, x: 1, y: 0, z: 0 },
          { i: 2, j: 0, k: 0, x: 2, y: 0, z: 0 },
          { i: 1, j: 1, k: 0, x: 1, y: 1, z: 0 },
          { i: 1, j: 0, k: 1, x: 1, y: 0, z: 1 }
        ],
        metadata: {
          creator: 'system',
          title: 'Cross Pattern',
          description: 'A cross-shaped puzzle with moderate complexity',
          tags: ['intermediate', 'cross', 'symmetric'],
          difficulty: 5,
          isPublic: true,
          featured: false
        }
      }
    ];

    sampleShapes.forEach(async (shape, index) => {
      const cid = `sample-${index + 1}`;
      this.shapes.set(cid, {
        coordinates: shape.coordinates,
        metadata: {
          ...shape.metadata,
          cid,
          createdAt: Date.now() - (index * 86400000), // Stagger creation dates
          popularity: Math.floor(Math.random() * 50) + 10
        }
      });
    });
  }
}

// Export singleton instance
export const shapeService = new MockShapeService();
