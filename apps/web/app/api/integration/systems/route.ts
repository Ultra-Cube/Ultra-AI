import { NextResponse } from 'next/server';

// Mock integration service - would connect to actual service
const mockSystems = [
  {
    id: '9router',
    name: '9router',
    type: 'gateway',
    port: 20128,
    status: 'running',
    dependencies: [],
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    type: 'assistant',
    status: 'configured',
    dependencies: ['9router'],
  },
  {
    id: 'jarvis',
    name: 'JARVIS',
    type: 'intelligence',
    status: 'configured',
    dependencies: ['9router'],
  },
  {
    id: 'webui',
    name: 'WebUI Desktop',
    type: 'desktop',
    status: 'configured',
    dependencies: ['9router'],
  },
  {
    id: 'quant-mind',
    name: 'QuantMind',
    type: 'financial',
    status: 'imported',
    dependencies: ['9router'],
  },
  {
    id: 'kimi-k2.5',
    name: 'Kimi K2.5',
    type: 'multimodal',
    status: 'imported',
    dependencies: ['9router'],
  },
  {
    id: 'biome',
    name: 'Biome',
    type: 'world-model',
    status: 'imported',
    dependencies: ['9router'],
  },
  {
    id: 'godmode',
    name: 'GodMode Animation',
    type: 'animation',
    status: 'imported',
    dependencies: ['9router'],
  },
];

export async function GET() {
  return NextResponse.json({
    systems: mockSystems,
    health: {
      total: mockSystems.length,
      running: mockSystems.filter((s) => s.status === 'running').length,
      configured: mockSystems.filter((s) => s.status === 'configured').length,
      imported: mockSystems.filter((s) => s.status === 'imported').length,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, systemId } = body;

  // Placeholder - would call actual integration service
  return NextResponse.json({
    message: `${action} ${systemId} ready for integration`,
    action,
    systemId,
  });
}