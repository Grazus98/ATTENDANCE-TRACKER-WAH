import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { saveUserProfile } from '../services/firestore';
import { Clock, Mail, Shield, Users, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const departments = [
    'OHIO',
    'NYS', 
    'NYC',
    'ALG',
    'SPECIALS',
    'PRIVATE',
    'SCHEDULING',
    'GIS',
    'CM',
    'ADMIN'
  ];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    if (!fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (!department) {
      setError('Please select a department');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Creating user account for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User account created:', userCredential.user.uid);
      
      const userProfile = {
        uid: userCredential.user.uid,
        email: email,
        fullName: fullName.trim(),
        department: department,
        createdAt: new Date().toISOString()
      };
      
      console.log('Saving user profile:', userProfile);
      await saveUserProfile(userProfile);
      console.log('User profile saved successfully');
      
      setMessage('Registration successful! You can now sign in with your credentials.');
      setTimeout(() => {
        setIsSignUp(false);
        setMessage('');
        setFullName('');
        setDepartment('');
        setPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating account:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      console.log('Attempting to sign in:', email);
      if ((email === 'admin@nds.com' && password === 'admin062198') || (email === 'it@nds.com' && password === 'it062198')) {
        try {
          console.log('Admin/IT login attempt');
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log('Admin/IT login successful');
          
          const specialProfile = {
            uid: userCredential.user.uid,
            email: email,
            fullName: email === 'admin@nds.com' ? 'System Administrator' : 'IT Administrator',
            department: email === 'admin@nds.com' ? 'Admin' : 'IT',
            createdAt: new Date().toISOString()
          };
          
          await saveUserProfile(specialProfile);
        } catch (signInError: any) {
          if (signInError.code === 'auth/user-not-found') {
            console.log('Creating admin/IT account');
            const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            const specialProfile = {
              uid: newUserCredential.user.uid,
              email: email,
              fullName: email === 'admin@nds.com' ? 'System Administrator' : 'IT Administrator',
              department: email === 'admin@nds.com' ? 'Admin' : 'IT',
              createdAt: new Date().toISOString()
            };
            
            console.log('Saving admin/IT profile');
            await saveUserProfile(specialProfile);
            console.log('Admin/IT account created successfully');
          } else {
            throw signInError;
          }
        }
      } else {
        console.log('Regular user login attempt');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User login successful');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (email === 'admin@nds.com' || email === 'it@nds.com') {
        setError('Invalid admin/IT credentials. Please use the correct password.');
      } else {
        setError(error.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* Animated Star Background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <Clock className="h-12 w-12 text-blue-800" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            NDS ATTENDANCE TRACKER
          </h1>
        </div>

        {/* Login Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
            </div>

            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="Enter your email address"
                />
              </div>

              {isSignUp && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      <Users className="inline h-4 w-4 mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      <Users className="inline h-4 w-4 mr-1" />
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  <Shield className="inline h-4 w-4 mr-1" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setMessage('');
                  setEmail('');
                  setFullName('');
                  setDepartment('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-blue-700 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-white/80 text-sm">
            © 2025 NDS Attendance Tracker | Created by Noe x Kiko x Robert
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
