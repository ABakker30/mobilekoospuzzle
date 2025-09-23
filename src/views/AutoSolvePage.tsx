import React from 'react';
import { Link } from 'react-router-dom';

export default function AutoSolvePage() {
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
          color: '#6f42c1',
          fontWeight: 'bold'
        }}>
          Auto Solve
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666', 
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Automated puzzle solving engine coming soon! This feature will use advanced algorithms 
          to automatically find solutions for your puzzle shapes.
        </p>
        
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#e7e3ff',
          borderRadius: '12px',
          border: '2px solid #6f42c1',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            color: '#6f42c1', 
            marginBottom: '1rem',
            fontSize: '1.3rem'
          }}>
            🤖 Features in Development:
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#555',
            fontSize: '1.1rem',
            lineHeight: '1.8'
          }}>
            <li>High-performance solving algorithms</li>
            <li>Multiple solution discovery</li>
            <li>Solution optimization and ranking</li>
            <li>Progress tracking and visualization</li>
            <li>Export solutions in multiple formats</li>
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
          backgroundColor: '#6f42c1',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '25px',
          fontSize: '1rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(111, 66, 193, 0.3)',
          zIndex: 1000,
          transition: 'all 0.2s ease'
        }}
      >
        ← Home
      </Link>
    </div>
  );
}
