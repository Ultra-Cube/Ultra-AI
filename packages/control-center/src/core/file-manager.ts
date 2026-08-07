/**
 * File Manager
 * Manages file operations and permissions
 */

import { EventEmitter } from 'events';
import { ControlCenterConfig, FileConfig } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileManager extends EventEmitter {
  private config: ControlCenterConfig;

  constructor(config: ControlCenterConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing File Manager...');
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      this.emit('file-read', filePath);
      return data;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      this.emit('file-written', filePath);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.emit('file-deleted', filePath);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    try {
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination);
      this.emit('file-copied', { source, destination });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async moveFile(source: string, destination: string): Promise<void> {
    try {
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.rename(source, destination);
      this.emit('file-moved', { source, destination });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async getFileInfo(filePath: string): Promise<FileConfig> {
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        type: stats.isDirectory() ? 'directory' : 'file',
        permissions: [],
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async listDirectory(dirPath: string): Promise<FileConfig[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: FileConfig[] = [];
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const stats = await fs.stat(fullPath);
        files.push({
          path: fullPath,
          name: entry.name,
          size: stats.size,
          type: entry.isDirectory() ? 'directory' : 'file',
          permissions: [],
          created: stats.birthtime,
          modified: stats.mtime,
        });
      }
      
      return files;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up File Manager...');
  }
}