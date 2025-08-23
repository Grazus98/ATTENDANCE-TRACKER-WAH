import React, { useState, useEffect } from 'react';
import { Users, Download, Calendar, Clock, Trash2, Filter, FileText, TrendingUp, LogOut } from 'lucide-react';
import { AttendanceRecord } from '../types';
import { exportToCSV, getManilaTime, calculateHours } from '../utils';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  getAllAttendanceRecords, 
  deleteAllAttendanceRecords,
  subscribeToAttendanceRecords,
  updateAttendanceRecord
} from '../services/firestore';

interface AdminDashboardProps {
  user: FirebaseUser;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [forceClockOutLoading, setForceClockOutLoading] = useState<string | null>(null);

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
  useEffect(() => {
    console.log('Admin Dashboard: Setting up real-time listener');
    console.log('Current user:', user.email);
    
    // Load all attendance records from Firestore with real-time updates
    const unsubscribe = subscribeToAttendanceRecords((allRecords) => {
      console.log('Admin Dashboard: Received records update:', allRecords.length);
      console.log('Sample records:', allRecords.slice(0, 2));
      setRecords(allRecords);
      setFilteredRecords(allRecords);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = records;

    if (filterDate) {
      // Convert filterDate to MM/DD/YYYY format to match record.date format
      const filterDateFormatted = new Date(filterDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      filtered = filtered.filter(record => record.date === filterDateFormatted);
    }

    if (filterName) {
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(filterName.toLowerCase())
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(record => record.department === filterDepartment);
    }
    setFilteredRecords(filtered);
  }, [records, filterDate, filterName, filterDepartment]);

  const handleExportCSV = () => {
    const exportData = filteredRecords.map(record => ({
      Name: record.name,
      Department: record.department,
      Date: record.date,
      'Clock In': record.clockIn,
      'Clock Out': record.clockOut || 'Still Active',
      'Total Hours': record.totalHours || 'N/A'
    }));

    const filename = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, filename);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all attendance data? This action cannot be undone.')) {
      try {
        await deleteAllAttendanceRecords();
        setRecords([]);
        setFilteredRecords([]);
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  const getTotalHours = () => {
    return filteredRecords
      .filter(record => record.totalHours !== null)
      .reduce((total, record) => total + (record.totalHours || 0), 0)
      .toFixed(2);
  };

  const getActiveEmployees = () => {
    // Count unique employees who are currently clocked in (no clock out time)
    const activeEmployeeIds = new Set();
    records.filter(record => record.clockOut === null).forEach(record => {
      if (record.userId) {
        activeEmployeeIds.add(record.userId);
      }
    });
    return activeEmployeeIds.size;
  };

  const getUniqueEmployees = () => {
    const uniqueNames = new Set(filteredRecords.map(record => record.name));
    return uniqueNames.size;
  };

  const handleForceClockOut = async (record: AttendanceRecord) => {
    if (!record.id || record.clockOut) return;
    
    const confirmMessage = `Are you sure you want to force clock out ${record.name}?\n\nThis will end their current shift at ${getManilaTime()}.`;
    
    if (!window.confirm(confirmMessage)) return;

    setForceClockOutLoading(record.id);
    
    try {
      const clockOutTime = getManilaTime();
      const totalHours = calculateHours(record.clockIn, clockOutTime);
      
      await updateAttendanceRecord(record.id, {
        clockOut: clockOutTime,
        totalHours: totalHours
      });
      
      console.log(`Force clock out successful for ${record.name}`);
    } catch (error) {
      console.error('Error force clocking out:', error);
      alert(`Failed to clock out ${record.name}. Please try again.`);
    } finally {
      setForceClockOutLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white p-3 rounded-xl shadow-lg mr-4">
              <TrendingUp className="h-8 w-8 text-blue-800" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">
                Comprehensive attendance management and analytics
                <span className="block text-sm mt-1 text-white font-medium">
                  Logged in as: {user.email}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{getUniqueEmployees()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Active Now</p>
                <p className="text-3xl font-bold text-green-600">{getActiveEmployees()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-gray-900">{filteredRecords.length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Hours</p>
                <p className="text-3xl font-bold text-purple-600">{getTotalHours()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-blue-200">
          <div className="flex items-center mb-6">
            <Filter className="h-6 w-6 text-blue-800 mr-3" />
            <h3 className="text-xl font-semibold text-gray-800">Filters & Actions</h3>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="inline h-4 w-4 mr-1" />
                  Filter by Name
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Enter employee name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="inline h-4 w-4 mr-1" />
                  Filter by Department
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportCSV}
                disabled={filteredRecords.length === 0}
                className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>

              <button
                onClick={handleClearData}
                disabled={records.length === 0}
                className="flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-blue-200">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-800 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-800">Attendance Records</h2>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-xl mb-2">No attendance records found</p>
              <p className="text-gray-400">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Clock Out
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Break Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Lunch Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{record.name}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {record.department}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-600">
                        {record.date}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                        {record.clockIn.split(', ')[1]}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                        {record.clockOut ? record.clockOut.split(', ')[1] : '-'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                        {record.breakHours ? `${record.breakHours}h` : '-'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                        {record.lunchHours ? `${record.lunchHours}h` : '-'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-700">
                        {record.totalHours ? `${record.totalHours}h` : '-'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {record.status === 'clocked-out' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : record.status === 'on-break' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                            On Break
                          </span>
                        ) : record.status === 'on-lunch' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                            On Lunch
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                              Working
                            </span>
                            <button
                              onClick={() => handleForceClockOut(record)}
                              disabled={forceClockOutLoading === record.id}
                              className="inline-flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-all duration-200"
                              title={`Force clock out ${record.name}`}
                            >
                              {forceClockOutLoading === record.id ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <LogOut className="h-3 w-3 mr-1" />
                                  Clock Out
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
