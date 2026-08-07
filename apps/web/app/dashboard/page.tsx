'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: 0,
  });

  const [selectedTab, setSelectedTab] = useState('overview');

  const [aiSystems, setAiSystems] = useState([
    {
      id: '9router',
      name: '9router',
      description: 'AI Gateway with 40+ providers',
      status: 'running',
      port: 20128,
      uptime: '5h 23m',
      icon: '🌐',
      type: 'gateway',
    },
    {
      id: 'openclaw',
      name: 'OpenClaw',
      description: 'Multi-channel personal assistant',
      status: 'configured',
      port: null,
      uptime: null,
      icon: '🦞',
      type: 'assistant',
    },
    {
      id: 'jarvis',
      name: 'JARVIS',
      description: 'Agentic intelligence platform',
      status: 'configured',
      port: null,
      uptime: null,
      icon: '🔍',
      type: 'intelligence',
    },
    {
      id: 'webui',
      name: 'WebUI Desktop',
      description: 'Desktop AI interface',
      status: 'configured',
      port: null,
      uptime: null,
      icon: '🖥️',
      type: 'desktop',
    },
    {
      id: 'quant-mind',
      name: 'QuantMind',
      description: 'Financial AI knowledge extraction',
      status: 'imported',
      port: null,
      uptime: null,
      icon: '💰',
      type: 'financial',
    },
    {
      id: 'kimi-k2.5',
      name: 'Kimi K2.5',
      description: 'Multimodal agentic model (1T params)',
      status: 'imported',
      port: null,
      uptime: null,
      icon: '🧠',
      type: 'multimodal',
    },
    {
      id: 'biome',
      name: 'Biome',
      description: 'World model interface',
      status: 'imported',
      port: null,
      uptime: null,
      icon: '🌍',
      type: 'world-model',
    },
    {
      id: 'godmode',
      name: 'GodMode Animation',
      description: 'Animation generation model',
      status: 'imported',
      port: null,
      uptime: null,
      icon: '🎬',
      type: 'animation',
    },
    {
      id: 'openwa',
      name: 'OpenWA',
      description: 'WhatsApp API Gateway',
      status: 'imported',
      port: null,
      uptime: null,
      icon: '📱',
      type: 'communication',
    },
    {
      id: 'skales',
      name: 'Skales',
      description: 'Personal AI desktop agent',
      status: 'imported',
      port: null,
      uptime: null,
      icon: '🤖',
      type: 'agent',
    },
    {
      id: 'colibri',
      name: 'Colibri',
      description: 'GLM-5.2 runtime (744B MoE)',
      status: 'imported',
      port: null,
      uptime: null,
      icon: '⚡',
      type: 'runtime',
    },
    {
      id: 'aionui',
      name: 'AionUi',
      description: 'Cowork app for 20+ CLI tools',
      status: 'imported',
      port: null,
      uptime: null,
      icon: '👥',
      type: 'collaboration',
    },
  ]);

  const [providers, setProviders] = useState([
    { id: 'openai', name: 'OpenAI', status: 'active', models: ['gpt-4', 'gpt-3.5-turbo'], requests: 1250, errors: 0, latency: 250 },
    { id: 'anthropic', name: 'Anthropic', status: 'active', models: ['claude-3-opus', 'claude-3-sonnet'], requests: 890, errors: 2, latency: 320 },
    { id: 'google', name: 'Google AI', status: 'active', models: ['gemini-pro', 'gemini-1.5-pro'], requests: 560, errors: 0, latency: 180 },
    { id: 'cohere', name: 'Cohere', status: 'inactive', models: ['command-r'], requests: 0, errors: 0, latency: 0 },
    { id: 'mistral', name: 'Mistral AI', status: 'active', models: ['mistral-large', 'mixtral'], requests: 420, errors: 1, latency: 290 },
  ]);

  const [models, setModels] = useState([
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', status: 'active', usage: 450 },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', status: 'active', usage: 320 },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google AI', status: 'active', usage: 280 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', status: 'active', usage: 800 },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', status: 'active', usage: 570 },
    { id: 'mixtral', name: 'Mixtral 8x7B', provider: 'Mistral AI', status: 'active', usage: 420 },
  ]);

  useEffect(() => {
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
      case 'imported':
        return 'bg-blue-500';
      case 'stopped':
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return 'text-green-600';
    if (latency < 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🚀 Ultra AI Platform
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {['overview', 'systems', 'providers', 'models', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {aiSystems.map((system) => (
                  <div
                    key={system.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{system.icon}</span>
                        <h3 className="font-semibold text-gray-900">{system.name}</h3>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{system.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="capitalize">{system.status}</span>
                      {system.port && <span>Port: {system.port}</span>}
                      {system.uptime && <span>{system.uptime}</span>}
                    </div>
                    <div className="flex gap-2">
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

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📊 System Health
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Running Systems</span>
                    <span className="font-medium text-green-600">1/12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Providers</span>
                    <span className="font-medium">4/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Models</span>
                    <span className="font-medium">6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alerts</span>
                    <span className="font-medium text-red-600">0</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ⚡ Quick Actions
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
                  📈 Recent Activity
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
          </>
        )}

        {/* Systems Tab */}
        {selectedTab === 'systems' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Port
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uptime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {aiSystems.map((system) => (
                  <tr key={system.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{system.icon}</span>
                        <span className="font-medium text-gray-900">{system.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{system.type}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {system.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{system.port || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-500">{system.uptime || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-900 text-sm mr-3">
                        Configure
                      </button>
                      <button className="text-green-600 hover:text-green-900 text-sm">
                        Start
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Providers Tab */}
        {selectedTab === 'providers' && (
          <div className="space-y-6">
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
                      Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Errors
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Latency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{provider.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          provider.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {provider.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{provider.models.join(', ')}</td>
                      <td className="px-6 py-4 text-gray-500">{provider.requests}</td>
                      <td className="px-6 py-4 text-gray-500">{provider.errors}</td>
                      <td className="px-6 py-4 text-gray-500">
                        <span className={getLatencyColor(provider.latency)}>
                          {provider.latency}ms
                        </span>
                      </td>
                      <td className="px-6 py-4">
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
        )}

        {/* Models Tab */}
        {selectedTab === 'models' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {models.map((model) => (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{model.name}</td>
                      <td className="px-6 py-4 text-gray-500">{model.provider}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {model.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{model.usage} requests</td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-900 text-sm">
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Analytics Dashboard
            </h2>
            <p className="text-gray-600 mb-4">
              Real-time analytics and performance metrics
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Total Requests (24h)</h3>
                <p className="text-3xl font-bold text-blue-600">3,420</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Success Rate</h3>
                <p className="text-3xl font-bold text-green-600">99.1%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Avg Response Time</h3>
                <p className="text-3xl font-bold text-purple-600">258ms</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Tokens Used</h3>
                <p className="text-3xl font-bold text-orange-600">1.2M</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}