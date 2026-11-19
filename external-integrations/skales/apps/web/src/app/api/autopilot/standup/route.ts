// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * GET /api/autopilot/standup
 * Generates and returns the daily stand-up report.
 */
import { NextResponse }               from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { generateStandupReport }      from '@/actions/autopilot';

export const dynamic    = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    noStore();
    const result = await generateStandupReport();
    return NextResponse.json(result);
}
