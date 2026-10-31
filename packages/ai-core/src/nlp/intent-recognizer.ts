import { Intent } from '../types';

const KEYWORDS: Record<Intent['name'], string[]> = {
  analysis: ['analyze', 'analysis', 'inspect', 'evaluate', 'حلل', 'تحليل'],
  generation: ['create', 'generate', 'build', 'write', 'اكتب', 'أنشئ'],
  summarization: ['summarize', 'summary', 'shorten', 'لخص', 'تلخيص'],
  translation: [
    'translate',
    'translation',
    'arabic',
    'english',
    'ترجم',
    'ترجمة',
  ],
  general: [],
};

export class IntentRecognizer {
  recognize(input: string): Intent {
    const text = input.toLowerCase();

    let best: { name: Intent['name']; matches: number } | null = null;
    for (const [intentName, words] of Object.entries(KEYWORDS)) {
      if (intentName === 'general') {
        continue;
      }

      const matchCount = words.filter((word) => text.includes(word)).length;
      if (matchCount > 0 && (!best || matchCount > best.matches)) {
        best = { name: intentName as Intent['name'], matches: matchCount };
      }
    }

    if (best) {
      return {
        name: best.name,
        confidence: Math.min(0.99, 0.55 + best.matches * 0.15),
      };
    }

    return {
      name: 'general',
      confidence: 0.5,
    };
  }
}
