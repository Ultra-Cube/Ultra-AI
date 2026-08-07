import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:20129';

export async function GET() {
  try {
    const response = await fetch(`${GATEWAY_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gateway responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to check gateway health:', error);
    return NextResponse.json(
      { status: 'error', usingNineRouter: false },
      { status: 500 }
    );
  }
}