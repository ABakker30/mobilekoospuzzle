import React, { useState, useEffect } from 'react';
import { FileType, UnifiedFile, FileBrowserOptions } from '../../types/fileSystem';
import { FileBrowserService } from '../../services/fileSystem/FileBrowserService';

interface UnifiedFileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: UnifiedFile) => void;
  options: FileBrowserOptions;
  title?: string;
}

export const UnifiedFileBrowser: React.FC<UnifiedFileBrowserProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  options,
  title = 'Browse Files'
}) => {
  const [files, setFiles] = useState<UnifiedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UnifiedFile | null>(null);

  const fileBrowserService = FileBrowserService.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, options.supportedTypes]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loadedFiles = await fileBrowserService.browseFiles(options);
      setFiles(loadedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: UnifiedFile) => {
    if (options.multiSelect) {
      // TODO: Implement multi-select logic
      setSelectedFile(file);
    } else {
      setSelectedFile(file);
    }
  };

  const handleSelectFile = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      onClose();
    }
  };

  const getFileTypeIcon = (type: FileType): string => {
    switch (type) {
      case FileType.CONTAINER:
        return '🧩';
      case FileType.SOLUTION:
        return '✅';
      case FileType.STATUS:
        return '💾';
      default:
        return '📄';
    }
  };

  const getFileTypeName = (type: FileType): string => {
    switch (type) {
      case FileType.CONTAINER:
        return 'Container';
      case FileType.SOLUTION:
        return 'Solution';
      case FileType.STATUS:
        return 'Status';
      default:
        return 'Unknown';
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e9ecef'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ×
          </button>
        </div>

        {/* File Type Filter */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          {options.supportedTypes.map(type => (
            <span
              key={type}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                borderRadius: '16px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {getFileTypeIcon(type)} {getFileTypeName(type)}
            </span>
          ))}
        </div>

        {/* File List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {loading && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              Loading files...
            </div>
          )}

          {error && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#dc3545'
            }}>
              Error: {error}
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              No files found
            </div>
          )}

          {!loading && !error && files.map((file, index) => (
            <div
              key={index}
              onClick={() => handleFileClick(file)}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: index < files.length - 1 ? '1px solid #f8f9fa' : 'none',
                cursor: 'pointer',
                backgroundColor: selectedFile === file ? '#e3f2fd' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedFile !== file) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedFile !== file) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>
                  {getFileTypeIcon(file.type)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '500',
                    marginBottom: '0.25rem'
                  }}>
                    {file.name}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6c757d'
                  }}>
                    {fileBrowserService.getFilePreview(file)}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6c757d',
                  textAlign: 'right'
                }}>
                  <div>{getFileTypeName(file.type)}</div>
                  <div>{Math.round(file.size / 1024)} KB</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSelectFile}
            disabled={!selectedFile}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: selectedFile ? '#007bff' : '#6c757d',
              color: 'white',
              cursor: selectedFile ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Select File
          </button>
        </div>
      </div>
    </div>
  );
};
