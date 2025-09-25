// V3 Coordinate Service - Clean FCC coordinate operations
import { FCCCoord } from '../../lib/coords/fcc';
import { fccToWorld } from '../../lib/coords/fcc';
import * as THREE from 'three';
import QuickHull from 'quickhull3d';

export interface CellRecord {
  engineCoord: FCCCoord; // Original ijk coordinates (integers)
  worldCoord: THREE.Vector3; // Oriented xyz coordinates (3-digit precision)
}

export interface OrientationInfo {
  transformMatrix: THREE.Matrix4;
  inverseMatrix: THREE.Matrix4;
  pivotPoint: THREE.Vector3;
  largestFaceNormal: THREE.Vector3;
}

interface FaceGroup {
  triangles: number[][];
  normal: THREE.Vector3;
  centroid: THREE.Vector3;
  totalArea: number;
}

export interface HullAnalysis {
  center: THREE.Vector3;
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
  transformMatrix: THREE.Matrix4;
}

export interface ICoordinateService {
  createOrientedCellRecords(coordinates: FCCCoord[]): { records: CellRecord[], orientation: OrientationInfo };
  getNeighbors(coord: FCCCoord): FCCCoord[];
  calculateSphereRadius(records: CellRecord[]): number;
}

export class CoordinateService implements ICoordinateService {
  
  createOrientedCellRecords(coordinates: FCCCoord[]): { records: CellRecord[], orientation: OrientationInfo } {
    // Step 1: Convert ijk to xyz coordinates
    const rawRecords = coordinates.map(coord => {
      const worldPos = fccToWorld(coord);
      return {
        engineCoord: coord,
        worldCoord: new THREE.Vector3(
          Math.round(worldPos.x * 1000) / 1000, // 3-digit precision
          Math.round(worldPos.y * 1000) / 1000,
          Math.round(worldPos.z * 1000) / 1000
        )
      };
    });

    // Step 2: Compute convex hull and find largest face
    const orientation = this.computeOrientation(rawRecords);

    // Step 3: Apply orientation transformation
    const orientedRecords = rawRecords.map(record => ({
      ...record,
      worldCoord: new THREE.Vector3()
        .copy(record.worldCoord)
        .applyMatrix4(orientation.transformMatrix)
    }));

    return { records: orientedRecords, orientation };
  }

  private computeOrientation(records: CellRecord[]): OrientationInfo {
    // Prepare points for quickhull - convert to Float32Array format
    const points = records.map(r => new Float32Array([r.worldCoord.x, r.worldCoord.y, r.worldCoord.z]));
    
    // Compute convex hull
    const hull = QuickHull(points) as number[][];
    
    // Group coplanar triangles into faces
    const groupedFaces = this.groupCoplanarTriangles(hull, points);
    
    // Find largest grouped face
    let largestFaceGroup = groupedFaces[0];
    let largestArea = 0;
    
    for (const faceGroup of groupedFaces) {
      if (faceGroup.totalArea > largestArea) {
        largestArea = faceGroup.totalArea;
        largestFaceGroup = faceGroup;
      }
    }

    // Use the normal and centroid from the largest face group
    const normal = largestFaceGroup.normal.clone().negate(); // Flip normal so largest face points down to XZ plane
    const centroid = largestFaceGroup.centroid;

    // Create transformation to align face normal with Y-axis (XZ plane)
    const targetNormal = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(normal, targetNormal);
    
    const transformMatrix = new THREE.Matrix4()
      .makeRotationFromQuaternion(quaternion);
    
    // Apply rotation first, then find the lowest point to place on XZ plane
    const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
    
    // Apply rotation to all points to find the lowest Y coordinate
    let minY = Infinity;
    const rotatedPoints = records.map(record => {
      const rotatedPoint = record.worldCoord.clone().applyMatrix4(rotationMatrix);
      minY = Math.min(minY, rotatedPoint.y);
      return rotatedPoint;
    });
    
    // Calculate centroid of rotated points for X,Z centering
    const rotatedCentroid = new THREE.Vector3();
    rotatedPoints.forEach(p => rotatedCentroid.add(p));
    rotatedCentroid.divideScalar(rotatedPoints.length);
    
    // Create translation: center X,Z but place lowest point on XZ plane (Y=0)
    // Note: This places sphere centers so the bottom of the spheres touch Y=0
    const translation = new THREE.Matrix4().makeTranslation(
      -rotatedCentroid.x, 
      -minY,  // Move lowest point to Y=0 (sphere centers will be at sphere radius height)
      -rotatedCentroid.z
    );
    
    // Combine rotation and translation
    transformMatrix.copy(rotationMatrix).premultiply(translation);

    const inverseMatrix = new THREE.Matrix4().copy(transformMatrix).invert();

    // Calculate pivot point as overall shape centroid after transformation
    const shapeCentroid = new THREE.Vector3();
    records.forEach(record => shapeCentroid.add(record.worldCoord));
    shapeCentroid.divideScalar(records.length);
    
    const pivotPoint = shapeCentroid.clone().applyMatrix4(transformMatrix);
    
    return {
      transformMatrix,
      inverseMatrix,
      pivotPoint,
      largestFaceNormal: normal
    };
  }

