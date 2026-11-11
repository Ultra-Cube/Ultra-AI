/**
 * Audio Processor
 * Handles audio input and processing
 */

import { EventEmitter } from 'events';

import { AudioConfig } from './types';

export class AudioProcessor extends EventEmitter {
  private config: AudioConfig;
  private recording: boolean = false;

  constructor(config: Partial<AudioConfig> = {}) {
    super();
    this.config = {
      sampleRate: config.sampleRate || 16000,
      channels: config.channels || 1,
      bitDepth: config.bitDepth || 16,
      enableNoiseCancellation: config.enableNoiseCancellation || false,
    };
  }

  async startRecording(): Promise<void> {
    if (this.recording) {
      return;
    }

    this.recording = true;
    this.emit('recording-started');
  }

  stopRecording(): void {
    if (!this.recording) {
      return;
    }

    this.recording = false;
    this.emit('recording-stopped');
  }

  isRecording(): boolean {
    return this.recording;
  }

  updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config-updated', this.config);
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }
}
