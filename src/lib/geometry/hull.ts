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

  // Convert hull faces to our HullFace format with enhanced debugging
  const faces: HullFace[] = hullFaces.map((face, faceIndex) => {
    const vertices = face.map(index => points[index]);
    const normal = calculateFaceNormal(vertices);
    const area = calculateFaceArea(vertices);
    const centroid = calculateFaceCentroid(vertices);
    
    console.log(`🔍 Face ${faceIndex}: ${vertices.length} vertices, area = ${area.toFixed(3)}, normal = (${normal.x.toFixed(3)}, ${normal.y.toFixed(3)}, ${normal.z.toFixed(3)})`);
    
    return { vertices, normal, area, centroid };
  });

  // Find the largest face by area with detailed comparison
  let largestFace = faces[0];
  console.log(`🔍 Face comparison:`);
  faces.forEach((face, index) => {
    console.log(`  Face ${index}: area = ${face.area.toFixed(3)}, normal = (${face.normal.x.toFixed(3)}, ${face.normal.y.toFixed(3)}, ${face.normal.z.toFixed(3)})`);
    if (face.area > largestFace.area) {
      console.log(`  ↑ New largest face found: Face ${index}`);
      largestFace = face;
    }
  });

  console.log(`🔍 Hull Analysis: Selected largest face area = ${largestFace.area.toFixed(3)}`);
  console.log(`🔍 Hull Analysis: Selected face normal = (${largestFace.normal.x.toFixed(3)}, ${largestFace.normal.y.toFixed(3)}, ${largestFace.normal.z.toFixed(3)})`);

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
 * Ensures normal points outward from the convex hull
 */
function calculateFaceNormal(vertices: THREE.Vector3[]): THREE.Vector3 {
  if (vertices.length < 3) {
    return new THREE.Vector3(0, 1, 0); // Default up vector
  }

  // Calculate normal using first three vertices
  const v1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
  const v2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
  let normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
  
  // For convex hull faces, the normal should point outward
  // The convex-hull library should already provide faces with correct winding order
  // but let's add some debugging to verify
  console.log(`    Face normal: (${normal.x.toFixed(3)}, ${normal.y.toFixed(3)}, ${normal.z.toFixed(3)})`);
  
  return normal;
}

/**
 * Calculate face area using proper triangulation method
 */
function calculateFaceArea(vertices: THREE.Vector3[]): number {
  if (vertices.length < 3) return 0;
  if (vertices.length === 3) {
    // Simple triangle area
    const v1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
    const v2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
    return v1.cross(v2).length() * 0.5;
  }

  // For polygons with more than 3 vertices, use triangle fan from first vertex
  let area = 0;
  const baseVertex = vertices[0];

  for (let i = 1; i < vertices.length - 1; i++) {
    const v1 = new THREE.Vector3().subVectors(vertices[i], baseVertex);
    const v2 = new THREE.Vector3().subVectors(vertices[i + 1], baseVertex);
    const triangleArea = v1.cross(v2).length() * 0.5;
    area += triangleArea;
    
    console.log(`    Triangle ${i}: area = ${triangleArea.toFixed(3)}`);
  }

  console.log(`    Total face area: ${area.toFixed(3)}`);
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
 * Calculate transformation matrix to orient face normal to -Y-axis (down)
 * and position centroid at origin
 */
function calculateOrientationMatrix(faceNormal: THREE.Vector3, faceCentroid: THREE.Vector3): THREE.Matrix4 {
  console.log(`🔍 Calculating orientation matrix:`);
  console.log(`  Input face normal: (${faceNormal.x.toFixed(3)}, ${faceNormal.y.toFixed(3)}, ${faceNormal.z.toFixed(3)})`);
  console.log(`  Input face centroid: (${faceCentroid.x.toFixed(3)}, ${faceCentroid.y.toFixed(3)}, ${faceCentroid.z.toFixed(3)})`);
  
  const matrix = new THREE.Matrix4();
  
  // Step 1: Translate so face centroid is at origin
  const translationMatrix = new THREE.Matrix4().makeTranslation(
    -faceCentroid.x, 
    -faceCentroid.y, 
    -faceCentroid.z
  );
  console.log(`  Translation: (${-faceCentroid.x.toFixed(3)}, ${-faceCentroid.y.toFixed(3)}, ${-faceCentroid.z.toFixed(3)})`);
  
  // Step 2: Rotate so face normal aligns with -Y-axis (0, -1, 0) - largest face points down
  const targetDown = new THREE.Vector3(0, -1, 0);
  const rotationMatrix = new THREE.Matrix4();
  
  // Check if face normal is already aligned with target
  const dot = faceNormal.dot(targetDown);
  console.log(`  Dot product with -Y: ${dot.toFixed(3)} (1.0 = already aligned, -1.0 = opposite)`);
  
  // Calculate rotation quaternion from face normal to -Y-axis
  const quaternion = new THREE.Quaternion().setFromUnitVectors(faceNormal, targetDown);
  rotationMatrix.makeRotationFromQuaternion(quaternion);
  
  // Step 3: Combine transformations (rotation first, then translation)
  matrix.multiplyMatrices(rotationMatrix, translationMatrix);
  
  console.log(`🔍 Orientation: Face normal (${faceNormal.x.toFixed(3)}, ${faceNormal.y.toFixed(3)}, ${faceNormal.z.toFixed(3)}) → -Y-axis (down)`);
  console.log(`🔍 Orientation: Face centroid (${faceCentroid.x.toFixed(3)}, ${faceCentroid.y.toFixed(3)}, ${faceCentroid.z.toFixed(3)}) → Origin`);
  
  // Test the transformation on the original normal
  const testNormal = faceNormal.clone().applyMatrix4(rotationMatrix);
  console.log(`🔍 Verification: Transformed normal = (${testNormal.x.toFixed(3)}, ${testNormal.y.toFixed(3)}, ${testNormal.z.toFixed(3)}) (should be close to (0, -1, 0))`);
  
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
