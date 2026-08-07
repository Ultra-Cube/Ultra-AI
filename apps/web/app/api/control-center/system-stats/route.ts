import { NextResponse } from 'next/server';

export async function GET() {
  // Placeholder response - would call actual control-center
  return NextResponse.json({
    cpu: 45,
    memory: 62,
    disk: 78,
    uptime: 3600,
  });
}