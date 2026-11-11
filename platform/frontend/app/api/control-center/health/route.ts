import { NextResponse } from 'next/server';

// This would call the control-center package
// For now, return a placeholder response
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    running: false,
    message: 'Control center API ready for integration',
  });
}