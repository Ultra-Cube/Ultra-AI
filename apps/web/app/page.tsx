'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold text-gray-900">
            🚀 Ultra AI Platform
          </div>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/docs"
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Documentation
            </Link>
          </div>
        </nav>

        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            The Ultimate AI Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Integrate 12 powerful AI systems, 40+ providers, and enterprise-grade tools
            into one unified platform. Built for developers, by developers.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/PROJECT-CATALOG.md"
              className="px-8 py-3 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium border border-gray-300"
            >
              View Catalog
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">12</div>
            <div className="text-gray-600">AI Systems</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">40+</div>
            <div className="text-gray-600">Providers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-600 mb-2">125</div>
            <div className="text-gray-600">Repositories</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
            <div className="text-gray-600">Open Source</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Gateway
              </h3>
              <p className="text-gray-600">
                Route requests across 40+ providers with auto-fallback, 40% token reduction,
                and enterprise-grade load balancing.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🦞</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Personal Assistant
              </h3>
              <p className="text-gray-600">
                Multi-channel AI assistant with skill system, local execution, and
                agent-to-agent communication.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Intelligence Platform
              </h3>
              <p className="text-gray-600">
                Real-time OSINT, autonomous web scraping, and knowledge graph construction
                for threat detection and analysis.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Multimodal AI
              </h3>
              <p className="text-gray-600">
                1T parameter model with native multimodal support for text, image, and video
                understanding.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Financial AI
              </h3>
              <p className="text-gray-600">
                Intelligent knowledge extraction for quantitative finance, market analysis,
                and risk assessment.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Animation Generation
              </h3>
              <p className="text-gray-600">
                Text-to-video and image-to-video generation with frame-by-frame control
                and style transfer.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Quick Start
          </h2>
          <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm overflow-x-auto">
            <pre>{`# Clone the repository
git clone https://github.com/your-org/Ultra-AI.git
cd Ultra-AI

# Install dependencies
npm install

# Start the platform
npm run dev

# Access the dashboard
# http://localhost:3000/dashboard`}</pre>
          </div>
        </div>

        {/* AI Systems Preview */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Integrated AI Systems
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '9router', icon: '🌐', desc: 'AI Gateway' },
              { name: 'OpenClaw', icon: '🦞', desc: 'Personal Assistant' },
              { name: 'JARVIS', icon: '🔍', desc: 'Intelligence' },
              { name: 'WebUI', icon: '🖥️', desc: 'Desktop UI' },
              { name: 'QuantMind', icon: '💰', desc: 'Financial AI' },
              { name: 'Kimi K2.5', icon: '🧠', desc: 'Multimodal' },
              { name: 'Biome', icon: '🌍', desc: 'World Models' },
              { name: 'GodMode', icon: '🎬', desc: 'Animation' },
              { name: 'OpenWA', icon: '📱', desc: 'WhatsApp' },
              { name: 'Skales', icon: '🤖', desc: 'Personal Agent' },
              { name: 'Colibri', icon: '⚡', desc: 'GLM Runtime' },
              { name: 'AionUi', icon: '👥', desc: 'Cowork App' },
            ].map((system) => (
              <div
                key={system.name}
                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-2">{system.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{system.name}</h3>
                <p className="text-sm text-gray-600">{system.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p className="mb-4">
            Built with ❤️ using Next.js, TypeScript, and the best open-source AI tools
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/PROJECT-CATALOG.md" className="hover:text-blue-600">
              Catalog
            </Link>
            <Link href="/docs" className="hover:text-blue-600">
              Documentation
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}