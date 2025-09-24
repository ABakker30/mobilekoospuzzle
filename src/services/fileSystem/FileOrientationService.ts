import * as THREE from 'three';
import { OrientationData, ContainerFile, SolutionFile } from '../../types/fileSystem';
import { analyzeConvexHull } from '../../lib/geometry/hull';
import { fccToWorld } from '../../lib/coords/fcc';

export class FileOrientationService {
  private static instance: FileOrientationService;

  static getInstance(): FileOrientationService {
    if (!FileOrientationService.instance) {
      FileOrientationService.instance = new FileOrientationService();
    }
    return FileOrientationService.instance;
  }

  /**
   * Calculate orientation data for any file type that contains coordinates
   */
  calculateOrientation(content: ContainerFile | SolutionFile): OrientationData | null {
    try {
      const coordinates = this.extractCoordinates(content);
      
      if (coordinates.length < 4) {
        console.log(`FileOrientationService: Not enough coordinates (${coordinates.length}) for hull analysis`);
        return null;
      }

      console.log(`🔍 FileOrientationService: Calculating orientation for ${coordinates.length} coordinates`);

      // Convert to world coordinates using the same method as V1
      const worldPoints = this.convertToWorldCoordinates(coordinates);
      
      // Perform convex hull analysis
      const hullAnalysis = analyzeConvexHull(worldPoints);
      
      // Convert THREE.Matrix4 to flat array for serialization
      const matrixArray = hullAnalysis.orientationMatrix.elements;
      
      const orientationData: OrientationData = {
        orientationMatrix: Array.from(matrixArray),
        largestFaceArea: hullAnalysis.largestFace.area,
        largestFaceNormal: [
          hullAnalysis.largestFace.normal.x,
          hullAnalysis.largestFace.normal.y,
          hullAnalysis.largestFace.normal.z
        ],
        largestFaceCentroid: [
          hullAnalysis.largestFace.centroid.x,
          hullAnalysis.largestFace.centroid.y,
          hullAnalysis.largestFace.centroid.z
        ],
        coordinateCount: coordinates.length
      };

      console.log(`🔍 FileOrientationService: Orientation calculated - largest face area: ${orientationData.largestFaceArea.toFixed(3)}`);
      
      return orientationData;
    } catch (error) {
      console.error('FileOrientationService: Error calculating orientation:', error);
      return null;
    }
  }

  /**
   * Extract coordinates from different file types
   */
  private extractCoordinates(content: ContainerFile | SolutionFile): { x: number; y: number; z: number }[] {
    if ('cells' in content) {
      // Container file - convert [i,j,k] arrays to {x,y,z} objects
      return content.cells.map(([i, j, k]) => ({ x: i, y: j, z: k }));
    } else if ('pieces' in content) {
      // Solution file - extract all coordinates from all pieces
      const allCoordinates: { x: number; y: number; z: number }[] = [];
      content.pieces.forEach(piece => {
        piece.coordinates.forEach(([i, j, k]) => {
          allCoordinates.push({ x: i, y: j, z: k });
        });
      });
      return allCoordinates;
    }
    
    return [];
  }

  /**
   * Convert engine coordinates to world coordinates using V1 method
   */
  private convertToWorldCoordinates(coordinates: { x: number; y: number; z: number }[]): THREE.Vector3[] {
    // Step 1: Convert ALL engine coordinates to world space (no centering yet)
    const worldCoords = coordinates.map(coord => fccToWorld(coord));
    
    // Step 2: Find bounding box in WORLD space (same as V1)
    const minX = Math.min(...worldCoords.map(w => w.x));
    const minY = Math.min(...worldCoords.map(w => w.y));
    const minZ = Math.min(...worldCoords.map(w => w.z));
    const maxX = Math.max(...worldCoords.map(w => w.x));
    const maxY = Math.max(...worldCoords.map(w => w.y));
    const maxZ = Math.max(...worldCoords.map(w => w.z));
    
    // Step 3: Calculate center point in WORLD space
    const worldCenter = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };
    
    // Step 4: Apply centering in WORLD space with 3-digit precision (same as V1)
    const worldPoints = worldCoords.map(worldPos => {
      const centeredX = Math.round((worldPos.x - worldCenter.x) * 1000) / 1000;
      const centeredY = Math.round((worldPos.y - worldCenter.y) * 1000) / 1000;
      const centeredZ = Math.round((worldPos.z - worldCenter.z) * 1000) / 1000;
      
      return new THREE.Vector3(centeredX, centeredY, centeredZ);
    });
    
    return worldPoints;
  }

  /**
   * Convert flat array back to THREE.Matrix4
   */
  static arrayToMatrix4(matrixArray: number[]): THREE.Matrix4 {
    const matrix = new THREE.Matrix4();
    matrix.fromArray(matrixArray);
    return matrix;
  }

  /**
   * Apply orientation to coordinates (for use in workspace)
   */
  applyOrientationToCoordinates(
    coordinates: { x: number; y: number; z: number }[],
    orientationData: OrientationData
  ): THREE.Vector3[] {
    // Convert to world coordinates
    const worldPoints = this.convertToWorldCoordinates(coordinates);
    
    // Apply orientation matrix
    const orientationMatrix = FileOrientationService.arrayToMatrix4(orientationData.orientationMatrix);
    
    return worldPoints.map(point => point.clone().applyMatrix4(orientationMatrix));
  }
}
