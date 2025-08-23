import React, { useState, useEffect } from 'react';
import { Settings, Shield, Globe, Wifi, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { IPSettings } from '../types';
import { saveIPSettings, getIPSettings } from '../services/firestore';

interface ITDashboardProps {
  user: FirebaseUser;
}

const ITDashboard: React.FC<ITDashboardProps> = ({ user }) => {
  const [ipSettings, setIPSettings] = useState<IPSettings>({
    allowedPublicIPs: [],
    allowedLocalIPs: [],
    isEnabled: false,
    updatedAt: new Date(),
    updatedBy: user.email || 'unknown'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPublicIP, setNewPublicIP] = useState('');
  const [newLocalIP, setNewLocalIP] = useState('');
  const [currentUserIP, setCurrentUserIP] = useState<string>('');

  useEffect(() => {
    loadIPSettings();
    getCurrentIP();
  }, []);

  const getCurrentIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setCurrentUserIP(data.ip);
    } catch (error) {
      console.error('Error getting current IP:', error);
    }
  };

  const loadIPSettings = async () => {
    try {
      setLoading(true);
      const settings = await getIPSettings();
      if (settings) {
        setIPSettings(settings);
      }
    } catch (error) {
      console.error('Error loading IP settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const updatedSettings = {
        ...ipSettings,
        updatedBy: user.email || 'unknown'
      };
      await saveIPSettings(updatedSettings);
      alert('IP settings saved successfully!');
    } catch (error) {
      console.error('Error saving IP settings:', error);
      alert('Failed to save IP settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addPublicIP = () => {
    if (newPublicIP.trim() && !ipSettings.allowedPublicIPs.includes(newPublicIP.trim())) {
      setIPSettings(prev => ({
        ...prev,
        allowedPublicIPs: [...prev.allowedPublicIPs, newPublicIP.trim()]
      }));
      setNewPublicIP('');
    }
  };

  const removePublicIP = (ip: string) => {
    setIPSettings(prev => ({
      ...prev,
      allowedPublicIPs: prev.allowedPublicIPs.filter(item => item !== ip)
    }));
  };

  const addLocalIP = () => {
    if (newLocalIP.trim() && !ipSettings.allowedLocalIPs.includes(newLocalIP.trim())) {
      setIPSettings(prev => ({
        ...prev,
        allowedLocalIPs: [...prev.allowedLocalIPs, newLocalIP.trim()]
      }));
      setNewLocalIP('');
    }
  };

  const removeLocalIP = (ip: string) => {
    setIPSettings(prev => ({
      ...prev,
      allowedLocalIPs: prev.allowedLocalIPs.filter(item => item !== ip)
    }));
  };

  const addCurrentIP = () => {
    if (currentUserIP && !ipSettings.allowedPublicIPs.includes(currentUserIP)) {
      setIPSettings(prev => ({
        ...prev,
        allowedPublicIPs: [...prev.allowedPublicIPs, currentUserIP]
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-white text-lg">Loading IT Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white p-3 rounded-xl shadow-lg mr-4">
              <Shield className="h-8 w-8 text-blue-800" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">IT Dashboard</h1>
              <p className="text-blue-100 mt-1">
                Network Security & IP Access Management
                <span className="block text-sm mt-1 text-white font-medium">
                  Logged in as: {user.email}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Current IP Info */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-6 w-6 text-blue-800 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Your Current IP Address</h3>
                <p className="text-2xl font-mono font-bold text-blue-600">{currentUserIP || 'Loading...'}</p>
              </div>
            </div>
            {currentUserIP && !ipSettings.allowedPublicIPs.includes(currentUserIP) && (
              <button
                onClick={addCurrentIP}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Current IP
              </button>
            )}
          </div>
        </div>

        {/* IP Restriction Toggle */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-800 mr-3" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">IP Restriction System</h3>
                <p className="text-gray-600">Enable or disable network access restrictions</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ipSettings.isEnabled}
                onChange={(e) => setIPSettings(prev => ({ ...prev, isEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {!ipSettings.isEnabled && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-sm">
                  IP restrictions are currently disabled. All users can access the system from any location.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Public IP Management */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-blue-200">
          <div className="flex items-center mb-6">
            <Globe className="h-6 w-6 text-blue-800 mr-3" />
            <h3 className="text-xl font-semibold text-gray-800">Allowed Public IP Addresses</h3>
          </div>

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={newPublicIP}
              onChange={(e) => setNewPublicIP(e.target.value)}
              placeholder="Enter public IP address (e.g., 192.168.1.1)"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && addPublicIP()}
            />
            <button
              onClick={addPublicIP}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add IP
            </button>
          </div>

          <div className="space-y-2">
            {ipSettings.allowedPublicIPs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No public IP addresses configured</p>
            ) : (
              ipSettings.allowedPublicIPs.map((ip, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-mono text-gray-800">{ip}</span>
                  <button
                    onClick={() => removePublicIP(ip)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Local IP Management */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-blue-200">
          <div className="flex items-center mb-6">
            <Wifi className="h-6 w-6 text-blue-800 mr-3" />
            <h3 className="text-xl font-semibold text-gray-800">Allowed Local IP Ranges</h3>
          </div>

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={newLocalIP}
              onChange={(e) => setNewLocalIP(e.target.value)}
              placeholder="Enter local IP range (e.g., 192.168.0.0/24 or 10.0.0.1-10.0.0.100)"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && addLocalIP()}
            />
            <button
              onClick={addLocalIP}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Range
            </button>
          </div>

          <div className="space-y-2">
            {ipSettings.allowedLocalIPs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No local IP ranges configured</p>
            ) : (
              ipSettings.allowedLocalIPs.map((ip, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-mono text-gray-800">{ip}</span>
                  <button
                    onClick={() => removeLocalIP(ip)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
            ) : (
              <Save className="h-5 w-5 mr-3" />
            )}
            {saving ? 'Saving...' : 'Save IP Settings'}
          </button>
        </div>

        {/* Last Updated Info */}
        {ipSettings.updatedAt && (
          <div className="text-center mt-6">
            <p className="text-white/80 text-sm">
              Last updated: {new Date(ipSettings.updatedAt).toLocaleString()} by {ipSettings.updatedBy}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ITDashboard;