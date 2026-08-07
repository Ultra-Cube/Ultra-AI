'use client';

import { useState, useEffect } from 'react';

export default function ControlCenterPage() {
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/control-center/system-stats');
      const data = await response.json();
      setSystemStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Control Center
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            System Status
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading system stats...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-600 mb-2">CPU Usage</h3>
                <p className="text-2xl font-bold text-blue-900">{systemStats.cpu.toFixed(1)}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-600 mb-2">Memory Usage</h3>
                <p className="text-2xl font-bold text-green-900">{systemStats.memory.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-600 mb-2">Disk Usage</h3>
                <p className="text-2xl font-bold text-purple-900">{systemStats.disk.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Start Services
            </button>
            <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              View Logs
            </button>
            <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}