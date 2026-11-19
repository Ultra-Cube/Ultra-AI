// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { NextResponse } from 'next/server';
import { startWhatsAppBot } from '@/actions/whatsapp';

// Never cache — triggers a real process spawn
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
    try {
        const result = await startWhatsAppBot();
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
