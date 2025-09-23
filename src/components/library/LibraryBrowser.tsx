import React, { useState, useEffect } from 'react';
import { LibraryShape, libraryService } from '../../services/library/LibraryService';

interface LibraryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onShapeSelect: (coordinates: any[]) => void;
}

export const LibraryBrowser: React.FC<LibraryBrowserProps> = ({
  isOpen,
  onClose,
  onShapeSelect
}) => {
  const [shapes, setShapes] = useState<LibraryShape[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadShapes();
    }
  }, [isOpen]);

  const loadShapes = async () => {
    setLoading(true);
    setError(null);
    try {
      const libraryShapes = await libraryService.getShapes();
      setShapes(libraryShapes);
    } catch (err) {
      setError('Failed to load library shapes');
      console.error('Library loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShapeClick = async (shape: LibraryShape) => {
    if (!shape.downloadUrl) {
      alert('This shape is not available for download yet');
      return;
    }

    setDownloading(shape.filename);
    try {
      const container = await libraryService.downloadShape(shape);
      
      if (container.coordinates && Array.isArray(container.coordinates)) {
        const coordinates = container.coordinates.map((coord: any) => ({
          i: coord.i || 0,
          j: coord.j || 0,
          k: coord.k || 0,
          x: coord.x || 0,
          y: coord.y || 0,
          z: coord.z || 0
        }));
        
        onShapeSelect(coordinates);
        onClose();
      } else {
        alert('Invalid container format');
      }
    } catch (err) {
      alert('Failed to download shape');
      console.error('Download error:', err);
    } finally {
      setDownloading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90vw',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#212529' }}>📚 Shape Library</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
              Browse public container shapes from GitHub
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem'
        }}>
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              color: '#6c757d'
            }}>
              Loading shapes...
            </div>
          )}

          {error && (
            <div style={{
              padding: '1rem',
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              {error}
              <button
                onClick={loadShapes}
                style={{
                  marginLeft: '1rem',
                  padding: '0.25rem 0.5rem',
                  background: '#721c24',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {shapes.map((shape) => (
                <div
                  key={shape.filename}
                  onClick={() => handleShapeClick(shape)}
                  style={{
                    padding: '1rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: downloading === shape.filename ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    background: downloading === shape.filename ? '#f8f9fa' : 'white',
                    opacity: downloading === shape.filename ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (downloading !== shape.filename) {
                      e.currentTarget.style.borderColor = '#007bff';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,123,255,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (downloading !== shape.filename) {
                      e.currentTarget.style.borderColor = '#dee2e6';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🧩</span>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#212529' }}>
                      {shape.name}
                    </h4>
                  </div>
                  
                  <p style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    color: '#6c757d',
                    lineHeight: 1.4
                  }}>
                    {shape.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: '#6c757d'
                  }}>
                    <span>{(shape.size / 1024).toFixed(1)} KB</span>
                    {downloading === shape.filename && (
                      <span>Downloading...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && shapes.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6c757d'
            }}>
              No shapes found in the library
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            {shapes.length} shapes available
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
