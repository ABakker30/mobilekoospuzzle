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
