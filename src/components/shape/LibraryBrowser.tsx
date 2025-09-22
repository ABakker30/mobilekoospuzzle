import React, { useState, useEffect } from 'react';
import { LibraryItem, fetchLibraryManifest, fetchLibraryContainer, getContainersFromManifest, searchContainers, sortContainers } from '../../services/library';
import { loadJSONFile } from '../../services/files';
import { validateContainerV1 } from '../../lib/guards/containerV1';

interface LibraryBrowserProps {
  onContainerSelect: (container: any, name: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function LibraryBrowser({ onContainerSelect, onClose, loading = false }: LibraryBrowserProps) {
  const [mode, setMode] = useState<'library' | 'local'>('library');
  const [containers, setContainers] = useState<LibraryItem[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'updated'>('name');
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [containerLoading, setContainerLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // Handle local file loading
  const handleLoadLocalFile = async () => {
    try {
      setError('');
      console.log('📂 LOCAL: Loading file from user device...');
      
      const fileData = await loadJSONFile();
      console.log('📂 LOCAL: File loaded, validating format...');
      
      const validation = validateContainerV1(fileData);
      if (!validation.valid) {
        setError(`Invalid file format: ${validation.error}`);
        return;
      }
      
      const container = validation.container!;
      const fileName = 'Local File'; // We don't have the actual filename from the file picker
      
      console.log('📂 LOCAL: File validated successfully');
      console.log(`📂 LOCAL: Container has ${container.cells?.length || 0} cells`);
      
      // Close browser and load the container
      onContainerSelect(container, fileName);
      onClose();
      
    } catch (err) {
      console.error('📂 LOCAL: Error loading local file:', err);
      setError(`Failed to load file: ${(err as Error).message}`);
    }
  };

  // Load library manifest on mount (only in library mode)
  useEffect(() => {
    if (mode !== 'library') return;
    
    console.log('LibraryBrowser: Component mounted, starting library load');
    
    const loadLibrary = async () => {
      try {
        console.log('LibraryBrowser: Setting loading state');
        setLibraryLoading(true);
        setError('');
        
        console.log('LibraryBrowser: Calling fetchLibraryManifest');
        const manifest = await fetchLibraryManifest();
        
        console.log('LibraryBrowser: Manifest received, processing containers');
        const containerItems = getContainersFromManifest(manifest);
        console.log('LibraryBrowser: Container items:', containerItems);
        console.log('LibraryBrowser: Sample container names:', containerItems.slice(0, 3).map(item => ({ name: item.name, cid: item.cid })));
        setContainers(containerItems);
        setFilteredContainers(sortContainers(containerItems, sortBy));
        
        console.log('LibraryBrowser: Library loaded successfully');
      } catch (err) {
        console.error('LibraryBrowser: Error loading library:', err);
        setError((err as Error).message);
      } finally {
        console.log('LibraryBrowser: Setting loading to false');
        setLibraryLoading(false);
      }
    };

    loadLibrary();
  }, [mode]);

  // Update filtered containers when search or sort changes
  useEffect(() => {
    let filtered = searchContainers(containers, searchQuery);
    filtered = sortContainers(filtered, sortBy);
    setFilteredContainers(filtered);
  }, [containers, searchQuery, sortBy]);

  const handleContainerLoad = async (item: LibraryItem) => {
    try {
      setContainerLoading(item.name);
      setError('');
      const container = await fetchLibraryContainer(item);
      onContainerSelect(container, item.name);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setContainerLoading(null);
    }
  };

  const formatSize = (size: number | null): string => {
    if (size === null || size === undefined) return 'Size not computed';
    return `${size} cells`;
  };

  const formatCID = (cid: string): string => {
    if (!cid || cid.trim() === '') return 'Computing...';
    return cid.substring(7, 15); // Show short CID
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            {mode === 'library' ? 'Shape Library' : 'Load Local File'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          gap: '6px'
        }}>
          <button
            onClick={() => setMode('library')}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: mode === 'library' ? '#007bff' : '#f8f9fa',
              color: mode === 'library' ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📚 Browse Library
          </button>
          <button
            onClick={() => setMode('local')}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: mode === 'local' ? '#007bff' : '#f8f9fa',
              color: mode === 'local' ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📂 Load Local File
          </button>
        </div>

        {/* Search and Sort Controls - Only show in library mode */}
        {mode === 'library' && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search containers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'updated')}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="updated">Sort by Date</option>
          </select>
        </div>
        )}

        {/* Content Area */}
        {mode === 'library' ? (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px'
        }}>
          {libraryLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: '#6c757d'
            }}>
              Loading library...
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: '#dc3545',
              textAlign: 'center',
              padding: '20px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                Library Unavailable
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {error}
              </div>
            </div>
          ) : filteredContainers.length === 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: '#6c757d'
            }}>
              {searchQuery ? 'No containers match your search' : 'No containers available'}
            </div>
          ) : (
            filteredContainers.map((item) => {
              const displayName = item.name ? item.name.replace('.fcc.json', '') : 'NO NAME';
              return (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '10px',
                  margin: '4px 0',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  backgroundColor: containerLoading === item.name ? '#f8f9fa' : 'white',
                  cursor: containerLoading === item.name ? 'not-allowed' : 'pointer',
                  opacity: containerLoading === item.name ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  minHeight: '60px'
                }}
                onClick={() => !containerLoading && handleContainerLoad(item)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    wordBreak: 'break-word',
                    lineHeight: '1.3'
                  }}>
                    {displayName}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#6c757d',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <span>{formatSize(item.size)}</span>
                    <span style={{ 
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}>
                      CID: {formatCID(item.cid)}
                    </span>
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#007bff',
                  fontWeight: '500',
                  marginLeft: '8px',
                  marginTop: '2px',
                  padding: '4px 8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #007bff',
                  minWidth: '50px',
                  textAlign: 'center'
                }}>
                  {containerLoading === item.name ? 'Loading...' : 'Load'}
                </div>
              </div>
              );
            })
          )}
        </div>
        ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            📂
          </div>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#495057'
          }}>
            Load Shape from Your Device
          </h3>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: '#6c757d',
            lineHeight: '1.5',
            maxWidth: '300px'
          }}>
            Select a .fcc.json file from your device to load a previously saved shape.
          </p>
          <button
            onClick={handleLoadLocalFile}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📁 Choose File
          </button>
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '6px',
              fontSize: '14px',
              maxWidth: '400px'
            }}>
              {error}
            </div>
          )}
        </div>
        )}

        {/* Footer - Only show in library mode */}
        {mode === 'library' && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e9ecef',
          fontSize: '12px',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          {filteredContainers.length} container{filteredContainers.length !== 1 ? 's' : ''} available
        </div>
        )}
      </div>
    </div>
  );
}
