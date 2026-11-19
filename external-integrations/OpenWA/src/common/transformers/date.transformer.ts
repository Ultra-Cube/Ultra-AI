// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { ValueTransformer } from 'typeorm';

/**
 * Cross-database date transformer.
 * - SQLite stores as ISO string TEXT, transformer converts to/from Date
 * - PostgreSQL stores as native timestamp, driver returns Date directly
 */
export const DateTransformer: ValueTransformer = {
  from: (value: string | Date | null): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date(value);
  },
  to: (value: Date | null): string | Date | null => {
    if (!value) return null;
    if (value instanceof Date) {
      return process.env.DATABASE_TYPE === 'postgres' ? value : value.toISOString();
    }
    return value;
  },
};
