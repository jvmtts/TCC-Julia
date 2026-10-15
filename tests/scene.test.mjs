import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, reduce, NODES } from '../scene.mjs';

test('nomes inválidos ou herdados usam um tema válido e não alteram a composição', () => {
  for (const id of ['missing','__proto__','constructor']) {
    assert.deepEqual(createState(id),createState('toy'));
    const state = createState();
    assert.equal(reduce(state,{type:'UNIVERSE',id}),state);
  }
});

test('começar do zero esvazia a cena e só escolhas explícitas adicionam elementos', () => {
  let state = reduce(createState(), { type: 'CLEAR' });
  assert.deepEqual(state.nodes, []);
  state = reduce(state, { type: 'STYLE', key: 'radius', value: 30 });
  state = reduce(state, { type: 'UNIVERSE', id: 'garfield' });
  assert.deepEqual(state.nodes, []);
  state = reduce(state, { type: 'TOGGLE_NODE', id: 'title' });
  assert.deepEqual(state.nodes, ['title']);
});

test('permite oito tipos sem duplicar elementos e permite removê-los', () => {
  let state = reduce(createState(), { type: 'CLEAR' });
  for (const id of Object.keys(NODES)) state = reduce(state, { type: 'TOGGLE_NODE', id });
  assert.equal(state.nodes.length, 8);
  for (const id of Object.keys(NODES)) state = reduce(state, { type: 'TOGGLE_NODE', id });
  assert.deepEqual(state.nodes, []);
});

test('reordenar altera a estrutura sem modificar o estado anterior', () => {
  const previous = reduce(createState(),{type:'RESTORE'});
  const next = reduce(previous, { type: 'MOVE', id: 'image', direction: 1 });
  assert.deepEqual(next.nodes.slice(0,2), ['badge','image']);
  assert.equal(previous.nodes[0], 'image');
  assert.equal(reduce(previous, { type: 'MOVE', id: 'image', direction: -1 }), previous);
});

test('trocar de filme preserva estrutura, conteúdo editado e escolhas de estilo', () => {
  let state = reduce(createState(), { type: 'FIELD', key: 'title', value: 'Minha cena' });
  state = reduce(state, { type: 'STYLE', key: 'font', value: 'serif' });
  state = reduce(state, { type: 'UNIVERSE', id: 'stitch' });
  assert.equal(state.fields.title, 'Minha cena');
  assert.equal(state.style.font, 'serif');
  assert.deepEqual(state.nodes, createState().nodes);
});

test('estilos numéricos são limitados e valores inválidos são rejeitados', () => {
  const state = createState();
  assert.equal(reduce(state, { type: 'STYLE', key: 'radius', value: 100 }).style.radius, 40);
  assert.equal(reduce(state, { type: 'STYLE', key: 'rotation', value: -200 }).style.rotation, -12);
  for (const action of [{ key: 'size', value: NaN }, { key: 'accent', value: 'url(unsafe)' }, { key: 'layout', value: 'invalid' }]) assert.equal(reduce(state, { type: 'STYLE', ...action }), state);
});

test('conteúdo é limitado e desligar JavaScript impede o contador de avançar', () => {
  let state = reduce(createState(), { type: 'FIELD', key: 'title', value: 'a'.repeat(200) });
  assert.equal(state.fields.title.length, 60);
  state = reduce(state, { type: 'JS', value: false });
  assert.equal(reduce(state, { type: 'INTERACT' }), state);
});

test('restaurar e reiniciar são ações diferentes e previsíveis', () => {
  let state = reduce(createState('garfield'), { type: 'CLEAR' });
  state = reduce(state, { type: 'STYLE', key: 'look', value: 'comic' });
  const restored = reduce(state, { type: 'RESTORE' });
  assert.equal(restored.style.look, 'comic');
  assert.deepEqual(reduce(restored, { type: 'RESET' }), createState('garfield'));
});

test('início e reinício começam vazios, sem CSS e sem ações', () => {
  const initial = createState();
  assert.deepEqual(initial.nodes, []);
  assert.equal(initial.css, false);
  assert.equal(initial.js, false);
  const built = reduce(initial,{type:'RESTORE'});
  assert.equal(built.nodes.length,5);
  assert.deepEqual(reduce(built,{type:'RESET'}),initial);
});
