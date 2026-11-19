// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import {
  uiCatalog,
  uiSchemaFor,
  validateUiSchema,
  registerUiSchema,
} from './ui';

describe('zeroai adaptive UI contract', () => {
  it('ships built-in schemas for chat/confirm/results/status', () => {
    const kinds = uiCatalog().map((s) => s.kind);
    expect(kinds).toEqual(
      expect.arrayContaining(['chat', 'confirm', 'results', 'status'])
    );
    for (const k of kinds) {
      expect(validateUiSchema(uiSchemaFor(k))).toBe(true);
    }
  });

  it('validates schema shape and rejects bad input', () => {
    expect(validateUiSchema(null)).toBe(false);
    expect(validateUiSchema({ version: 'x' })).toBe(false);
    expect(
      validateUiSchema({
        version: 'ultra.ui.v1',
        kind: 'bad',
        components: [{ id: 'a', kind: 'nope' }],
      })
    ).toBe(false);
  });

  it('registers custom schemas and rejects invalid ones', () => {
    registerUiSchema({
      version: 'ultra.ui.v1',
      kind: 'custom',
      components: [{ id: 't', kind: 'text', props: { text: 'hi' } }],
    });
    expect(uiSchemaFor('custom')?.components).toHaveLength(1);
    expect(() =>
      registerUiSchema({
        version: 'ultra.ui.v1',
        kind: 'x',
        components: [],
      } as never)
    ).not.toThrow();
    expect(() => registerUiSchema({ version: 'bad' } as never)).toThrow(
      'invalid UiSchema'
    );
  });
});
