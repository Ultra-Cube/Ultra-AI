/**
 * Directory Manager
 * Manages directory operations and monitoring
 */

import { EventEmitter } from 'events';
import { ControlCenterConfig, DirectoryConfig } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
// chokidar will be added when needed
// import { chokidar } from 'chokidar';

export class DirectoryManager extends EventEmitter {
  private config: ControlCenterConfig;
  private directories: Map<string, DirectoryConfig> = new Map();
  private watchers: Map<string, any> = new Map();

  constructor(config: ControlCenterConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Directory Manager...');
    // Load saved directory configurations
    await this.loadDirectories();
  }

  async addDirectory(config: DirectoryConfig): Promise<void> {
    const normalizedPath = path.normalize(config.path);
    
    // Check if directory exists
    try {
      await fs.access(normalizedPath);
    } catch {
      await fs.mkdir(normalizedPath, { recursive: true });
    }

    this.directories.set(normalizedPath, config);
    
    if (config.monitored) {
      await this.watchDirectory(normalizedPath);
    }

    this.emit('directory-added', config);
    await this.saveDirectories();
  }

  async removeDirectory(path: string): Promise<void> {
    const normalizedPath = path.normalize(path);
    
    // Stop watching if monitored
    if (this.watchers.has(normalizedPath)) {
      const watcher = this.watchers.get(normalizedPath);
      await watcher.close();
      this.watchers.delete(normalizedPath);
    }

    this.directories.delete(normalizedPath);
    this.emit('directory-removed', normalizedPath);
    await this.saveDirectories();
  }

  async watchDirectory(path: string): Promise<void> {
    if (this.watchers.has(path)) {
      return;
    }

    // Placeholder for chokidar integration
    // Would be: const watcher = chokidar.watch(path, { ... });
    // For now, use simple polling or manual triggers
    this.watchers.set(path, { watching: true });
    this.emit('directory-watched', path);
  }

  async getDirectories(): Promise<DirectoryConfig[]> {
    return Array.from(this.directories.values());
  }

  async getDirectory(path: string): Promise<DirectoryConfig | undefined> {
    return this.directories.get(path.normalize(path));
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up Directory Manager...');
    
    // Clear all watchers
    this.watchers.clear();
  }

  private async loadDirectories(): Promise<void> {
    try {
      const configPath = path.join(this.config.dataPath, 'directories.json');
      const data = await fs.readFile(configPath, 'utf-8');
      const directories = JSON.parse(data) as DirectoryConfig[];
      
      for (const dir of directories) {
        this.directories.set(dir.path, dir);
        if (dir.monitored) {
          await this.watchDirectory(dir.path);
        }
      }
    } catch (error) {
      console.log('No saved directories found');
    }
  }

  private async saveDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.dataPath, { recursive: true });
      const configPath = path.join(this.config.dataPath, 'directories.json');
      const data = JSON.stringify(Array.from(this.directories.values()), null, 2);
      await fs.writeFile(configPath, data, 'utf-8');
    } catch (error) {
      console.error('Failed to save directories:', error);
    }
  }
}