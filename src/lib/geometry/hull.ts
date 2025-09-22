import * as THREE from 'three';
import convexHull from 'convex-hull';

export interface HullFace {
  vertices: THREE.Vector3[];
  normal: THREE.Vector3;
  area: number;
  centroid: THREE.Vector3;
}

export interface HullAnalysis {
  faces: HullFace[];
  largestFace: HullFace;
  orientationMatrix: THREE.Matrix4;
  centeredPositions: THREE.Vector3[];
}

/**
 * Calculate 3D convex hull and analyze faces
 */
export function analyzeConvexHull(points: THREE.Vector3[]): HullAnalysis {
  if (points.length < 4) {
    throw new Error('Need at least 4 points for 3D convex hull');
  }

  console.log(`🔍 Hull Analysis: Processing ${points.length} points`);

  // Convert THREE.Vector3 to array format for convex-hull library
  const pointsArray = points.map(p => [p.x, p.y, p.z]);
  
  // Calculate convex hull faces
  const hullFaces = convexHull(pointsArray);
  console.log(`🔍 Hull Analysis: Found ${hullFaces.length} faces`);

  // Convert hull faces to our HullFace format
  const faces: HullFace[] = hullFaces.map(face => {
    const vertices = face.map(index => points[index]);
    const normal = calculateFaceNormal(vertices);
    const area = calculateFaceArea(vertices);
    const centroid = calculateFaceCentroid(vertices);
    
    return { vertices, normal, area, centroid };
  });

  // Find the largest face by area
  const largestFace = faces.reduce((largest, face) => 
    face.area > largest.area ? face : largest
  );

  console.log(`🔍 Hull Analysis: Largest face area = ${largestFace.area.toFixed(3)}`);
  console.log(`🔍 Hull Analysis: Largest face normal = (${largestFace.normal.x.toFixed(3)}, ${largestFace.normal.y.toFixed(3)}, ${largestFace.normal.z.toFixed(3)})`);

  // Calculate orientation matrix to align largest face with XZ plane
  const orientationMatrix = calculateOrientationMatrix(largestFace.normal, largestFace.centroid);

  // Apply orientation to all points
  const centeredPositions = points.map(point => {
    const transformed = point.clone().applyMatrix4(orientationMatrix);
    return transformed;
  });

  return {
    faces,
    largestFace,
    orientationMatrix,
    centeredPositions
  };
}

/**
 * Calculate face normal using cross product
 */
function calculateFaceNormal(vertices: THREE.Vector3[]): THREE.Vector3 {
  if (vertices.length < 3) {
    return new THREE.Vector3(0, 1, 0); // Default up vector
  }

  const v1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
  const v2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
  const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
  
  return normal;
}

/**
 * Calculate face area using triangle fan method
 */
function calculateFaceArea(vertices: THREE.Vector3[]): number {
  if (vertices.length < 3) return 0;

  let area = 0;
  const center = calculateFaceCentroid(vertices);

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    
    const edge1 = new THREE.Vector3().subVectors(v1, center);
    const edge2 = new THREE.Vector3().subVectors(v2, center);
    const cross = new THREE.Vector3().crossVectors(edge1, edge2);
    
    area += cross.length() * 0.5;
  }

  return area;
}

/**
 * Calculate face centroid (average of vertices)
 */
function calculateFaceCentroid(vertices: THREE.Vector3[]): THREE.Vector3 {
  const centroid = new THREE.Vector3();
  vertices.forEach(vertex => centroid.add(vertex));
  centroid.divideScalar(vertices.length);
  return centroid;
}

/**
 * Calculate transformation matrix to orient face normal to Y-axis (up)
 * and position centroid at origin
 */
function calculateOrientationMatrix(faceNormal: THREE.Vector3, faceCentroid: THREE.Vector3): THREE.Matrix4 {
  const matrix = new THREE.Matrix4();
  
  // Step 1: Translate so face centroid is at origin
  const translationMatrix = new THREE.Matrix4().makeTranslation(
    -faceCentroid.x, 
    -faceCentroid.y, 
    -faceCentroid.z
  );
  
  // Step 2: Rotate so face normal aligns with Y-axis (0, 1, 0)
  const targetUp = new THREE.Vector3(0, 1, 0);
  const rotationMatrix = new THREE.Matrix4();
  
  // Calculate rotation quaternion from face normal to Y-axis
  const quaternion = new THREE.Quaternion().setFromUnitVectors(faceNormal, targetUp);
  rotationMatrix.makeRotationFromQuaternion(quaternion);
  
  // Step 3: Combine transformations (rotation first, then translation)
  matrix.multiplyMatrices(rotationMatrix, translationMatrix);
  
  console.log(`🔍 Orientation: Face normal (${faceNormal.x.toFixed(3)}, ${faceNormal.y.toFixed(3)}, ${faceNormal.z.toFixed(3)}) → Y-axis`);
  console.log(`🔍 Orientation: Face centroid (${faceCentroid.x.toFixed(3)}, ${faceCentroid.y.toFixed(3)}, ${faceCentroid.z.toFixed(3)}) → Origin`);
  
  return matrix;
}

/**
 * Calculate bounding box of points
 */
export function calculateBoundingBox(points: THREE.Vector3[]): THREE.Box3 {
  const box = new THREE.Box3();
  points.forEach(point => box.expandByPoint(point));
  return box;
}

/**
 * Calculate optimal camera position to view all points
 */
export function calculateOptimalCameraPosition(points: THREE.Vector3[], camera: THREE.Camera): { position: THREE.Vector3; target: THREE.Vector3 } {
  const box = calculateBoundingBox(points);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  
  // Calculate distance needed to fit all points in view
  const maxDimension = Math.max(size.x, size.y, size.z);
  const fov = (camera as THREE.PerspectiveCamera).fov || 75;
  const distance = maxDimension / (2 * Math.tan((fov * Math.PI / 180) / 2)) * 1.2; // 20% padding
  
  // Position camera above and in front of the shape
  const position = new THREE.Vector3(
    center.x + distance * 0.5,
    center.y + distance * 0.8,
    center.z + distance
  );
  
  return { position, target: center };
}
