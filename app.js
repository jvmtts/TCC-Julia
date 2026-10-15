import { FILMS, NODES, BEHAVIORS, createState, reduce } from './scene.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const stage = $('#stage');
const wrap = $('#artifact-wrap');
const front = $('#artifact');
const back = $('#card-back');
const motion = $('#motion-layer');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const modes = ['html','css','js'];
const nodeElements = Object.fromEntries($$('[data-node]').map(element => [element.dataset.node, element]));
const orderRows = new Map();
const animations = new Set();
const feedbackAnimations = new Map();
let state = createState();
let mode = 'html';
const introduced = new Set(['html']);
let fit = 1;
let fitFrame = 0;
let toastTimer;
let epoch = 0;
let busy = false;
let flipped = false;
let exploded = false;
let position = { x: 0, y: 0 };
let drag = null;
let focusMode = false;

function text(element, value) { if (element.textContent !== value) element.textContent = value; }
function notify(message) {
  clearTimeout(toastTimer);
  text($('#toast'), message);
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2100);
}

function activate(button, callback) {
  let start = null;
  let lastTouch = -Infinity;
  const fire = event => { feedback(button, 'press'); callback(event); };
  button.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && event.isPrimary) start = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  button.addEventListener('pointercancel', () => { start = null; });
  button.addEventListener('pointerup', event => {
    if (start?.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 12 && !button.disabled) {
      lastTouch = performance.now();
      fire(event);
    }
    start = null;
  });
  button.addEventListener('click', event => {
    if (event.detail > 0 && performance.now() - lastTouch < 750) { event.preventDefault(); return; }
    if (!button.disabled) fire(event);
  });
}

function feedback(element, kind = 'change') {
  if (!state.css && element && front.contains(element)) return;
  if (!element || reducedMotion.matches || typeof element.animate !== 'function' || document.hidden) return;
  feedbackAnimations.get(element)?.cancel();
  const frames = kind === 'press'
    ? [{ transform:'scale(1)' },{ transform:'scale(.95)',offset:.3 },{ transform:'scale(1)' }]
    : kind === 'add'
      ? [{ opacity:0,transform:'translateY(15px) scale(.93)' },{ opacity:1,transform:'translateY(-3px) scale(1.02)',offset:.7 },{ opacity:1,transform:'none' }]
      : [{ filter:'brightness(1)',transform:'scale(.97)' },{ filter:'brightness(1.18)',transform:'scale(1.015)',offset:.5 },{ filter:'brightness(1)',transform:'scale(1)' }];
  const animation = element.animate(frames,{duration:kind === 'press' ? 240 : 460,easing:'cubic-bezier(.2,.8,.2,1)'});
  feedbackAnimations.set(element,animation);
  animation.finished.catch(() => undefined).finally(() => { if (feedbackAnimations.get(element) === animation) feedbackAnimations.delete(element); });
  if (element === front && state.css) {
    const beam = $('#shine-beam');
    feedbackAnimations.get(beam)?.cancel();
    const shine = beam.animate([{transform:'translateX(-180%) skewX(-20deg)'},{transform:'translateX(240%) skewX(-20deg)'}],{duration:700,easing:'ease-out'});
    feedbackAnimations.set(beam,shine);
    shine.finished.catch(() => undefined).finally(() => { if (feedbackAnimations.get(beam) === shine) feedbackAnimations.delete(beam); });
  }
}

function restyle(key,value) {
  clearEffects();
  dispatch({type:'STYLE',key,value});
  feedback(front);
}

function makeButton(className, label, callback) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  activate(button, callback);
  return button;
}

