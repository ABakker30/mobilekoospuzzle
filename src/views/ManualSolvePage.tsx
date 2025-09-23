import React from 'react';
import { Link } from 'react-router-dom';

export default function ManualSolvePage() {
  return (
    <div style={{ 
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative'
    }}>
      {/* Main content */}
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        padding: '2rem'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem', 
          color: '#fd7e14',
          fontWeight: 'bold'
        }}>
          Manual Solve
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666', 
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Interactive puzzle solving interface coming soon! This feature will provide 
          hands-on tools for manually building and testing puzzle solutions.
        </p>
        
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#fff3e0',
          borderRadius: '12px',
          border: '2px solid #fd7e14',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            color: '#fd7e14', 
            marginBottom: '1rem',
            fontSize: '1.3rem'
          }}>
            🧩 Features in Development:
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#555',
            fontSize: '1.1rem',
            lineHeight: '1.8'
          }}>
            <li>Interactive 3D puzzle building interface</li>
            <li>Drag-and-drop piece placement</li>
            <li>Real-time collision detection</li>
            <li>Undo/redo functionality</li>
            <li>Solution validation and testing</li>
            <li>Save and share custom solutions</li>
          </ul>
        </div>
      </div>

      {/* Back to Home - floating button */}
      <Link 
        to="/" 
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '12px 20px',
          backgroundColor: '#fd7e14',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '25px',
          fontSize: '1rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(253, 126, 20, 0.3)',
          zIndex: 1000,
          transition: 'all 0.2s ease'
        }}
      >
        ← Home
      </Link>
    </div>
  );
}
