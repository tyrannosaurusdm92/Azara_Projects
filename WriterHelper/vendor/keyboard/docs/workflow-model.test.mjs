import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LAYOUTS } from '../script/keyboard-model.mjs';
import {
  TASK_MODES, LANGUAGES, isLetter, rowsForTask, suggestionCandidates, typedCharacter
} from '../script/workflow-model.mjs';

const lexicon = JSON.parse(fs.readFileSync(new URL('../json/suggestions.json',import.meta.url),'utf8'));

test('all task modes supply usable keys and keep a printable full keyboard',() => {
  assert.equal(Object.keys(TASK_MODES).length,6);
  for (const mode of Object.keys(TASK_MODES)) {
    const rows = rowsForTask('compact',mode,'en',LAYOUTS);
    assert.ok(rows.length >= 4,mode);
    assert.ok(rows.flat().includes('Enter'),mode);
    assert.ok(rows.flat().includes('Backspace'),mode);
  }
  assert.ok(rowsForTask('desktop','typing','en',LAYOUTS).flat().includes('PrintScreen'));
  assert.ok(rowsForTask('compact','big','en',LAYOUTS).length > LAYOUTS.compact.length);
  assert.ok(rowsForTask('desktop','shortcuts','en',LAYOUTS).flat().includes('Copy'));
});

test('all in-app languages have letters, locale-aware case and correct permutations',() => {
  assert.equal(Object.keys(LANGUAGES).length,6);
  const keys = lang => rowsForTask('standard','typing',lang,LAYOUTS).flat();
  assert.ok(keys('fr').includes('a'));
  assert.equal(keys('fr')[keys('en').indexOf('q')],'a');
  assert.equal(keys('de')[keys('en').indexOf('y')],'z');
  assert.ok(keys('es').includes('ñ'));
  assert.ok(keys('pt').includes('ç'));
  assert.ok(keys('ru').includes('й'));
  assert.ok(isLetter('я'));
  assert.equal(typedCharacter('ñ',true,'es'),'Ñ');
  assert.equal(typedCharacter('я',true,'ru'),'Я');
  assert.equal(typedCharacter('PrintScreen',true,'en'),'PrintScreen');
});

test('suggestions are local, prefix matched and respect preceding words',() => {
  assert.ok(lexicon.words.length >= 2500);
  assert.ok(Object.keys(lexicon.bigrams).length >= 300);
  const suggestions = suggestionCandidates('hello wor',9,lexicon.words,lexicon.bigrams);
  assert.ok(suggestions.length >= 1);
  assert.ok(suggestions.every(w => w.startsWith('wor')));
  assert.deepEqual(suggestionCandidates('a',1,lexicon.words,lexicon.bigrams),[]);
});
