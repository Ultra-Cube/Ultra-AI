'use client';

import { useState, useEffect } from 'react';

interface Provider {
  id: string;
  name: string;
  type: 'oauth' | 'api-key' | 'compatible';
  endpoint: string;
  models: string[];
  status: 'active' | 'inactive' | 'error';
}

export default function GatewayProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [nineRouterStatus, setNineRouterStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/gateway/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNineRouterStatus = async () => {
    try {
      const response = await fetch('/api/gateway/health');
      if (response.ok) {
        const data = await response.json();
        setNineRouterStatus(data.status === 'ok' ? 'online' : 'offline');
      } else {
        setNineRouterStatus('offline');
      }
    } catch (error) {
      setNineRouterStatus('offline');
    }
  };

  useEffect(() => {
    checkNineRouterStatus();
    const interval = setInterval(checkNineRouterStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          AI Gateway Providers
        </h1>

        {/* 9Router Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              9Router Service Status
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  nineRouterStatus === 'online'
                    ? 'bg-green-100 text-green-800'
                    : nineRouterStatus === 'loading'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {nineRouterStatus === 'online' && '● Online'}
                {nineRouterStatus === 'loading' && '● Loading...'}
                {nineRouterStatus === 'offline' && '● Offline'}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            {nineRouterStatus === 'online'
              ? '9Router service is available and handling requests'
              : nineRouterStatus === 'loading'
              ? 'Checking 9Router service status...'
              : '9Router service is not available. Gateway will use internal routing.'}
          </p>
        </div>

        {/* Provider List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Configured Providers
            </h2>
            <button
              onClick={fetchProviders}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading providers...</div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No providers configured. Add providers through the API Gateway service.
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: <span className="font-medium">{provider.type}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">{provider.endpoint}</code>
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Models:</p>
                        <div className="flex flex-wrap gap-2">
                          {provider.models.map((model) => (
                            <span
                              key={model}
                              className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                            >
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          provider.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : provider.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {provider.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => console.log('Add provider dialog')}
            >
              Add New Provider
            </button>
            <button
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={() => console.log('Test all providers')}
            >
              Test All Providers
            </button>
            <button
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              onClick={() => console.log('View usage stats')}
            >
              View Usage Statistics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}