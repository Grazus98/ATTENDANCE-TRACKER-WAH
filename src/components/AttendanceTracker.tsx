import React, { useState, useEffect } from 'react';
import { Clock, User, LogIn, LogOut, Building2, Calendar, Timer, Coffee, UtensilsCrossed, RotateCcw } from 'lucide-react';
import { AttendanceRecord, UserProfile } from '../types';
import { getManilaTime, getManilaDate, calculateHours } from '../utils';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  getUserProfile, 
  saveAttendanceRecord, 
  updateAttendanceRecord, 
  getActiveAttendanceRecord,
  subscribeToUserAttendanceRecords
} from '../services/firestore';

interface AttendanceTrackerProps {
  user: FirebaseUser;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ user }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(getManilaTime());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getManilaTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let unsubscribeRecords: (() => void) | null = null;

    const loadUserData = async () => {
      try {
        console.log('Loading user data for:', user.uid);
        setProfileLoading(true);
        
        // Load user profile from Firestore
        const profile = await getUserProfile(user.uid);
        console.log('Loaded profile:', profile);
        
        if (profile) {
          setUserProfile(profile);
          
          // Check for active record first
          const initialActive = await getActiveAttendanceRecord(user.uid);
          console.log('Initial active record check:', initialActive);
          setActiveRecord(initialActive);

          // Set up real-time listener for user's attendance records
          unsubscribeRecords = subscribeToUserAttendanceRecords(user.uid, (userRecords) => {
            console.log('Real-time records update:', userRecords);
            setRecords(userRecords);
            
            // Update active record from real-time data - find any active record regardless of date
            const currentActive = userRecords.find(record => 
              record.status === 'clocked-in' || 
              record.status === 'on-break' || 
              record.status === 'on-lunch'
            );
            console.log('Real-time active record check:', currentActive);
            
            // Update active record directly to reflect status changes
            setActiveRecord(currentActive || null);
          });
        } else {
          console.log('No profile found for user, creating basic profile from auth data');
          // Create a basic profile if none exists
          const basicProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            fullName: user.displayName || user.email?.split('@')[0] || 'User',
            department: 'Not Set',
            createdAt: new Date().toISOString()
          };
          setUserProfile(basicProfile);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Even if there's an error, try to create a basic profile
        const basicProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          fullName: user.displayName || user.email?.split('@')[0] || 'User',
          department: 'Not Set',
          createdAt: new Date().toISOString()
        };
        setUserProfile(basicProfile);
      } finally {
        setProfileLoading(false);
        setLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }

    return () => {
      if (unsubscribeRecords) {
        unsubscribeRecords();
      }
    };
  }, [user]);

  const handleClockIn = async () => {
    if (!userProfile) {
      alert('User profile not found. Please contact administrator.');
      return;
    }

    setActionLoading(true);
    
    // Double-check if there's already an active record
    const existingActive = await getActiveAttendanceRecord(user.uid);
    if (existingActive) {
      console.log('Found existing active record, setting it as active');
      setActiveRecord(existingActive);
      setActionLoading(false);
      alert('You are already clocked in! Your session continues from your previous clock-in.');
      return;
    }
    
    try {
      console.log('Clocking in user:', userProfile.fullName);
      
      const newRecord: AttendanceRecord = {
        id: '', // Will be set by Firestore
        name: userProfile.fullName,
        department: userProfile.department,
        clockIn: getManilaTime(),
        clockOut: null,
        breakStart: null,
        breakEnd: null,
        lunchStart: null,
        lunchEnd: null,
        date: getManilaDate(), // This captures the date when clocking in, not current date
        totalHours: null,
        breakHours: null,
        lunchHours: null,
        status: 'clocked-in',
        userId: user.uid
      };

      console.log('Creating attendance record:', newRecord);
      const recordId = await saveAttendanceRecord(newRecord);
      console.log('Clock in successful, record ID:', recordId);
      
      // Set the active record immediately with the new ID
      setActiveRecord({
        ...newRecord,
        id: recordId
      });
      
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeRecord) return;

    // Validate that we have a valid document ID
    if (!activeRecord.id || activeRecord.id.trim() === '') {
      console.error('Cannot clock out: Invalid or missing document ID', activeRecord);
      alert('Unable to clock out. Please try clocking in again or contact support.');
      return;
    }

    setActionLoading(true);
    
    try {
      console.log('Clocking out user:', activeRecord.name);
      
      const clockOutTime = getManilaTime();
      const totalHours = calculateHours(activeRecord.clockIn, clockOutTime);
      
      // Calculate break and lunch hours
      let breakHours = 0;
      let lunchHours = 0;
      
      if (activeRecord.breakStart && activeRecord.breakEnd) {
        breakHours = calculateHours(activeRecord.breakStart, activeRecord.breakEnd);
      }
      
      if (activeRecord.lunchStart && activeRecord.lunchEnd) {
        lunchHours = calculateHours(activeRecord.lunchStart, activeRecord.lunchEnd);
      }
      
      await updateAttendanceRecord(activeRecord.id, {
        clockOut: clockOutTime,
        totalHours: totalHours,
        breakHours: breakHours,
        lunchHours: lunchHours,
        status: 'clocked-out'
      });

      console.log('Clock out successful');
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakStart = async () => {
    if (!activeRecord || activeRecord.status !== 'clocked-in') return;
    
    setActionLoading(true);
    try {
      await updateAttendanceRecord(activeRecord.id, {
        breakStart: getManilaTime(),
        status: 'on-break'
      });
    } catch (error) {
      console.error('Error starting break:', error);
      alert('Failed to start break. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    if (!activeRecord || activeRecord.status !== 'on-break') return;
    
    setActionLoading(true);
    try {
      await updateAttendanceRecord(activeRecord.id, {
        breakEnd: getManilaTime(),
        status: 'clocked-in'
      });
    } catch (error) {
      console.error('Error ending break:', error);
      alert('Failed to end break. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLunchStart = async () => {
    if (!activeRecord || activeRecord.status !== 'clocked-in') return;
    
    setActionLoading(true);
    try {
      await updateAttendanceRecord(activeRecord.id, {
        lunchStart: getManilaTime(),
        status: 'on-lunch'
      });
    } catch (error) {
      console.error('Error starting lunch:', error);
      alert('Failed to start lunch. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLunchEnd = async () => {
    if (!activeRecord || activeRecord.status !== 'on-lunch') return;
    
    setActionLoading(true);
    try {
      await updateAttendanceRecord(activeRecord.id, {
        lunchEnd: getManilaTime(),
        status: 'clocked-in'
      });
    } catch (error) {
      console.error('Error ending lunch:', error);
      alert('Failed to end lunch. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-blue-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Current Time Display */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 text-center border border-blue-200">
          <div className="flex items-center justify-center mb-4">
            <Timer className="h-8 w-8 text-blue-800 mr-3" />
            <h3 className="text-2xl font-semibold text-blue-900">Manila Time</h3>
          </div>
          <p className="text-5xl font-mono font-bold text-blue-800 mb-2">{currentTime}</p>
          <div className="flex items-center justify-center text-blue-700">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{getManilaDate()}</span>
          </div>
        </div>

        {/* Main Attendance Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-blue-200">
          <div className="max-w-2xl mx-auto">
            {/* Active Record Status */}
            {activeRecord && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 animate-pulse ${
                      activeRecord.status === 'clocked-in' ? 'bg-green-500' :
                      activeRecord.status === 'on-break' ? 'bg-yellow-500' :
                      activeRecord.status === 'on-lunch' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}></div>
                    <span className={`font-semibold ${
                      activeRecord.status === 'clocked-in' ? 'text-green-700' :
                      activeRecord.status === 'on-break' ? 'text-yellow-700' :
                      activeRecord.status === 'on-lunch' ? 'text-orange-700' : 'text-gray-700'
                    }`}>
                      {activeRecord.status === 'clocked-in' ? 'Currently Working' :
                       activeRecord.status === 'on-break' ? 'On Break' :
                       activeRecord.status === 'on-lunch' ? 'On Lunch' : 'Unknown Status'}
                    </span>
                  </div>
                  <p className="text-blue-900 font-semibold">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Started at: {activeRecord.clockIn}
                  </p>
                  {activeRecord.breakStart && activeRecord.status === 'on-break' && (
                    <p className="text-yellow-700 font-medium mt-1">
                      <Coffee className="inline h-4 w-4 mr-1" />
                      Break started at: {activeRecord.breakStart}
                    </p>
                  )}
                  {activeRecord.lunchStart && activeRecord.status === 'on-lunch' && (
                    <p className="text-orange-700 font-medium mt-1">
                      <UtensilsCrossed className="inline h-4 w-4 mr-1" />
                      Lunch started at: {activeRecord.lunchStart}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Clock In Button */}
              <button
                onClick={handleClockIn}
                disabled={profileLoading || actionLoading || !!activeRecord}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                <LogIn className="h-5 w-5 mr-2" />
                <div className="text-center">
                  <div className="text-lg font-bold">CLOCK IN</div>
                  <div className="text-sm opacity-90">Start your shift</div>
                </div>
              </button>

              {/* Clock Out Button */}
              <button
                onClick={handleClockOut}
                disabled={actionLoading || !activeRecord}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <div className="text-center">
                  <div className="text-lg font-bold">CLOCK OUT</div>
                  <div className="text-sm opacity-90">End your shift</div>
                </div>
              </button>

              {/* Break Button */}
              <button
                onClick={activeRecord?.status === 'on-break' ? handleBreakEnd : handleBreakStart}
                disabled={actionLoading || !activeRecord || (activeRecord.status !== 'clocked-in' && activeRecord.status !== 'on-break')}
                className={`${
                  activeRecord?.status === 'on-break' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-yellow-600 hover:bg-yellow-700'
                } disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl`}
              >
                {activeRecord?.status === 'on-break' ? (
                  <RotateCcw className="h-5 w-5 mr-2" />
                ) : (
                  <Coffee className="h-5 w-5 mr-2" />
                )}
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {activeRecord?.status === 'on-break' ? 'END BREAK' : 'START BREAK'}
                  </div>
                  <div className="text-sm opacity-90">
                    {activeRecord?.status === 'on-break' ? 'Return to work' : 'Take a break'}
                  </div>
                </div>
              </button>

              {/* Lunch Button */}
              <button
                onClick={activeRecord?.status === 'on-lunch' ? handleLunchEnd : handleLunchStart}
                disabled={actionLoading || !activeRecord || (activeRecord.status !== 'clocked-in' && activeRecord.status !== 'on-lunch')}
                className={`${
                  activeRecord?.status === 'on-lunch' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl`}
              >
                {activeRecord?.status === 'on-lunch' ? (
                  <RotateCcw className="h-5 w-5 mr-2" />
                ) : (
                  <UtensilsCrossed className="h-5 w-5 mr-2" />
                )}
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {activeRecord?.status === 'on-lunch' ? 'END LUNCH' : 'START LUNCH'}
                  </div>
                  <div className="text-sm opacity-90">
                    {activeRecord?.status === 'on-lunch' ? 'Return to work' : 'Take lunch'}
                  </div>
                </div>
              </button>
            </div>

            {/* Status Messages */}
            <div className="mt-6 text-center">
              {profileLoading && (
                <p className="text-blue-600">Loading your profile...</p>
              )}
              {actionLoading && (
                <p className="text-blue-600">Processing...</p>
              )}
              {!activeRecord && !profileLoading && !actionLoading && (
                <p className="text-gray-600">Ready to clock in for your shift</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttendanceTracker;