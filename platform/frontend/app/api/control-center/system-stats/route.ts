import { statfsSync } from 'fs';
import * as os from 'os';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cpus = os.cpus().length || 1;
  const load = os.loadavg()[0] ?? 0;
  const cpu = Math.min(100, Math.max(0, (load / cpus) * 100));

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memory = totalMem > 0 ? ((totalMem - freeMem) / totalMem) * 100 : 0;

  let disk = 0;
  try {
    const s = statfsSync('/');
    const total = s.blocks * s.bsize;
    const avail = s.bavail * s.bsize;
    disk = total > 0 ? ((total - avail) / total) * 100 : 0;
  } catch {
    disk = 0;
  }

  return NextResponse.json({
    cpu: Number(cpu.toFixed(1)),
    memory: Number(memory.toFixed(1)),
    disk: Number(disk.toFixed(1)),
    uptime: Math.floor(os.uptime()),
    cores: cpus,
    platform: `${os.type()} ${os.release()}`,
    loadavg: os.loadavg().map((n) => Number(n.toFixed(2))),
  });
}
