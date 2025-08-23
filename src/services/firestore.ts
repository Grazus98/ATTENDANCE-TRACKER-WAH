import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  writeBatch,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { AttendanceRecord, UserProfile, IPSettings } from '../types';

// Collections
const ATTENDANCE_COLLECTION = 'attendance';
const USERS_COLLECTION = 'users';
const IP_SETTINGS_COLLECTION = 'ipSettings';

// User Profile Functions
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    // Use setDoc with user UID as document ID to avoid duplicates
    await setDoc(doc(db, USERS_COLLECTION, profile.uid), profile);
    console.log('User profile saved successfully:', profile);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // Get user document directly by UID
    const userDoc = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      const userData = docSnap.data() as UserProfile;
      console.log('User profile found:', userData);
      return { ...userData, id: docSnap.id };
    }
    
    console.log('No user profile found for UID:', uid);
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// IP Settings Functions
export const saveIPSettings = async (settings: IPSettings): Promise<void> => {
  try {
    const docRef = doc(db, IP_SETTINGS_COLLECTION, 'current');
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date()
    });
    console.log('IP settings saved successfully');
  } catch (error) {
    console.error('Error saving IP settings:', error);
    throw error;
  }
};

export const getIPSettings = async (): Promise<IPSettings | null> => {
  try {
    const docRef = doc(db, IP_SETTINGS_COLLECTION, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as IPSettings;
    }
    
    // Return default settings if none exist
    return {
      allowedPublicIPs: [],
      allowedLocalIPs: [],
      isEnabled: false,
      updatedAt: new Date(),
      updatedBy: 'system'
    };
  } catch (error) {
    console.error('Error getting IP settings:', error);
    return null;
  }
};

// Attendance Functions
export const saveAttendanceRecord = async (record: AttendanceRecord): Promise<string> => {
  try {
    console.log('Saving attendance record:', record);
    // Destructure to exclude the id property to prevent empty id from being stored
    const { id, ...recordData } = record;
    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), {
      ...recordData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Attendance record saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving attendance record:', error);
    throw error;
  }
};

export const updateAttendanceRecord = async (recordId: string, updates: Partial<AttendanceRecord>): Promise<void> => {
  try {
    console.log('Updating attendance record:', recordId, updates);
    const recordRef = doc(db, ATTENDANCE_COLLECTION, recordId);
    await updateDoc(recordRef, {
      ...updates,
      updatedAt: new Date()
    });
    console.log('Attendance record updated successfully');
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};

export const getUserAttendanceRecords = async (userId: string): Promise<AttendanceRecord[]> => {
  try {
    console.log('Getting attendance records for user:', userId);
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const records = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AttendanceRecord[];
    
    console.log('Found attendance records:', records.length);
    return records;
  } catch (error) {
    console.error('Error getting user attendance records:', error);
    return [];
  }
};

export const getAllAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  try {
    console.log('Getting all attendance records');
    // For admin access, we need to ensure proper ordering
    const q = query(
      collection(db, ATTENDANCE_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const records = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AttendanceRecord[];
    
    console.log('Found total attendance records:', records.length);
    console.log('Sample records:', records.slice(0, 2));
    return records;
  } catch (error) {
    console.error('Error getting all attendance records:', error);
    console.error('Error details:', error);
    return [];
  }
};

export const getAttendanceRecordsByDate = async (date: string): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('date', '==', date),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AttendanceRecord[];
  } catch (error) {
    console.error('Error getting attendance records by date:', error);
    return [];
  }
};

export const getActiveAttendanceRecord = async (userId: string): Promise<AttendanceRecord | null> => {
  try {
    console.log('Checking for active attendance record:', userId);
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', ['clocked-in', 'on-break', 'on-lunch']),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Get the most recent active record (already ordered by createdAt desc)
      const doc = querySnapshot.docs[0];
      const activeRecord = { ...doc.data(), id: doc.id } as AttendanceRecord;
      console.log('Found active record:', activeRecord);
      return activeRecord;
    }
    
    console.log('No active record found');
    return null;
  } catch (error) {
    console.error('Error getting active attendance record:', error);
    return null;
  }
};

export const deleteAllAttendanceRecords = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, ATTENDANCE_COLLECTION));
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('All attendance records deleted');
  } catch (error) {
    console.error('Error deleting all attendance records:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToAttendanceRecords = (callback: (records: AttendanceRecord[]) => void) => {
  console.log('Setting up real-time listener for attendance records');
  const q = query(collection(db, ATTENDANCE_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const records = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AttendanceRecord[];
    console.log('Real-time update - attendance records:', records.length);
    callback(records);
  }, (error) => {
    console.error('Error in attendance records listener:', error);
  });
};

export const subscribeToUserAttendanceRecords = (userId: string, callback: (records: AttendanceRecord[]) => void) => {
  console.log('Setting up real-time listener for user attendance records:', userId);
  // Use simple query without orderBy to avoid composite index requirement
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const records = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AttendanceRecord[];
    
    // Sort in memory instead of using Firestore orderBy
    records.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
    
    console.log('Real-time update - user attendance records:', records.length);
    console.log('Records with IDs:', records.map(r => ({ id: r.id, name: r.name, clockOut: r.clockOut })));
    callback(records);
  }, (error) => {
    console.error('Error in user attendance records listener:', error);
    callback([]);
  });
};