  private groupCoplanarTriangles(hull: number[][], points: Float32Array[]): FaceGroup[] {
    const tolerance = 0.001; // Tolerance for coplanar detection
    const faceGroups: FaceGroup[] = [];
    
    // Calculate triangle data
    const triangleData = hull.map((face, index) => {
      const p1 = new THREE.Vector3(points[face[0]][0], points[face[0]][1], points[face[0]][2]);
      const p2 = new THREE.Vector3(points[face[1]][0], points[face[1]][1], points[face[1]][2]);
      const p3 = new THREE.Vector3(points[face[2]][0], points[face[2]][1], points[face[2]][2]);
      
      const normal = new THREE.Vector3()
        .subVectors(p2, p1)
        .cross(new THREE.Vector3().subVectors(p3, p1))
        .normalize();
      
      const centroid = new THREE.Vector3()
        .add(p1)
        .add(p2)
        .add(p3)
        .divideScalar(3);
      
      const area = this.calculateTriangleArea(p1, p2, p3);
      
      // Calculate plane equation (ax + by + cz + d = 0)
      const d = -normal.dot(centroid);
      
      return {
        index,
        face,
        normal,
        centroid,
        area,
        planeD: d,
        vertices: [p1, p2, p3]
      };
    });
    
    const used = new Set<number>();
    
    // Group triangles by coplanarity
    for (let i = 0; i < triangleData.length; i++) {
      if (used.has(i)) continue;
      
      const baseTriangle = triangleData[i];
      const group: typeof triangleData = [baseTriangle];
      used.add(i);
      
      // Find coplanar triangles
      for (let j = i + 1; j < triangleData.length; j++) {
        if (used.has(j)) continue;
        
        const testTriangle = triangleData[j];
        
        // Check if normals are similar
        const normalSimilarity = baseTriangle.normal.dot(testTriangle.normal);
        if (normalSimilarity < 0.999) continue;
        
        // Check if triangles are on the same plane
        const planeDistance = Math.abs(baseTriangle.planeD - testTriangle.planeD);
        if (planeDistance > tolerance) continue;
        
        // Additional check: test if vertices lie on the same plane
        let onSamePlane = true;
        for (const vertex of testTriangle.vertices) {
          const distance = Math.abs(baseTriangle.normal.dot(vertex) + baseTriangle.planeD);
          if (distance > tolerance) {
            onSamePlane = false;
            break;
          }
        }
        
        if (onSamePlane) {
          group.push(testTriangle);
          used.add(j);
        }
      }
      
      // Calculate combined face data
      const totalArea = group.reduce((sum, tri) => sum + tri.area, 0);
      const avgCentroid = new THREE.Vector3();
      group.forEach(tri => avgCentroid.add(tri.centroid));
      avgCentroid.divideScalar(group.length);
      
      faceGroups.push({
        triangles: group.map(tri => tri.face),
        normal: baseTriangle.normal.clone(),
        centroid: avgCentroid,
        totalArea: totalArea
      });
    }
    
    return faceGroups;
  }

  private calculateTriangleArea(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
    const v1 = new THREE.Vector3().subVectors(p2, p1);
    const v2 = new THREE.Vector3().subVectors(p3, p1);
    return v1.cross(v2).length() * 0.5;
  }

  getNeighbors(coord: FCCCoord): FCCCoord[] {
    // FCC has 6 rhombohedral neighbors
    const neighbors: FCCCoord[] = [
      { x: coord.x + 1, y: coord.y, z: coord.z },
      { x: coord.x - 1, y: coord.y, z: coord.z },
      { x: coord.x, y: coord.y + 1, z: coord.z },
      { x: coord.x, y: coord.y - 1, z: coord.z },
      { x: coord.x, y: coord.y, z: coord.z + 1 },
      { x: coord.x, y: coord.y, z: coord.z - 1 }
    ];
    return neighbors;
  }

  calculateSphereRadius(records: CellRecord[]): number {
    if (records.length < 2) return 0.4; // Default radius
    
    // Find minimum distance between any two cells
    let minDistance = Infinity;
    
    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const distance = records[i].worldCoord.distanceTo(records[j].worldCoord);
        if (distance > 0 && distance < minDistance) {
          minDistance = distance;
        }
      }
    }
    
    // Sphere radius is half the minimum distance so spheres just touch
    return minDistance / 2;
  }
}

export const coordinateService = new CoordinateService();
