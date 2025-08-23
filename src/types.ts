export interface AttendanceRecord {
  id: string;
  name: string;
  department: string;
  clockIn: string;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
  date: string;
  totalHours: number | null;
  breakHours: number | null;
  lunchHours: number | null;
  status: 'clocked-in' | 'on-break' | 'on-lunch' | 'clocked-out';
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'employee' | 'it';
  department?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  department: string;
  createdAt: string;
  id?: string;
}

export interface IPSettings {
  id?: string;
  allowedPublicIPs: string[];
  allowedLocalIPs: string[];
  isEnabled: boolean;
  updatedAt: Date;
  updatedBy: string;
}