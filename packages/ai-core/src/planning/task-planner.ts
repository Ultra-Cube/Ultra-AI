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
