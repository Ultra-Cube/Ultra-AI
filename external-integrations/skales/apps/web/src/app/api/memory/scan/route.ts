// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const dynamic = 'force-dynamic';
// ============================================================
// GET /api/memory/scan — Trigger memory scanner
// ============================================================
// Called every 90 minutes from NotificationManager.
// Scans new conversations and extracts memories via regex NLP.
// Returns scan results as JSON.
// ============================================================

import { NextResponse } from 'next/server';
import { runMemoryScan } from '@/lib/memory-scanner';
import { invalidateMemoryCache } from '@/lib/memory-retrieval';

export async function GET() {
    try {
        const result = runMemoryScan();

        // If new memories were extracted, invalidate the retrieval cache
        // so the next response picks them up immediately.
        if (result.extracted > 0) {
            invalidateMemoryCache();
        }

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message, scanned: 0, extracted: 0, skipped: false }, { status: 500 });
    }
}
