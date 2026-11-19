// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Intent, Task } from '../types';

const INTENT_TO_TASK: Record<Intent['name'], Task['type']> = {
  analysis: 'analyze',
  generation: 'generate',
  summarization: 'summarize',
  translation: 'translate',
  general: 'respond',
};

export class TaskPlanner {
  plan(input: string, intent: Intent): Task {
    return {
      type: INTENT_TO_TASK[intent.name],
      payload: input,
      intent,
    };
  }
}