function select(selector, attribute, value) {
  $$(selector).forEach(button => {
    const active = button.dataset[attribute] === value;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function readableOn(hex) {
  const parts = hex.slice(1).match(/../g).map(value => parseInt(value,16));
  return parts[0] * .299 + parts[1] * .587 + parts[2] * .114 > 155 ? '#202735' : '#f7f3ed';
}

function values() {
  const film = FILMS[state.universe];
  const labels = {flip:'Virar figurinha',drag:'Mover figurinha',explode:'Separar camadas',bounce:'Fazer pular',spin:'Girar figurinha',fly:'Passear',next:'Surpresa!'};
  return { title: film.title, text: film.description, button: mode === 'js' ? labels[state.behavior] : 'Dar vida à figurinha', badge: film.badge, quote: film.quote, ...state.fields };
}

function dispatch(action) {
  const next = reduce(state, action);
  if (next === state) return;
  state = next;
  render();
}

function naturalBounds() {
  const radians = Math.abs(state.css ? state.style.rotation : 0) * Math.PI / 180;
  const w = wrap.offsetWidth;
  const h = wrap.offsetHeight;
  return { width: w * Math.cos(radians) + h * Math.sin(radians), height: h * Math.cos(radians) + w * Math.sin(radians) };
}

function setPosition(x, y) {
  const bounds = naturalBounds();
  const maxX = Math.max(0, (stage.clientWidth / fit - bounds.width) / 2 - 14 / fit);
  const maxY = Math.max(0, ($('#scene-center').clientHeight / fit - bounds.height) / 2 - 5 / fit);
  position = { x: Math.max(-maxX, Math.min(maxX, Number(x) || 0)), y: Math.max(-maxY, Math.min(maxY, Number(y) || 0)) };
  wrap.style.setProperty('--drag-x', `${position.x}px`);
  wrap.style.setProperty('--drag-y', `${position.y}px`);
}

function requestFit() {
  if (fitFrame) return;
  fitFrame = requestAnimationFrame(() => {
    fitFrame = 0;
    const bounds = naturalBounds();
    wrap.classList.toggle('compact-back', front.offsetHeight < 360);
    const padding = exploded ? 58 : 20;
    const area = $('#scene-center');
    fit = Math.max(.2, Math.min(1, (area.clientWidth - 12) / Math.max(1,bounds.width + padding), (area.clientHeight - 12) / Math.max(1,bounds.height + padding)));
    $('#piece-fit').style.setProperty('--fit', String(fit));
    setPosition(position.x, position.y);
  });
}

function endDrag() {
  const id = drag?.id;
  drag = null;
  wrap.classList.remove('dragging');
  if (id !== undefined && wrap.hasPointerCapture(id)) wrap.releasePointerCapture(id);
}

function setFlipped(value) {
  const hadFocus = wrap.contains(document.activeElement);
  flipped = value;
  wrap.classList.toggle('flipped', value);
  front.inert = value;
  back.inert = !value;
  front.setAttribute('aria-hidden', String(value));
  back.setAttribute('aria-hidden', String(!value));
  if (hadFocus) (value ? $('#flip-back') : state.nodes.includes('button') ? $('#scene-action') : $('#run')).focus({ preventScroll: true });
}

function clearEffects() {
  epoch++;
  animations.forEach(animation => animation.cancel());
  animations.clear();
  busy = false;
  endDrag();
  setFlipped(false);
  exploded = false;
  stage.classList.remove('exploded');
  setPosition(0,0);
  requestFit();
}

function updateHints() {
  const hints = { html: state.nodes.length ? 'Toque nas partes para montar.' : 'Escolha o primeiro elemento.', css: state.css ? 'Cada escolha muda sua figurinha.' : 'Sem CSS. Só a estrutura.', js: !state.js ? 'Interações desligadas.' : state.behavior === 'drag' ? 'Segure a figurinha e arraste.' : exploded ? 'Toque de novo para reunir.' : flipped ? 'Toque para voltar à frente.' : busy ? 'Sua figurinha está em movimento.' : 'Toque em uma ação para experimentar.' };
  text($('#stage-label'), { html:'01 / CONSTRUA', css:'02 / TRANSFORME', js:'03 / DÊ VIDA' }[mode]);
  text($('#stage-hint'), hints[mode]);
  wrap.classList.toggle('drag-ready', mode === 'js' && state.behavior === 'drag' && state.js);
  const labels = { flip: flipped ? 'Virar de volta' : 'Testar: virar', drag:'Testar: mover', explode: exploded ? 'Reunir as camadas' : 'Testar: separar camadas', bounce:'Testar: pular', spin:'Testar: girar', fly:'Testar: passear', next:'Testar: surpresa' };
  text($('#run-label'), busy ? 'Em ação…' : labels[state.behavior]);
  $('#run').setAttribute('aria-disabled', String(!state.js));
  $('#run').setAttribute('aria-busy', String(busy));
}

function render() {
  const film = FILMS[state.universe];
  const content = values();
  document.body.dataset.universe = state.universe;
  document.body.style.setProperty('--accent', film.accent);
  document.body.style.setProperty('--film-bg', film.background);
  document.body.style.setProperty('--film-image', `url('${film.image}')`);
  text($('#piece-studio'), film.studio);
  text($('#take-number'), String(Object.keys(FILMS).indexOf(state.universe) + 1).padStart(3,'0'));
  text($('#theme-name'),film.name);
  text($('#image-caption'), film.name.toUpperCase());
  for (const selector of ['#poster-image','#back-image']) {
    const image = $(selector);
    if (image.getAttribute('src') !== film.image) { image.hidden = false; image.src = film.image; }
  }
  $('#poster-image').alt = film.alt;
  $('#film-credit').href = film.source;
  text($('#film-credit'),`ARTE: ${film.studio} ↗`);
  text($('#scene-title'), content.title);
  text($('#scene-text'), content.text);
  text($('#badge-text'), content.badge);
  text($('#scene-quote'), content.quote);
  text($('#action-label'), content.button);
  if ($('#characters').dataset.film !== state.universe) {
    $('#characters').replaceChildren(...film.characters.map(name => { const li = document.createElement('li'); li.textContent = name; return li; }));
    $('#characters').dataset.film = state.universe;
  }
  for (const [index,id] of state.nodes.entries()) {
    const element = nodeElements[id];
    element.hidden = false;
    element.style.setProperty('--offset', `${index % 2 ? 16 : -16}px`);
    element.style.setProperty('--layer-angle', `${index % 2 ? 3 : -3}deg`);
  }
  const missing = Object.keys(NODES).filter(id => !state.nodes.includes(id));
  missing.forEach(id => { nodeElements[id].hidden = true; });
  [...state.nodes,...missing].forEach((id,index) => {
    const container = $('#piece-content');
    const element = nodeElements[id];
    if (container.children[index] !== element) container.insertBefore(element,container.children[index] || null);
  });
  $('#empty-state').hidden = state.nodes.length > 0;
  text($('#node-count'), `${state.nodes.length} / 8`);
  $$('.node-choice').forEach(button => {
    const active = state.nodes.includes(button.dataset.add);
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? 'Remover' : 'Adicionar'} ${NODES[button.dataset.add][1]}`);
  });
  const rows = state.nodes.map((id,index) => {
    const row = orderRows.get(id);
    text(row.querySelector('span'), String(index + 1).padStart(2,'0'));
    row.querySelector('[data-direction="-1"]').disabled = index === 0;
    row.querySelector('[data-direction="1"]').disabled = index === state.nodes.length - 1;
    return row;
  });
  if (!rows.length) { const empty = document.createElement('li'); empty.className = 'order-empty'; empty.textContent = 'Adicione um elemento para começar.'; rows.push(empty); }
  $('#node-order').replaceChildren(...rows);
  $$('[data-field]').forEach(input => {
    const key = input.dataset.field;
    const value = content[key];
    if (input.value !== value) input.value = value;
    input.closest('label').hidden = !state.nodes.includes(key);
  });
  const fieldPair = $('#panel-html .field-pair');
  fieldPair.hidden = !state.nodes.includes('button') && !state.nodes.includes('badge');
  $('#content-empty').hidden = ['title','text','button','badge','quote'].some(id=>state.nodes.includes(id));
  const style = state.style;
  const ink = readableOn(style.background);
  const properties = { '--card-bg':style.background, '--card-ink':ink, '--card-muted':ink === '#202735' ? '#4d5867' : '#b9c6da', '--card-accent':style.accent, '--button-ink':readableOn(style.accent), '--radius':`${style.radius}px`, '--shadow':`${style.shadow}px`, '--rotation':`${style.rotation}deg`, '--title-size':`${style.size}px` };
  Object.entries(properties).forEach(([key,value]) => stage.style.setProperty(key,value));
  for (const key of ['look','font','layout','filter']) stage.dataset[key] = style[key];
  stage.classList.toggle('no-css', !state.css && state.nodes.length > 0);
  stage.classList.toggle('js-off', !state.js);
  $$('[data-style]').forEach(input => {
    const key = input.dataset.style;
    if (input.value !== String(style[key])) input.value = String(style[key]);
    if (input.type === 'range') {
      const percent = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100;
      input.style.setProperty('--fill', `${percent}%`);
      text($(`#${key}-output`), `${style[key]}${key === 'rotation' ? '°' : ['radius','size'].includes(key) ? ' px' : ''}`);
    }
  });
  $('#css-enabled').checked = state.css;
  $('#js-enabled').checked = state.js;
  select('.film-option','film',state.universe);
  select('button[data-look]','look',style.look);
  select('button[data-layout]','layout',style.layout);
  select('button[data-font]','font',style.font);
  select('button[data-filter]','filter',style.filter);
  select('.behavior-choice','behavior',state.behavior);
  text($('#interaction-count'), `${state.interactions} ${state.interactions === 1 ? 'interação' : 'interações'}`);
  updateHints();
  requestFit();
}

function setMode(next, focus = false) {
  if (!modes.includes(next)) return;
  clearEffects();
  mode = next;
  if (!introduced.has(next)) {
    introduced.add(next);
    if (next === 'css') dispatch({type:'CSS',value:true});
    if (next === 'js') dispatch({type:'JS',value:true});
  }
  modes.forEach(id => {
    const active = id === mode;
    const tab = $(`#tab-${id}`);
    tab.classList.toggle('active',active);
    tab.setAttribute('aria-selected',String(active));
    tab.tabIndex = active ? 0 : -1;
    $(`#panel-${id}`).hidden = !active;
  });
  const nextId = modes[(modes.indexOf(mode) + 1) % modes.length];
  const arrow = document.createElement('span'); arrow.textContent = '→'; arrow.setAttribute('aria-hidden','true');
  $('#next-mode').replaceChildren(document.createTextNode(`Agora: ${nextId === 'js' ? 'JavaScript' : nextId.toUpperCase()} `),arrow);
  if (focus) $(`#tab-${mode}`).focus();
  text($('#action-label'),values().button);
  feedback($(`#panel-${mode}`),'add');
  updateHints();
}

function toggleFocus(value = !focusMode) {
  focusMode = value;
  document.body.classList.toggle('focus-mode',value);
  $('#focus-mode').setAttribute('aria-expanded',String(value));
  $('#focus-mode').setAttribute('aria-label',value ? 'Sair do modo foco' : 'Ativar modo foco');
  text($('#focus-label'),value ? 'Sair' : 'Foco');
  const studio = $('.studio');
  if (value) { studio.setAttribute('role','dialog'); studio.setAttribute('aria-modal','true'); }
  else { studio.removeAttribute('role'); studio.removeAttribute('aria-modal'); }
  $$('.header,.intro,.page-footer').forEach(element => { element.inert = value; });
  $('#focus-mode').focus({preventScroll:true});
  endDrag();
  requestFit();
}

function animate(frames, duration) {
  if (reducedMotion.matches || typeof motion.animate !== 'function') return Promise.resolve();
  const animation = motion.animate(frames, { duration, easing:'cubic-bezier(.25,.7,.3,1)' });
  animations.add(animation);
  return animation.finished.catch(() => undefined).finally(() => animations.delete(animation));
}

async function run() {
  if (!state.js) { notify('JavaScript desligado. A cena não reage.'); return; }
  if (mode !== 'js') setMode('js',true);
  if (busy) return;
  if (state.behavior === 'explode' && !state.css) { notify('Ative o CSS para separar visualmente os elementos.'); return; }
  const behavior = state.behavior;
  dispatch({ type:'INTERACT' });
  if (behavior === 'flip') { setFlipped(!flipped); updateHints(); return; }
  if (behavior === 'explode') { exploded = !exploded; stage.classList.toggle('exploded',exploded); updateHints(); requestFit(); return; }
  if (behavior === 'drag') { setPosition(position.x > 0 ? -100 : 100, position.y > 0 ? -20 : 20); return; }
  if (behavior === 'next') {
    clearEffects();
    const films = Object.keys(FILMS);
    dispatch({ type:'UNIVERSE', id:films[(films.indexOf(state.universe) + 1) % films.length] });
    feedback(front);
    return;
  }
  const current = epoch;
  busy = true;
  updateHints();
  const dx = Math.min(55, Math.max(10, (stage.clientWidth - wrap.offsetWidth * fit) / 2 - 15)) / fit;
  const dy = 16 / fit;
  try {
    if (behavior === 'bounce') await animate([{transform:'translateY(0) scale(1)'},{transform:`translateY(${-dy}px) scale(1.035)`,offset:.35},{transform:'translateY(0) scale(.98)',offset:.76},{transform:'translateY(0) scale(1)'}],800);
    if (behavior === 'spin') await animate([{transform:'rotate(0deg) scale(1)'},{transform:'rotate(180deg) scale(.82)',offset:.5},{transform:'rotate(360deg) scale(1)'}],1100);
    if (behavior === 'fly') await animate([{transform:'translate(0,0) rotate(0deg)'},{transform:`translate(${dx}px,${-dy}px) rotate(6deg)`,offset:.3},{transform:`translate(${-dx}px,${dy}px) rotate(-4deg)`,offset:.7},{transform:'translate(0,0) rotate(0deg)'}],1400);
    if (reducedMotion.matches) notify(`${BEHAVIORS[behavior][1]}: ação registrada sem animação.`);
  } finally {
    if (current === epoch) { busy = false; updateHints(); }
  }
}

for (const [id,film] of Object.entries(FILMS)) {
  const button = makeButton('film-option',film.name,() => { clearEffects(); dispatch({type:'UNIVERSE',id}); feedback(front); });
  button.dataset.film = id;
  const image = document.createElement('img'); image.src = film.image; image.alt = ''; image.width = 1200; image.height = 515; image.draggable = false;
  const label = document.createElement('span'); label.textContent = film.name;
  const tag = document.createElement('i'); tag.textContent = '✓'; tag.setAttribute('aria-hidden','true');
  button.append(image,label,tag);
  $('#film-strip').append(button);
}
for (const [id,[icon,label,tag]] of Object.entries(NODES)) {
  const button = makeButton('node-choice',`Adicionar ${label}`,() => { clearEffects(); dispatch({type:'TOGGLE_NODE',id}); if (state.nodes.includes(id)) feedback(nodeElements[id],'add'); });
  button.dataset.add = id;
  const symbol = document.createElement('span'); symbol.textContent = icon; symbol.setAttribute('aria-hidden','true');
  const name = document.createElement('span'); name.textContent = label;
  button.append(symbol,name);
  $('#node-palette').append(button);
  const row = document.createElement('li'); row.dataset.order = id;
  const number = document.createElement('span'); const title = document.createElement('b'); title.textContent = label;
  row.append(number,title);
  for (const direction of [-1,1]) {
    const move = makeButton('',`${direction === -1 ? 'Subir' : 'Descer'} ${label}`,() => { clearEffects(); dispatch({type:'MOVE',id,direction}); });
    move.dataset.direction = String(direction); move.textContent = direction === -1 ? '↑' : '↓'; row.append(move);
  }
  orderRows.set(id,row);
  nodeElements[id].dataset.tag = tag;
}
for (const [id,[icon,name,description]] of Object.entries(BEHAVIORS)) {
  const button = makeButton('behavior-choice',name,() => {
    if (state.behavior !== id) { clearEffects(); dispatch({type:'BEHAVIOR',id}); }
    if (state.js) void run();
  });
  button.dataset.behavior = id;
  const symbol = document.createElement('span'); symbol.textContent = icon; symbol.setAttribute('aria-hidden','true');
  const label = document.createElement('span'); const title = document.createElement('b'); title.textContent = name;
  const detail = document.createElement('small'); detail.textContent = description; label.append(title,detail); button.append(symbol,label);
  $('#behavior-options').append(button);
}
$$('[data-mode]').forEach(tab => {
  activate(tab,() => setMode(tab.dataset.mode));
  tab.addEventListener('keydown',event => {
    let index = modes.indexOf(tab.dataset.mode);
    if (event.key === 'ArrowRight') index = (index + 1) % 3;
    else if (event.key === 'ArrowLeft') index = (index + 2) % 3;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = 2;
    else return;
    event.preventDefault(); setMode(modes[index],true);
  });
});
for (const key of ['look','layout','font','filter']) $$(`button[data-${key}]`).forEach(button => activate(button,() => restyle(key,button.dataset[key])));
$$('[data-style]').forEach(input => input.addEventListener('input',() => { clearEffects(); dispatch({type:'STYLE',key:input.dataset.style,value:input.value}); }));
$$('[data-field]').forEach(input => input.addEventListener('input',() => { clearEffects(); dispatch({type:'FIELD',key:input.dataset.field,value:input.value}); }));
activate($('#clear-scene'),() => { clearEffects(); dispatch({type:'CLEAR'}); notify('Cena vazia. Agora você escolhe o que entra.'); });
activate($('#restore-scene'),() => { clearEffects(); dispatch({type:'RESTORE'}); });
activate($('#reset'),() => {
  clearEffects();
  stage.classList.remove('outlines');
  $('#outline').setAttribute('aria-pressed','false');
  $$('.tool-group').forEach(group => { group.open = false; });
  introduced.clear();
  introduced.add('html');
  dispatch({type:'RESET'});
  setMode('html');
  $('.tools').scrollTop = 0;
  notify('Pronto para uma nova criação.');
});
activate($('#run'),run);
activate($('#scene-action'),run);
activate($('#flip-back'),run);
activate($('#center-piece'),() => { clearEffects(); updateHints(); });
activate($('#next-mode'),() => setMode(modes[(modes.indexOf(mode) + 1) % 3]));
activate($('#outline'),() => { const active = stage.classList.toggle('outlines'); $('#outline').setAttribute('aria-pressed',String(active)); });
activate($('#focus-mode'),() => toggleFocus());
document.addEventListener('keydown',event => {
  if (!focusMode) return;
  if (event.key === 'Escape') { event.preventDefault(); toggleFocus(false); return; }
  if (event.key !== 'Tab') return;
  const available = $$('.studio button,.studio input,.studio textarea,.studio summary').filter(element => !element.disabled && !element.closest('[inert]') && element.getClientRects().length);
  const first = available[0]; const last = available.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});
$('#css-enabled').addEventListener('change',event => { clearEffects(); dispatch({type:'CSS',value:event.target.checked}); });
$('#js-enabled').addEventListener('change',event => { clearEffects(); dispatch({type:'JS',value:event.target.checked}); });
wrap.addEventListener('pointerdown',event => {
  if (mode !== 'js' || state.behavior !== 'drag' || !state.js || event.target.closest('button') || event.button !== 0 || !event.isPrimary) return;
  drag = { id:event.pointerId,x:event.clientX,y:event.clientY,originalX:position.x,originalY:position.y,moved:false };
  wrap.classList.add('dragging'); wrap.setPointerCapture(event.pointerId);
});
wrap.addEventListener('pointermove',event => {
  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x; const dy = event.clientY - drag.y;
  if (Math.hypot(dx,dy) > 3) drag.moved = true;
  setPosition(drag.originalX + dx / fit,drag.originalY + dy / fit);
});
wrap.addEventListener('pointerup',event => {
  if (drag?.id !== event.pointerId) return;
  const moved = drag.moved; endDrag(); if (moved) dispatch({type:'INTERACT'});
});
wrap.addEventListener('pointercancel',endDrag);
wrap.addEventListener('lostpointercapture',() => { drag = null; wrap.classList.remove('dragging'); });
$('#poster-image').addEventListener('error',() => { $('#poster-image').hidden = true; notify('Não foi possível carregar a imagem. Tente outro universo.'); });
if ('ResizeObserver' in window) { const observer = new ResizeObserver(requestFit); observer.observe(front); observer.observe($('#scene-center')); }
window.addEventListener('resize',() => { endDrag(); requestFit(); });
document.addEventListener('visibilitychange',() => { if (document.hidden) { clearEffects(); feedbackAnimations.forEach(animation => animation.cancel()); feedbackAnimations.clear(); updateHints(); } });
render();
setMode('html');
