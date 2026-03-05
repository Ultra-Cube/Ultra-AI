import { Intent } from '../types';

const KEYWORDS: Record<Intent['name'], string[]> = {
  analysis: ['analyze', 'analysis', 'inspect', 'evaluate'],
  generation: ['create', 'generate', 'build', 'write'],
  summarization: ['summarize', 'summary', 'shorten'],
  translation: ['translate', 'translation', 'arabic', 'english'],
  general: [],
};

export class IntentRecognizer {
  recognize(input: string): Intent {
    const text = input.toLowerCase();

    for (const [intentName, words] of Object.entries(KEYWORDS)) {
      if (intentName === 'general') {
        continue;
      }

      const matchCount = words.filter((word) => text.includes(word)).length;
      if (matchCount > 0) {
        return {
          name: intentName as Intent['name'],
          confidence: Math.min(0.99, 0.55 + matchCount * 0.15),
        };
      }
    }

    return {
      name: 'general',
      confidence: 0.5,
    };
  }
}
