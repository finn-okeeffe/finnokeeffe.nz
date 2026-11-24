#!/usr/bin/env node
// Checks the static Doctor's Kitchen dashboard logic against results recorded from the
// original Streamlit app's SQL queries (PostgreSQL, November 2026). Run: node scripts/test-doctors-kitchen.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const DK = require('../assets/js/doctors-kitchen-core.js');
const data = JSON.parse(readFileSync(new URL('../assets/data/the-doctors-kitchen.json', import.meta.url), 'utf8'));
const { recipes, ingredients, equipment } = data;

const ALL = [...DK.MEALS, DK.UNSPECIFIED_MEALS, ...DK.DIETS, DK.NO_DIET];
const pairs = (rows) => rows.map((r) => `${r.name}|${r.count}`);
let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`ok - ${name}`); };

test('all tags selected', () => {
  const sel = DK.filterRecipes(recipes, ALL);
  assert.equal(sel.length, 108);
  assert.deepEqual(pairs(DK.topCounts(sel, 'i', ingredients, 8)), [
    'garlic cloves|53', 'olive oil|44', 'extra virgin olive oil|34', 'coriander|32',
    'water|28', 'red onion|23', 'parsley|22', 'ginger|21']);
  assert.deepEqual(pairs(DK.topCounts(sel, 'e', equipment, 8)), [
    'measuring spoons|104', 'scale|104', 'chopping board|103', 'knife|103',
    'pan|60', 'measuring cup|54', 'pot|49', 'grater|42']);
});

test('Vegan + Dinner', () => {
  const sel = DK.filterRecipes(recipes, ['Vegan', 'Dinner']);
  assert.equal(sel.length, 49);
  assert.deepEqual(pairs(DK.topCounts(sel, 'i', ingredients, 8)), [
    'garlic cloves|32', 'olive oil|20', 'coriander|16', 'extra virgin olive oil|16',
    'water|14', 'ginger|13', 'parsley|13', 'red onion|13']);
  assert.deepEqual(pairs(DK.topCounts(sel, 'e', equipment, 8)), [
    'chopping board|48', 'knife|48', 'measuring spoons|48', 'scale|46',
    'measuring cup|26', 'pot|26', 'pan|25', 'grater|21']);
});

test('no tags selected', () => {
  assert.equal(DK.filterRecipes(recipes, []).length, 0);
  assert.equal(DK.filterRecipes(recipes, DK.MEALS).length, 0); // no diet chosen
});

test('ingredient search', () => {
  assert.equal(DK.search(recipes, ingredients, 'olive oil, coriander, bean').length, 7);
  assert.equal(DK.search(recipes, ingredients, '').length, 108);
  assert.equal(DK.search(recipes, ingredients, ' , ,').length, 108);
  const chickpea = new Set(DK.search(recipes, ingredients, 'Chickpea').map((r) => recipes.indexOf(r) + 1));
  assert.deepEqual([...chickpea].sort((a, b) => a - b), [3, 11, 19, 23, 24, 32, 34, 49, 58, 62, 81, 105]);
  assert.equal(DK.search(recipes, ingredients, 'no-such-ingredient').length, 0);
  assert.equal(DK.searchTerms('a,b,c,d,e,f,g,h,i,j').length, 8);
});

test('histogram bins (Vega nice bins)', () => {
  assert.deepEqual(DK.binParams(5, 45, 10), { start: 5, stop: 45, step: 5 });
  assert.deepEqual(DK.binParams(0, 100, 10), { start: 0, stop: 100, step: 10 });
  const sel = DK.filterRecipes(recipes, ALL);
  const prep = DK.histogram(sel.map((r) => r.p));
  assert.equal(prep.bins.reduce((s, b) => s + b.count, 0), 107);
  const cook = DK.histogram(sel.map((r) => r.c), [0, 100]);
  assert.equal(cook.outside, 2);
  assert.equal(cook.bins.reduce((s, b) => s + b.count, 0), 100);
  assert.equal(cook.bins.length, 10);
});

test('only http(s) links', () => {
  assert.equal(DK.safeUrl('https://thedoctorskitchen.com/recipes/x/'), 'https://thedoctorskitchen.com/recipes/x/');
  assert.equal(DK.safeUrl('javascript:alert(1)'), null);
  assert.equal(DK.safeUrl('https://x.test/"onmouseover'), null);
});

console.log(`${n} tests passed`);
