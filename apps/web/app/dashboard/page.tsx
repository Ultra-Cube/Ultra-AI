'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: 0,
  });

  const [activeProviders, setActiveProviders] = useState([
    { id: 'openai', name: 'OpenAI', status: 'active', models: 5 },
    { id: 'anthropic', name: 'Anthropic', status: 'active', models: 3 },
    { id: 'google', name: 'Google AI', status: 'active', models: 4 },
  ]);

  const [aiSystems, setAiSystems] = useState([
    {
      id: '9router',
      name: '9router',
      description: 'AI Gateway with 40+ providers',
      status: 'running',
      port: 20128,
      uptime: '5h 23m',
    },
    {
      id: 'openclaw',
      name: 'OpenClaw',
      description: 'Multi-channel personal assistant',
      status: 'configured',
      port: null,
      uptime: null,
    },
    {
      id: 'jarvis',
      name: 'JARVIS',
      description: 'Agentic intelligence platform',
      status: 'configured',
      port: null,
      uptime: null,
    },
    {
      id: 'webui',
      name: 'WebUI Desktop',
      description: 'Desktop AI interface',
      status: 'configured',
      port: null,
      uptime: null,
    },
    {
      id: 'quant-mind',
      name: 'QuantMind',
      description: 'Financial AI knowledge extraction',
      status: 'imported',
      port: null,
      uptime: null,
    },
    {
      id: 'kimi-k2.5',
      name: 'Kimi K2.5',
      description: 'Multimodal agentic model (1T params)',
      status: 'imported',
      port: null,
      uptime: null,
    },
    {
      id: 'biome',
      name: 'Biome',
      description: 'World model interface',
      status: 'imported',
      port: null,
      uptime: null,
    },
    {
      id: 'godmode',
      name: 'GodMode Animation',
      description: 'Animation generation model',
      status: 'imported',
      port: null,
      uptime: null,
    },
  ]);

  const [controlCenter, setControlCenter] = useState({
    status: 'running',
    directories: 5,
    services: 3,
    alerts: 0,
  });

  useEffect(() => {
    // Fetch system stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/control-center/system-stats');
        const data = await response.json();
        setSystemStats(data);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'bg-green-500';
      case 'configured':
        return 'bg-blue-500';
      case 'imported':
        return 'bg-yellow-500';
      case 'stopped':
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ultra AI Platform
              </h1>
              <p className="text-sm text-gray-600">
                Comprehensive AI Systems Dashboard
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Start All Services
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                View Logs
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">CPU Usage</h3>
            <p className="text-3xl font-bold text-gray-900">{systemStats.cpu.toFixed(1)}%</p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${systemStats.cpu}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Memory Usage</h3>
            <p className="text-3xl font-bold text-gray-900">{systemStats.memory.toFixed(1)}%</p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${systemStats.memory}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Disk Usage</h3>
            <p className="text-3xl font-bold text-gray-900">{systemStats.disk.toFixed(1)}%</p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${systemStats.disk}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Uptime</h3>
            <p className="text-3xl font-bold text-gray-900">
              {Math.floor(systemStats.uptime / 3600)}h
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {Math.floor((systemStats.uptime % 3600) / 60)}m
            </p>
          </div>
        </div>

        {/* AI Systems Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            AI Systems & Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiSystems.map((system) => (
              <div
                key={system.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{system.name}</h3>
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-3">{system.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{system.status}</span>
                  {system.port && <span>Port: {system.port}</span>}
                  {system.uptime && <span>{system.uptime}</span>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors">
                    Configure
                  </button>
                  <button className="flex-1 px-3 py-1.5 bg-green-50 text-green-600 rounded text-sm hover:bg-green-100 transition-colors">
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Providers */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active AI Providers
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Models
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeProviders.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{provider.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {provider.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {provider.models}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Control Center Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Control Center
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-green-600">
                  {controlCenter.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Directories</span>
                <span className="font-medium">{controlCenter.directories}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Services</span>
                <span className="font-medium">{controlCenter.services}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alerts</span>
                <span className="font-medium text-red-600">
                  {controlCenter.alerts}
                </span>
              </div>
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Open Control Center
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-left">
                🚀 Start AI Gateway
              </button>
              <button className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-left">
                🤖 Configure OpenClaw
              </button>
              <button className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-left">
                🎯 Setup JARVIS
              </button>
              <button className="w-full px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-left">
                📊 View Analytics
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-gray-500">2m ago</span>
                <p className="text-gray-900">System health check passed</p>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">5m ago</span>
                <p className="text-gray-900">9router request processed</p>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">10m ago</span>
                <p className="text-gray-900">Memory optimization triggered</p>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">15m ago</span>
                <p className="text-gray-900">Control center updated</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}