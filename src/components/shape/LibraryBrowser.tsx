import React, { useState, useEffect } from 'react';
import { LibraryItem, fetchLibraryManifest, fetchLibraryContainer, getContainersFromManifest, searchContainers, sortContainers } from '../../services/library';

interface LibraryBrowserProps {
  onContainerSelect: (container: any, name: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function LibraryBrowser({ onContainerSelect, onClose, loading = false }: LibraryBrowserProps) {
  const [containers, setContainers] = useState<LibraryItem[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'updated'>('name');
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [containerLoading, setContainerLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // Load library manifest on mount
  useEffect(() => {
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
  }, []);

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
    if (size === null) return 'Unknown';
    return `${size} cells`;
  };

  const formatCID = (cid: string): string => {
    if (!cid) return 'No CID';
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
            Container Library
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

        {/* Search and Sort Controls */}
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

        {/* Container List */}
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
            filteredContainers.map((item) => (
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
                    {(() => {
                      // Debug logging for problematic items
                      if (!item.name || item.name === 'Unknown' || item.name.trim() === '') {
                        console.log('LibraryBrowser: Item with missing/unknown name:', { 
                          name: item.name, 
                          cid: item.cid, 
                          size: item.size,
                          url: item.url 
                        });
                      }
                      
                      // Display logic with better fallbacks
                      if (item.name && item.name !== 'Unknown' && item.name.trim() !== '') {
                        return item.name.replace('.fcc.json', '');
                      } else if (item.size && typeof item.size === 'number') {
                        return `${item.size} cells`;
                      } else if (item.cid && item.cid !== 'No CID' && item.cid.trim() !== '') {
                        return `Shape ${formatCID(item.cid)}`;
                      } else {
                        return 'Unnamed Shape';
                      }
                    })()}
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
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e9ecef',
          fontSize: '12px',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          {filteredContainers.length} container{filteredContainers.length !== 1 ? 's' : ''} available
        </div>
      </div>
    </div>
  );
}
