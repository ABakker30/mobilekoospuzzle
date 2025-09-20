// Placeholder only—no logic/data.
import React from 'react';
import { Link } from 'react-router-dom';

export default function ViewSolutionPage() {
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '1rem', 
        color: '#333' 
      }}>
        View Solution
      </h1>
      
      <p style={{ 
        fontSize: '1.1rem', 
        marginBottom: '2rem', 
        color: '#666' 
      }}>
        This page will host the solution viewer.
      </p>
      
      <Link 
        to="/" 
        style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          backgroundColor: '#6c757d',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}
