import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import WorkoutSession from './pages/WorkoutSession';
import History from './pages/History';
import Exercises from './pages/Exercises';
import Progress from './pages/Progress';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { session, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-neutral-950 text-lime-400">Loading...</div>;
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                 <Home />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/session" element={
            <ProtectedRoute>
              <Layout>
                 <WorkoutSession />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <Layout>
                 <History />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/exercises" element={
            <ProtectedRoute>
              <Layout>
                 <Exercises />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute>
              <Layout>
                 <Progress />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                 <Profile />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
