import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './V3HomePage.css';

// Icons (using simple Unicode for now - can be replaced with icon library later)
const ICONS = {
  shape: '🔷',
  solution: '🧩', 
  solver: '🤖',
  puzzle: '✋',
  studio: '🎬',
  user: '👤',
  settings: '⚙️'
};

interface PageCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  authRequired: 'none' | 'recommended' | 'required';
  status: string;
}

interface UserStats {
  shapesCreated: number;
  solutionsViewed: number;
  contentGenerated: number;
  accountSince: string;
}

export default function V3HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);

  // Mock authentication state - replace with real auth service
  useEffect(() => {
    // Check authentication status
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setIsAuthenticated(true);
      // Load user stats from localStorage or API
      loadUserStats();
      loadRecentActivity();
    }
  }, []);

  const loadUserStats = () => {
    // Mock stats - replace with real API calls
    setUserStats({
      shapesCreated: 12,
      solutionsViewed: 45,
      contentGenerated: 8,
      accountSince: '2024-01-15'
    });
  };

  const loadRecentActivity = () => {
    // Mock recent activity - replace with real data
    setRecentActivity([
      'Edited "Complex Shape #3"',
      'Viewed "Tetris Solution A"',
      'Created video "Assembly Animation"'
    ]);
  };

  const pageCards: PageCard[] = [
    {
      id: 'shapes',
      title: 'Shape Editor',
      description: 'Create and edit 3D puzzle shapes',
      icon: ICONS.shape,
      route: '/shapes',
      authRequired: 'none',
      status: isAuthenticated ? 'Recent: Complex Shape #3' : 'No login required'
    },
    {
      id: 'solutions', 
      title: 'Solution Viewer',
      description: 'Analyze and visualize puzzle solutions',
      icon: ICONS.solution,
      route: '/solutions',
      authRequired: 'none',
      status: isAuthenticated ? 'Recent: Tetris Solution A' : 'No login required'
    },
    {
      id: 'solver',
      title: 'Auto Solver',
      description: 'Generate solutions automatically',
      icon: ICONS.solver,
      route: '/solver',
      authRequired: 'required',
      status: isAuthenticated ? 'Last run: 2 hours ago' : 'Login required'
    },
    {
      id: 'puzzling',
      title: 'Manual Puzzle',
      description: 'Interactive puzzle solving experience',
      icon: ICONS.puzzle,
      route: '/puzzling',
      authRequired: 'recommended',
      status: isAuthenticated ? 'Best score: 1,250' : 'Login recommended'
    },
    {
      id: 'studio',
      title: 'Content Studio',
      description: 'Create videos and images from your puzzles',
      icon: ICONS.studio,
      route: '/studio',
      authRequired: 'required',
      status: isAuthenticated ? 'Content created: 8' : 'Login required'
    }
  ];

  const handleSignIn = () => {
    // Mock sign in - replace with real auth
    console.log('Sign in clicked');
    // For demo, just set authenticated
    setIsAuthenticated(true);
    localStorage.setItem('authToken', 'mock-token');
    loadUserStats();
    loadRecentActivity();
  };

  const handleSignUp = () => {
    // Mock sign up - replace with real auth
    console.log('Sign up clicked');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUserStats(null);
    setRecentActivity([]);
    localStorage.removeItem('authToken');
  };

  const getCardClassName = (card: PageCard) => {
    let className = 'page-card';
    if (card.authRequired === 'required' && !isAuthenticated) {
      className += ' page-card--disabled';
    }
    return className;
  };

  const isCardAccessible = (card: PageCard) => {
    return card.authRequired === 'none' || isAuthenticated;
  };

  return (
    <div className="v3-home">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">KoosPuzzle V3</h1>
          </div>
          
          <div className="user-section">
            {!isAuthenticated ? (
              <div className="auth-buttons">
                <button className="btn btn-outline" onClick={handleSignIn}>
                  Sign In
                </button>
                <button className="btn btn-primary" onClick={handleSignUp}>
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="user-menu">
                <div className="user-avatar">
                  <span>{ICONS.user}</span>
                </div>
                <div className="user-dropdown">
                  <button className="btn btn-text" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        {/* Hero Section (Unauthenticated) */}
        {!isAuthenticated && (
          <section className="hero-section">
            <div className="hero-content">
              <h2 className="hero-title">Create, Solve, and Share 3D Puzzles</h2>
              <p className="hero-description">
                Design custom puzzle shapes, analyze solutions with advanced visualization, 
                and create stunning content to share with the world.
              </p>
              <button className="btn btn-primary btn-large" onClick={handleSignUp}>
                Get Started
              </button>
            </div>
          </section>
        )}

        {/* User Dashboard (Authenticated) */}
        {isAuthenticated && userStats && (
          <section className="user-dashboard">
            <div className="dashboard-content">
              <h2 className="dashboard-title">Welcome back!</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{userStats.shapesCreated}</div>
                  <div className="stat-label">Shapes Created</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{userStats.solutionsViewed}</div>
                  <div className="stat-label">Solutions Viewed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{userStats.contentGenerated}</div>
                  <div className="stat-label">Content Generated</div>
                </div>
              </div>

              {recentActivity.length > 0 && (
                <div className="recent-activity">
                  <h3>Recent Activity</h3>
                  <ul className="activity-list">
                    {recentActivity.map((activity, index) => (
                      <li key={index} className="activity-item">
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Navigation Grid */}
        <section className="navigation-section">
          <div className="navigation-content">
            <h2 className="section-title">
              {isAuthenticated ? 'Choose Your Tool' : 'Explore Features'}
            </h2>
            
            <div className="page-cards-grid">
              {pageCards.map((card) => (
                <div key={card.id} className={getCardClassName(card)}>
                  {isCardAccessible(card) ? (
                    <Link to={card.route} className="card-link">
                      <div className="card-icon">{card.icon}</div>
                      <h3 className="card-title">{card.title}</h3>
                      <p className="card-description">{card.description}</p>
                      <div className="card-status">{card.status}</div>
                      <div className="card-action">
                        {card.id === 'shapes' && 'Create Shapes'}
                        {card.id === 'solutions' && 'View Solutions'}
                        {card.id === 'solver' && 'Solve Puzzles'}
                        {card.id === 'puzzling' && 'Play Puzzles'}
                        {card.id === 'studio' && 'Create Content'}
                      </div>
                    </Link>
                  ) : (
                    <div className="card-disabled">
                      <div className="card-icon">{card.icon}</div>
                      <h3 className="card-title">{card.title}</h3>
                      <p className="card-description">{card.description}</p>
                      <div className="card-status">{card.status}</div>
                      <div className="card-action card-action--disabled">
                        Sign in required
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#help">Help</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
          <div className="footer-info">
            <span className="version">V3.0.0</span>
            <span className="status">🟢 All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
