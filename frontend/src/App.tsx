import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from "react";
import { useState, createContext, useContext } from 'react';
import { Toaster } from './components/ui/sonner.tsx';
import Login from './components/Login.tsx';
import Signup from './components/Signup.tsx';
import Home from './components/Home.tsx';
import Tracker from './components/Tracker.tsx';
import Update from './components/Update.tsx';
import Quests from './components/Quests.tsx';
import Playbook from './components/Playbook.tsx';
import CreditScore from './components/CreditScore.tsx';
import Navbar from './components/Navbar.tsx';

interface UserProfile {
  salary: number;
  savings: number[];
  expenditure: number[];
  savings_accounts?: any[];
  current_accounts?: any[];
  fds?: number;
  pf?: number;
  loans?: any[];
  assets?: any[];
  investments?: any[];
  job_details?: Record<string, any>;
}

interface User {
  id: number;
  email: string;
  name: string;
  profile: UserProfile;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // Save user info here if your backend returns it
        setUser({
          id: 1,
          email: data.email,
          name: data.email.split('@')[0],
          profile: data.profile || { salary: 0, savings: [], expenditure: [] },
        });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (err) {
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };


  const signup = async (userData: any) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (res.ok) {
        // Optionally, log in user immediately after signup
        setUser({
          id: Date.now(),
          email: userData.email,
          name: userData.email.split('@')[0],
          profile: {
            salary: userData.salary || 0,
            savings: [],
            expenditure: [],
            savings_accounts: userData.savings_accounts || [],
            current_accounts: userData.current_accounts || [],
            fds: userData.fds || 0,
            pf: userData.pf || 0,
            loans: userData.loans || [],
            assets: userData.assets || [],
            investments: userData.investments || [],
            job_details: userData.job_details || {},
          },
        });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (err) {
      return { success: false, error: 'Signup failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const authValue = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <div className="min-h-screen bg-background">
          {user && <Navbar />}
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/home" replace /> : <Login />
            } />
            <Route path="/signup" element={
              user ? <Navigate to="/tracker" replace /> : <Signup />
            } />
            <Route path="/home" element={
              <ProtectedRoute><Home /></ProtectedRoute>
            } />
            <Route path="/tracker" element={
              <ProtectedRoute><Tracker /></ProtectedRoute>
            } />
            <Route path="/update" element={
              <ProtectedRoute><Update /></ProtectedRoute>
            } />
            <Route path="/quests" element={
              <ProtectedRoute><Quests /></ProtectedRoute>
            } />
            <Route path="/playbook" element={
              <ProtectedRoute><Playbook /></ProtectedRoute>
            } />
            <Route path="/creditscore" element={
              <ProtectedRoute><CreditScore /></ProtectedRoute>
            } />
            <Route path="/" element={
              user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
            } />
            {/* Catch-all route for unmatched URLs */}
            <Route path="*" element={
              user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
            } />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}