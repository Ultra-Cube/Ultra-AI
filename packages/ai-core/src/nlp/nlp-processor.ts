export class NLPProcessor {
  detectLanguage(input: string): 'en' | 'ar' {
    // Basic Unicode range check for Arabic script.
    return /[\u0600-\u06FF]/.test(input) ? 'ar' : 'en';
  }

  normalize(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }
}
