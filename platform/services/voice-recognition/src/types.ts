/**
 * Voice Recognition Types
 */

export interface VoiceConfig {
  language: string;
  model: string;
  enableContinuous: boolean;
  enableCommands: boolean;
  confidenceThreshold: number;
}

export interface CommandConfig {
  commands: Record<string, string>;
  enableFuzzyMatching: boolean;
  caseSensitive: boolean;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  enableNoiseCancellation: boolean;
}

export interface RecognitionResult {
  text: string;
  confidence: number;
  isCommand: boolean;
  command?: string;
}
