import { NextResponse } from 'next/server';

export async function GET() {
  // Placeholder response - would call actual control-center
  return NextResponse.json({
    directories: [],
    message: 'Directory management ready for integration',
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  // Placeholder - would add directory to control-center
  return NextResponse.json({
    message: 'Directory add ready for integration',
    path: body.path,
  });
}