import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, reduce, NODES } from '../scene.mjs';
import { readableColor, contrastRatio, PALETTES } from '../src/colors.mjs';

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
  assert.equal(state.style.accent, createState().style.accent);
  assert.equal(state.style.background, createState().style.background);
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

test('navegar nunca ativa CSS ou JavaScript, inclusive depois de desligá-los', () => {
  let state = reduce(createState(), { type: 'RESTORE' });
  for (const mode of ['css', 'js', 'html', 'css']) {
    state = reduce(state, { type: 'NAVIGATE', mode });
    assert.equal(state.mode, mode);
    assert.equal(state.css, false);
    assert.equal(state.js, false);
  }
  state = reduce(state, { type: 'CSS', value: true });
  state = reduce(state, { type: 'JS', value: true });
  state = reduce(state, { type: 'CSS', value: false });
  state = reduce(state, { type: 'JS', value: false });
  state = reduce(state, { type: 'NAVIGATE', mode: 'js' });
  assert.equal(state.css, false);
  assert.equal(state.js, false);
});

test('trocar painéis e escolher comportamento preserva conteúdo e não conta interações', () => {
  let state = reduce(createState(), { type: 'RESTORE' });
  state = reduce(state, { type: 'FIELD', key: 'title', value: 'Minha coleção' });
  const nodes = state.nodes;
  const fields = state.fields;
  for (const mode of ['css', 'js', 'html']) state = reduce(state, { type: 'NAVIGATE', mode });
  state = reduce(state, { type: 'BEHAVIOR', id: 'spin' });
  assert.equal(state.interactions, 0);
  assert.equal(state.js, false);
  assert.equal(state.nodes, nodes);
  assert.equal(state.fields, fields);
});

test('uma figurinha vazia não ativa recursos e remover a última parte os desliga', () => {
  let state = createState();
  state = reduce(state, { type: 'CSS', value: true });
  state = reduce(state, { type: 'JS', value: true });
  assert.equal(state.css, false);
  assert.equal(state.js, false);
  state = reduce(state, { type: 'TOGGLE_NODE', id: 'title' });
  state = reduce(state, { type: 'CSS', value: true });
  state = reduce(state, { type: 'JS', value: true });
  state = reduce(state, { type: 'INTERACT' });
  assert.equal(state.interactions, 1);
  state = reduce(state, { type: 'TOGGLE_NODE', id: 'title' });
  assert.equal(state.css, false);
  assert.equal(state.js, false);
  assert.equal(reduce(state, { type: 'INTERACT' }), state);
});

test('desligar camadas preserva estilos, estrutura e conteúdo personalizado', () => {
  let state = reduce(createState(), { type: 'RESTORE' });
  state = reduce(state, { type: 'STYLE', key: 'look', value: 'glass' });
  state = reduce(state, { type: 'FIELD', key: 'title', value: 'Uma ideia' });
  const before = structuredClone(state);
  for (const key of Object.keys(state.layers)) state = reduce(state, { type: 'LAYER', key, value: false });
  assert.deepEqual(state.style, before.style);
  assert.deepEqual(state.nodes, before.nodes);
  assert.deepEqual(state.fields, before.fields);
  assert.ok(Object.values(before.layers).every(Boolean));
  assert.ok(Object.values(state.layers).every(value => !value));
  assert.equal(reduce(state, { type: 'LAYER', key: '__proto__', value: true }), state);
  assert.equal(reduce(state, { type: 'NAVIGATE', mode: '__proto__' }), state);
});

test('cores claras, escuras e intermediárias mantêm texto com contraste de pelo menos 4,5', () => {
  for (let r = 0; r <= 255; r += 17) {
    for (let g = 0; g <= 255; g += 17) {
      for (let b = 0; b <= 255; b += 17) {
        const background = '#' + [r, g, b].map(value => value.toString(16).padStart(2, '0')).join('');
        assert.ok(contrastRatio(readableColor(background), background) >= 4.5, background);
      }
    }
  }
});

test('paletas e a combinação oliva com marrom recebem texto legível em ambas as superfícies', () => {
  for (const { background, accent } of [...PALETTES, { background: '#819a64', accent: '#4a2507' }]) {
    assert.ok(contrastRatio(readableColor(background), background) >= 4.5);
    assert.ok(contrastRatio(readableColor(accent), accent) >= 4.5);
  }
});

test('contraste rejeita formatos inválidos e não interpreta entradas como CSS', () => {
  for (const value of [null, undefined, '', '#fff', 'transparent', 'url(test)', '#zzzzzz']) {
    assert.equal(contrastRatio('#ffffff', value), 0);
    assert.equal(readableColor(value), '#000000');
  }
});

test('arrastar reordena as partes preservando conteúdo, estilo e tecnologias', () => {
  let state = reduce(createState(),{type:'RESTORE'});
  state = reduce(state,{type:'CSS',value:true});
  state = reduce(state,{type:'FIELD',key:'title',value:'Minha figurinha'});
  const nodes = [...state.nodes].reverse();
  const next = reduce(state,{type:'REORDER',nodes});
  assert.deepEqual(next.nodes,nodes);
  assert.notEqual(next.nodes,nodes);
  assert.equal(next.customOrder,true);
  assert.deepEqual(next.fields,state.fields);
  assert.deepEqual(next.style,state.style);
  assert.equal(next.css,state.css);
  assert.equal(next.js,state.js);
  assert.deepEqual(state.nodes,['image','badge','title','text','button']);
});

test('reordenação rejeita partes ausentes, repetidas e entradas inválidas', () => {
  const state = reduce(createState(),{type:'RESTORE'});
  for (const nodes of [null,{},[],['image'],['image','image','title','text','button'],['image','badge','title','text','missing']]) assert.equal(reduce(state,{type:'REORDER',nodes}),state);
  assert.equal(reduce(state,{type:'REORDER',nodes:[...state.nodes]}),state);
  const custom = reduce(state,{type:'REORDER',nodes:[...state.nodes].reverse()});
  assert.equal(reduce(custom,{type:'RESTORE'}).customOrder,false);
  assert.equal(reduce(custom,{type:'RESET'}).customOrder,false);
});
