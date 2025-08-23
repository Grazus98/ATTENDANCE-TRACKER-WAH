import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import Login from './Login';
import AttendanceTracker from './AttendanceTracker';
import AdminDashboard from './AdminDashboard';
import ITDashboard from './ITDashboard';
import { getUserProfile } from '../services/firestore';
import { Clock, LogOut, Shield, User as UserIcon } from 'lucide-react';

type ViewType = 'attendance' | 'admin' | 'it';

const AuthWrapper: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('attendance');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIT, setIsIT] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user?.email);
      setUser(user);
      
      // Check if user is admin/IT and set view accordingly
      if (user?.email === 'admin@nds.com') {
        setIsAdmin(true);
        setIsIT(false);
        setCurrentView('admin');
      } else if (user?.email === 'it@nds.com') {
        setIsAdmin(false);
        setIsIT(true);
        setCurrentView('it');
      } else {
        setIsAdmin(false);
        setIsIT(false);
        setCurrentView('attendance');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentView('attendance');
      setIsAdmin(false);
      setIsIT(false);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-blue-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* Animated Star Background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`
            }}
          />
        ))}
      </div>

      {/* Navigation Header */}
      <nav className="relative z-10 bg-white/95 backdrop-blur-sm shadow-lg border-b border-blue-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-blue-800" />
              <h1 className="text-xl font-bold text-blue-900">NDS ATTENDANCE TRACKER</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Name Display */}
              <div className="text-right">
                <p className="font-semibold text-blue-900">
                  {isAdmin ? 'Administrator' : isIT ? 'IT Administrator' : (user.displayName || user.email?.split('@')[0] || 'User')}
                </p>
              </div>
              
              <div className="flex items-center space-x-3 pl-4 border-l border-blue-200">
                <button
                  onClick={handleLogout}
                  className="p-2 text-blue-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-0">
        {isAdmin ? (
          <AdminDashboard user={user} />
        ) : isIT ? (
          <ITDashboard user={user} />
        ) : (
          <AttendanceTracker user={user} />
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/95 backdrop-blur-sm border-t border-blue-200 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-blue-700 text-sm">
            © 2025 NDS Attendance Tracker | Created by Noe
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthWrapper;