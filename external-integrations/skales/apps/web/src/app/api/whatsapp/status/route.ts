// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { NextResponse } from 'next/server';
import { getWhatsAppStatus } from '@/actions/whatsapp';

// Never cache — real-time bot status
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const status = await getWhatsAppStatus();
        return NextResponse.json(status);
    } catch (e: any) {
        return NextResponse.json({ state: 'error', error: e.message }, { status: 500 });
    }
}
