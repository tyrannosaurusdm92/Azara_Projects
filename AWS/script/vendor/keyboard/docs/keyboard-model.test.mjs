import test from 'node:test';
import assert from 'node:assert/strict';
import { accentOptions, layoutFor, metricsFor, deleteLastGrapheme, LAYOUTS, isAction } from '../script/keyboard-model.mjs';

test('long-press options have broad Latin coverage and uppercase mapping', () => {
  assert.ok(accentOptions('a').includes('á'));
  assert.ok(accentOptions('e').includes('ë'));
  assert.ok(accentOptions('n').includes('ñ'));
  assert.ok(accentOptions('o',true).includes('Ö'));
  assert.ok(accentOptions('7').length === 0);
});

test('automatic phone/tablet/desktop layouts and explicit override', () => {
  assert.equal(layoutFor(390), 'compact');
  assert.equal(layoutFor(820), 'standard');
  assert.equal(layoutFor(1400), 'desktop');
  assert.equal(layoutFor(390,'desktop'), 'desktop');
  assert.equal(layoutFor(1400,'auto',true), 'symbols');
});

test('each layout has keys and full desktop includes Print Screen', () => {
  for (const key of ['compact','standard','desktop','symbols']) assert.ok(LAYOUTS[key].flat().length >= 25);
  assert.ok(LAYOUTS.desktop.flat().includes('PrintScreen'));
  assert.ok(isAction('PrintScreen'));
});

test('resizing changes key metrics while keeping touch-target dimensions bounded', () => {
  const compact = metricsFor(375,310,'compact',false);
  const wide = metricsFor(1200,510,'desktop',false);
  assert.ok(compact.keyHeight >= 32 && compact.keyHeight <= 68);
  assert.ok(wide.keyHeight >= 32 && wide.keyHeight <= 68);
  assert.ok(compact.gap > 0 && wide.font >= compact.font);
});

test('backspace deletes a user-perceived Unicode character', () => {
  assert.equal(deleteLastGrapheme('a👨‍👩‍👧‍👦'), 'a');
  assert.equal(deleteLastGrapheme('na\u0303'), 'n');
  assert.equal(deleteLastGrapheme(''), '');
});
