import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      maxWidth: '400px', 
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '2rem', 
        color: '#333' 
      }}>
        Koos Puzzle
      </h1>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem' 
      }}>
        <Link 
          to="/workspace" 
          style={{
            display: 'block',
            padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, #007bff, #6f42c1)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid transparent'
          }}
        >
          🚀 Unified Workspace (V2)
        </Link>
        
        <div style={{ 
          margin: '1rem 0', 
          padding: '0.5rem', 
          fontSize: '0.875rem', 
          color: '#6c757d',
          borderTop: '1px solid #e9ecef',
          paddingTop: '1rem'
        }}>
          V1 Individual Pages:
        </div>
        
        <Link 
          to="/puzzle-shape" 
          style={{
            display: 'block',
            padding: '1rem 2rem',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          Puzzle Shape
        </Link>
        
        <Link 
          to="/auto-solve" 
          style={{
            display: 'block',
            padding: '1rem 2rem',
            backgroundColor: '#6f42c1',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          Auto Solve
        </Link>
        
        <Link 
          to="/manual-solve" 
          style={{
            display: 'block',
            padding: '1rem 2rem',
            backgroundColor: '#fd7e14',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          Manual Solve
        </Link>
        
        <Link 
          to="/view-solution" 
          style={{
            display: 'block',
            padding: '1rem 2rem',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          View Solution
        </Link>
      </div>
    </div>
  );
}
