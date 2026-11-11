/**
 * Command Processor
 * Processes voice commands
 */

import { CommandConfig, RecognitionResult } from './types';

export class CommandProcessor {
  private config: CommandConfig;

  constructor(config: Partial<CommandConfig> = {}) {
    this.config = {
      commands: config.commands || {},
      enableFuzzyMatching: config.enableFuzzyMatching || false,
      caseSensitive: config.caseSensitive || false,
    };
  }

  processCommand(result: RecognitionResult): RecognitionResult {
    const text = this.config.caseSensitive
      ? result.text
      : result.text.toLowerCase();

    for (const [command, action] of Object.entries(this.config.commands)) {
      const commandText = this.config.caseSensitive
        ? command
        : command.toLowerCase();

      if (this.config.enableFuzzyMatching) {
        if (this.fuzzyMatch(text, commandText)) {
          return {
            ...result,
            isCommand: true,
            command: action,
          };
        }
      } else {
        if (text.includes(commandText)) {
          return {
            ...result,
            isCommand: true,
            command: action,
          };
        }
      }
    }

    return result;
  }

  private fuzzyMatch(text: string, pattern: string): boolean {
    // Simple fuzzy matching implementation
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();

    let textIndex = 0;
    let patternIndex = 0;

    while (textIndex < textLower.length && patternIndex < patternLower.length) {
      if (textLower[textIndex] === patternLower[patternIndex]) {
        patternIndex++;
      }
      textIndex++;
    }

    return patternIndex === patternLower.length;
  }

  addCommand(keyword: string, action: string): void {
    this.config.commands[keyword] = action;
  }

  removeCommand(keyword: string): void {
    delete this.config.commands[keyword];
  }

  getCommands(): Record<string, string> {
    return { ...this.config.commands };
  }
}
