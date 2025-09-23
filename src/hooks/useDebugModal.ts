import { useState, useEffect } from 'react';

export const useDebugModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+D to toggle debug modal
      if (event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Escape to close debug modal
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const openDebugModal = () => setIsOpen(true);
  const closeDebugModal = () => setIsOpen(false);
  const toggleDebugModal = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    openDebugModal,
    closeDebugModal,
    toggleDebugModal
  };
};
