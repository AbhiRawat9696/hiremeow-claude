import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NATIONALITIES, NATIONALITY_GROUPS, ALL_UNIVERSITIES, ALL_FIELDS, LANGUAGES,
  ALL_SKILLS, ALL_VISAS, gradYears, parseLanguages, formatLanguages
} from '../public/assets/platform/profile-options.js';

const noDupes = list => assert.equal(new Set(list).size, list.length);

test('option lists have no duplicates', () => {
  [NATIONALITIES, ALL_UNIVERSITIES, ALL_FIELDS, LANGUAGES, ALL_SKILLS, ALL_VISAS].forEach(noDupes);
});

test('every nationality appears exactly once in the groups', () => {
  const grouped = NATIONALITY_GROUPS.flatMap(([, list]) => list);
  noDupes(grouped);
  assert.deepEqual([...grouped].sort(), [...NATIONALITIES].sort());
});

test('languages round-trip', () => {
  const text = 'English (Fluent), Thai (Basic), Burmese';
  assert.equal(formatLanguages(parseLanguages(text)), text);
  assert.deepEqual(parseLanguages(''), []);
});

test('graduation years run from now+6 down to 1980', () => {
  const years = gradYears(2026);
  assert.equal(years[0], '2032');
  assert.equal(years.at(-1), '1980');
});
