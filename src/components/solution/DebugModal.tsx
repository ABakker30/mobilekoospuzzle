import React from 'react';
import * as THREE from 'three';

interface DebugData {
  cellCount: number;
  engineCoords: Array<[number, number, number]>;
  worldCoords: THREE.Vector3[];
  hullInputCoords: THREE.Vector3[];
  hullFaces: Array<{
    normal: THREE.Vector3;
    area: number;
    centroid: THREE.Vector3;
  }>;
}

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  debugData: DebugData | null;
}

export default function DebugModal({ isOpen, onClose, debugData }: DebugModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Debug Modal (ALT+D)</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {!debugData ? (
            <div className="text-center p-8">
              <h3 className="text-lg font-semibold mb-2">No Debug Data Available</h3>
              <p className="text-gray-600">Load a solution first to see debug information.</p>
            </div>
          ) : (
            <>
              {/* Cell Count */}
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <h3 className="font-semibold">Loaded {debugData.cellCount} cells</h3>
              </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* I,J,K → X,Y,Z Mappings */}
            <div>
              <h3 className="text-lg font-semibold mb-2">I,J,K → X,Y,Z Coordinates</h3>
              <div className="bg-gray-50 rounded p-3 max-h-80 overflow-auto">
                <div className="text-xs font-mono">
                  <div className="grid grid-cols-6 gap-2 font-bold border-b pb-1 mb-1">
                    <span>I</span>
                    <span>J</span>
                    <span>K</span>
                    <span>X</span>
                    <span>Y</span>
                    <span>Z</span>
                  </div>
                  {debugData.engineCoords.map((engineCoord, index) => {
                    const worldCoord = debugData.worldCoords[index];
                    return (
                      <div key={index} className="grid grid-cols-6 gap-2 hover:bg-gray-100">
                        <span>{engineCoord[0]}</span>
                        <span>{engineCoord[1]}</span>
                        <span>{engineCoord[2]}</span>
                        <span>{worldCoord.x.toFixed(3)}</span>
                        <span>{worldCoord.y.toFixed(3)}</span>
                        <span>{worldCoord.z.toFixed(3)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hull Input Points */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Hull Input Points ({debugData.hullInputCoords.length})</h3>
              <div className="bg-gray-50 rounded p-3 max-h-80 overflow-auto">
                <div className="text-xs font-mono">
                  <div className="grid grid-cols-3 gap-2 font-bold border-b pb-1 mb-1">
                    <span>X</span>
                    <span>Y</span>
                    <span>Z</span>
                  </div>
                  {debugData.hullInputCoords.map((coord, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 hover:bg-gray-100">
                      <span>{coord.x.toFixed(3)}</span>
                      <span>{coord.y.toFixed(3)}</span>
                      <span>{coord.z.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hull Faces Output */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Hull Faces Output ({debugData.hullFaces.length})</h3>
            <div className="bg-gray-50 rounded p-3 max-h-60 overflow-auto">
              <div className="text-xs font-mono">
                <div className="grid grid-cols-8 gap-2 font-bold border-b pb-1 mb-1">
                  <span>#</span>
                  <span>Normal X</span>
                  <span>Normal Y</span>
                  <span>Normal Z</span>
                  <span>Area</span>
                  <span>Center X</span>
                  <span>Center Y</span>
                  <span>Center Z</span>
                </div>
                {debugData.hullFaces.map((face, index) => (
                  <div key={index} className="grid grid-cols-8 gap-2 hover:bg-gray-100">
                    <span>{index}</span>
                    <span>{face.normal.x.toFixed(3)}</span>
                    <span>{face.normal.y.toFixed(3)}</span>
                    <span>{face.normal.z.toFixed(3)}</span>
                    <span>{face.area.toFixed(3)}</span>
                    <span>{face.centroid.x.toFixed(3)}</span>
                    <span>{face.centroid.y.toFixed(3)}</span>
                    <span>{face.centroid.z.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
