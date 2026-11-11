/**
 * Control Center Types
 */

export interface ControlCenterConfig {
  port: number;
  enableAuth: boolean;
  enableMonitoring: boolean;
  enableAutomation: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dataPath: string;
}

export interface DirectoryConfig {
  path: string;
  name: string;
  permissions: string[];
  monitored: boolean;
  autoBackup: boolean;
}

export interface FileConfig {
  path: string;
  name: string;
  size: number;
  type: string;
  permissions: string[];
  created: Date;
  modified: Date;
}

export interface SystemConfig {
  cpuThreshold: number;
  memoryThreshold: number;
  diskThreshold: number;
  alertEnabled: boolean;
  alertEmail?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  createdAt: Date;
  lastLogin?: Date;
}

export interface Service {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  cpu: number;
  memory: number;
  uptime: number;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  module: string;
  userId?: string;
}

export interface AutomationTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  script: string;
}

export interface BackupConfig {
  id: string;
  name: string;
  source: string;
  destination: string;
  schedule: string;
  enabled: boolean;
  retention: number;
}
