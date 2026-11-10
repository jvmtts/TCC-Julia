import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Code2, Eye, Image, Layers, MousePointer2, Move, Plus, RotateCcw, Rotate3D, Sparkles, Square, Type, Zap, Play, Palette, Maximize2, Minimize2, Quote, Minus, List, Tag, Undo2, Shuffle, Orbit, ArrowUpFromLine } from 'lucide-react';
import { FILMS, NODES, BEHAVIORS, createState, reduce } from '../scene.mjs';
import { readableColor } from './colors.mjs';
import StyleChoices from './StyleChoices.jsx';
import SortableParts from './SortableParts.jsx';
import StudioEffects from './StudioEffects.jsx';

const modes = ['html', 'css', 'js'];
const modeInfo = {
  html: { name: 'HTML', subtitle: 'O conteúdo', label: 'Monte a estrutura.', description: 'Escolha o que faz parte da sua figurinha.', icon: Code2 },
  css: { name: 'CSS', subtitle: 'A aparência', label: 'Encontre seu estilo.', description: 'O mesmo conteúdo, com outra personalidade.', icon: Palette },
  js: { name: 'JavaScript', subtitle: 'O comportamento', label: 'Faça acontecer.', description: 'Uma ação sua. Uma resposta da figurinha.', icon: Zap },
};
const nodeIcons = { image: Image, title: Type, text: Code2, button: MousePointer2, badge: Tag, characters: List, quote: Quote, divider: Minus };
const behaviorIcons = { flip: Rotate3D, drag: Move, explode: Layers, bounce: ArrowUpFromLine, spin: RotateCcw, fly: Orbit, next: Shuffle };
const fieldLimits = { title: 60, text: 110, button: 28, badge: 28, quote: 110 };

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return reduced;
}

function IconButton({ label, children, ...props }) {
  return <button type="button" className="icon-button" aria-label={label} title={label} {...props}>{children}</button>;
}

function Activation({ enabled, disabled, technology, onChange }) {
  return <div className={`activation ${enabled ? 'enabled' : ''}`}>
    <div><span className="mini-label">{enabled ? 'EM AÇÃO' : 'VOCÊ DECIDE QUANDO'}</span><strong>{enabled ? `${technology} ativado` : `${technology} está desligado`}</strong></div>
    <button type="button" className="activation-button" aria-pressed={enabled} disabled={disabled} onClick={() => onChange(!enabled)}>{enabled ? <><Check size={15} /> Desligar</> : <><Plus size={15} /> {technology === 'CSS' ? 'Aplicar CSS' : 'Ativar JS'}</>}</button>
  </div>;
}

function HtmlPanel({ state, dispatch }) {
  const film = FILMS[state.universe];
  const fields = { title: film.title, text: film.description, button: 'Explorar a figurinha', badge: film.badge, quote: film.quote, ...state.fields };
  return <>
    <div className="section-title"><span>01 / SEU UNIVERSO</span><span className="subtle">{film.name}</span></div>
    <div className="universes" role="group" aria-label="Personagem da figurinha">{Object.entries(FILMS).map(([id, item]) => <button type="button" key={id} title={item.name} aria-label={item.name} aria-pressed={state.universe === id} className={state.universe === id ? 'selected' : ''} onClick={() => dispatch({ type: 'UNIVERSE', id })}><img src={item.image} alt="" /><span>{item.name.replace('Os ', '')}</span>{state.universe === id && <i><Check size={10} /></i>}</button>)}</div>
    <div className="section-title"><span>02 / ADICIONE AS PARTES</span><span className="mono">{state.nodes.length.toString().padStart(2, '0')} / 08</span></div>
    <div className="node-grid" role="group" aria-label="Elementos HTML">{Object.entries(NODES).map(([id, [, label, tag]]) => { const Icon = nodeIcons[id]; const active = state.nodes.includes(id); return <button type="button" key={id} aria-pressed={active} className={`node-choice ${active ? 'selected' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_NODE', id })}><Icon size={17} /><span><strong>{label}</strong><code>&lt;{tag}&gt;</code></span>{active ? <Check size={14} /> : <Plus size={14} />}</button>; })}</div>
    <div className="model-actions"><button type="button" onClick={() => dispatch({ type: 'RESTORE' })}>Usar modelo pronto <ArrowUpRight size={13} /></button><button type="button" disabled={!state.nodes.length} onClick={() => dispatch({ type: 'CLEAR' })}>Limpar</button></div>
    <details className="disclosure"><summary>Editar conteúdo <Plus size={15} /></summary><div className="detail-content">{state.nodes.filter(id => fieldLimits[id]).map(id => <label className="input-label" key={id}>{NODES[id][1]}<input maxLength={fieldLimits[id]} value={fields[id]} onChange={event => dispatch({ type: 'FIELD', key: id, value: event.target.value })} /></label>)}{!state.nodes.some(id => fieldLimits[id]) && <p>Adicione um título, texto ou botão para editar.</p>}</div></details>
    <details className="disclosure"><summary>Organizar as partes <Plus size={15} /></summary><SortableParts nodes={state.nodes} onReorder={nodes => dispatch({type:'REORDER',nodes})} /></details>
  </>;
}

function CssPanel({ state, dispatch }) {
  const style = (key, value) => dispatch({ type: 'STYLE', key, value });
  return <>
    <Activation technology="CSS" enabled={state.css} disabled={!state.nodes.length} onChange={value => dispatch({ type: 'CSS', value })} />
    {!state.nodes.length && <p className="inline-hint">Primeiro, adicione uma parte no HTML.</p>}
    <fieldset disabled={!state.css} className="controls-fieldset">
      <div className="section-title"><span>01 / ACABAMENTO</span></div>
      <div className="finishes" role="group" aria-label="Acabamento">{[['cinema', 'Adesivo', '01'], ['glass', 'Holográfico', '02'], ['comic', 'Quadrinhos', '03'], ['minimal', 'Papel', '04']].map(([id, label, number]) => <button type="button" key={id} aria-pressed={state.style.look === id} className={state.style.look === id ? 'selected' : ''} onClick={() => style('look', id)}><span className={`finish-preview finish-${id}`}><span>{id === 'comic' ? 'POW!' : id === 'minimal' ? 'Aa.' : 'J'}</span><small>{number}</small></span><span>{label}{state.style.look === id && <Check size={12} />}</span></button>)}</div>
      <div className="section-title"><span>02 / CADA CAMADA FAZ DIFERENÇA</span></div>
      <div className="layer-switches">{[['colors', 'Cores', 'Fundo e contraste'], ['type', 'Tipografia', 'A voz das palavras'], ['frame', 'Moldura', 'Bordas e profundidade'], ['layout', 'Composição', 'Espaços e alinhamento']].map(([id, label, caption]) => <button type="button" key={id} role="switch" aria-checked={state.layers[id]} onClick={() => dispatch({ type: 'LAYER', key: id, value: !state.layers[id] })}><span><strong>{label}</strong><small>{caption}</small></span><i className={`toggle ${state.layers[id] ? 'on' : ''}`} /></button>)}</div>
      <details className="disclosure"><summary>Ajustar do seu jeito <Plus size={15} /></summary><div className="detail-content">
        <div className="section-title">LETRAS</div><div className="font-options">{[['cinema', 'Aa', 'Forte'], ['rounded', 'Aa', 'Suave'], ['serif', 'Aa', 'Clássica'], ['mono', 'Aa', 'Código']].map(([id, sample, name]) => <button type="button" key={id} data-font={id} aria-label={`Fonte ${name}`} aria-pressed={state.style.font === id} onClick={() => style('font', id)}><b>{sample}</b><small>{name}</small></button>)}</div>
        <StyleChoices state={state} film={FILMS[state.universe]} onStyle={style} />
        {[['radius', 'Cantos', 0, 40, 'px'], ['shadow', 'Sombra', 0, 40, ''], ['rotation', 'Inclinação', -12, 12, '°'], ['size', 'Título', 24, 48, 'px']].map(([key, label, min, max, unit]) => <label className="range-label" key={key}><span>{label}<output>{state.style[key]}{unit}</output></span><input type="range" min={min} max={max} value={state.style[key]} onChange={e => style(key, e.target.value)} /></label>)}
      </div></details>
    </fieldset>
  </>;
}

function JsPanel({ state, dispatch, run, busy }) {
  const blocked = !state.js || !state.nodes.length || (state.behavior === 'explode' && !state.css);
  return <>
    <Activation technology="JavaScript" enabled={state.js} disabled={!state.nodes.length} onChange={value => dispatch({ type: 'JS', value })} />
    {!state.nodes.length && <p className="inline-hint">Primeiro, adicione uma parte no HTML.</p>}
    <div className="section-title"><span>01 / ESCOLHA UMA RESPOSTA</span></div>
    <div className="behaviors" role="group" aria-label="Comportamento">{Object.entries(BEHAVIORS).map(([id, [, name, caption]]) => { const Icon = behaviorIcons[id]; return <button key={id} type="button" aria-pressed={state.behavior === id} className={state.behavior === id ? 'selected' : ''} onClick={() => dispatch({ type: 'BEHAVIOR', id })}><Icon size={20} /><span><strong>{name}</strong><small>{caption}</small></span><span className="radio-dot" /></button>; })}</div>
    <div className="run-area"><span className="mini-label">02 / AGORA, EXPERIMENTE</span><button type="button" className="primary-button" disabled={blocked || busy} onClick={run}><Play size={16} fill="currentColor" />{state.behavior === 'drag' ? 'Ativar o arraste' : `Testar: ${BEHAVIORS[state.behavior][1].toLowerCase()}`}<ArrowRight size={17} /></button><p>{!state.js ? 'Ative o JavaScript para a figurinha responder.' : state.behavior === 'explode' && !state.css ? 'Aplique CSS para visualizar as camadas.' : state.behavior === 'drag' ? 'Segure a figurinha e mova com o dedo.' : 'Você também pode usar o botão da figurinha.'}</p></div>
  </>;
}

function Sticker({ state, compare, flipped, exploded, outlines, onRun, stageRef, cardRef, fit, position, onPointerDown, onPointerMove, onPointerUp, motionRef }) {
  const film = FILMS[state.universe];
  const styled = state.css && !compare;
  const fields = { title: film.title, text: film.description, button: 'Explorar a figurinha', badge: film.badge, quote: film.quote, ...state.fields };
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [film.image]);
  const layers = state.layers;
  const composed = !state.customOrder && layers.layout && state.style.layout !== 'reverse' && !exploded && state.nodes.includes('image') && state.nodes.includes('title') && fields.title.trim().length > 0 && fields.title.length <= 32;
  const collectionNumber = String(Object.keys(FILMS).indexOf(state.universe) + 1).padStart(2, '0');
  const renderNode = id => {
    const common = { className: `card-node card-${id}`, 'data-tag': NODES[id][2] };
    switch (id) {
      case 'image': return <figure key={id} {...common}>{failed ? <div className="image-fallback"><Image size={30} /><span>Imagem indisponível</span></div> : <img src={film.image} alt={film.alt} draggable="false" onError={() => setFailed(true)} />}{styled && <figcaption>{film.studio}</figcaption>}</figure>;
      case 'title': return <h2 key={id} {...common}>{fields.title}</h2>;
      case 'text': return <p key={id} {...common}>{fields.text}</p>;
      case 'button': return <button key={id} {...common} type="button" aria-disabled={!state.js} onClick={onRun}>{fields.button}{styled && <ArrowUpRight size={17} />}</button>;
      case 'badge': return <span key={id} {...common}>{fields.badge}{styled && <Sparkles size={12} />}</span>;
      case 'characters': return <ul key={id} {...common}>{film.characters.map(character => <li key={character}>{character}</li>)}</ul>;
      case 'quote': return <blockquote key={id} {...common}>{fields.quote}</blockquote>;
      case 'divider': return <hr key={id} {...common} />;
      default: return null;
    }
  };
  return <div className="canvas-center" ref={stageRef}>
    {!state.nodes.length ? <div className="empty-art"><div className="empty-corner corner-tl" /><div className="empty-corner corner-tr" /><div className="empty-corner corner-bl" /><div className="empty-corner corner-br" /><div className="empty-symbol"><Plus strokeWidth={2.5} size={38} /></div><strong>Bora criar<br />sua figurinha?</strong><span>Escolha a primeira parte no HTML.</span><span className="empty-arrow" aria-hidden="true">↗</span></div> : <div className="fit-box" style={{ width: styled && layers.layout && state.style.layout === 'wide' ? 385 : 320, transform: `translate(${position.x}px, ${position.y}px) scale(${fit})` }}><div ref={motionRef} className="motion-box"><div className={`sticker-turn ${flipped ? 'is-flipped' : ''}`} style={{ '--rotation': `${styled && layers.frame ? state.style.rotation : 0}deg` }}>
      <article ref={cardRef} className={`sticker ${styled ? 'styled' : 'raw'} ${outlines ? 'show-outlines' : ''} ${exploded && styled ? 'exploded' : ''} ${styled && layers.colors ? 'has-colors' : ''} ${styled && layers.type ? 'has-type' : ''} ${styled && layers.frame ? 'has-frame' : ''} ${styled && layers.layout ? 'has-layout' : ''}`} data-look={state.style.look} data-font={state.style.font} data-filter={state.style.filter} data-layout={state.style.layout} data-composed={composed} data-dense={state.nodes.length > 5} data-custom-order={Boolean(state.customOrder)} aria-label="Sua figurinha" aria-hidden={flipped} inert={flipped || undefined} style={{ '--card-bg': state.style.background, '--accent': state.style.accent, '--ink': readableColor(state.style.background), '--accent-ink': readableColor(state.style.accent), '--radius': `${state.style.radius}px`, '--shadow': `${state.style.shadow}px`, '--title-size': `${state.style.size}px` }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {styled && <span className="sticker-shine" key={JSON.stringify([state.universe,state.style,state.layers])} aria-hidden="true"><i /></span>}
        {styled && <div className="sticker-top"><span>JÚLIA / STICKERS</span><span>{collectionNumber}</span></div>}
        <div className="card-content">{state.nodes.map(renderNode)}</div>
        {styled && <div className="sticker-bottom"><span>FEITA POR VOCÊ</span><span>COLEÇÃO {collectionNumber} / 05</span></div>}
      </article>
      <div className="sticker-back" aria-hidden={!flipped} inert={!flipped || undefined}><span className="mini-label">JÚLIA / COLLECTION — 001</span><img src={film.image} alt="" /><span className="back-star">✳</span><h2>Por trás<br />da ideia.</h2><div className="back-chips"><span>HTML</span><span>CSS</span><span>JS</span></div><button type="button" onClick={onRun}><Undo2 size={16} /> Voltar à frente</button></div>
    </div></div></div>}
  </div>;
}

export default function App() {
  const [state, baseDispatch] = useReducer(reduce, undefined, createState);
  const [compare, setCompare] = useState(false);
  const [outlines, setOutlines] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [fit, setFit] = useState(1);
  const [notice, setNotice] = useState('');
  const reduced = useReducedMotion();
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const motionRef = useRef(null);
  const activeAnimation = useRef(null);
  const drag = useRef(null);
  const runLock = useRef(false);
  const generation = useRef(0);
  const tabsRef = useRef([]);
  const studioRef = useRef(null);
  const focusButtonRef = useRef(null);
  const info = modeInfo[state.mode];

  const clearEffects = useCallback(() => {
    generation.current += 1;
    activeAnimation.current?.cancel();
    activeAnimation.current = null;
    runLock.current = false;
    drag.current = null;
    setBusy(false); setFlipped(false); setExploded(false); setPosition({ x: 0, y: 0 });
  }, []);

  const dispatch = useCallback(action => {
    clearEffects(); setCompare(false);
    if (action.type === 'RESET') { setOutlines(false); setNotice('Tudo pronto para uma nova ideia.'); }
    baseDispatch(action);
  }, [clearEffects]);

  useEffect(() => { if (!notice) return; const timeout = setTimeout(() => setNotice(''), 2800); return () => clearTimeout(timeout); }, [notice]);
  useEffect(() => () => { generation.current += 1; activeAnimation.current?.cancel(); }, []);
  useEffect(() => {
    const visibility = () => { if (document.hidden) clearEffects(); };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [clearEffects]);
  useEffect(() => {
    if (!focus) return;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusButtonRef.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { setFocus(false); return; }
      if (event.key !== 'Tab') return;
      const controls = [...studioRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, a[href]')].filter(el => !el.closest('[inert]') && !el.closest('fieldset:disabled') && el.getClientRects().length);
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = priorOverflow; document.removeEventListener('keydown', keydown); focusButtonRef.current?.focus(); };
  }, [focus]);

  useLayoutEffect(() => {
    if (!stageRef.current || !cardRef.current) return;
    const fitCard = () => {
      const stage = stageRef.current; const card = cardRef.current;
      if (!stage || !card) return;
      const radians = Math.abs(state.css && !compare && state.layers.frame ? state.style.rotation : 0) * Math.PI / 180;
      const extra = exploded ? 80 : 0;
      const w = card.offsetWidth * Math.cos(radians) + (card.offsetHeight + extra) * Math.sin(radians);
      const h = card.offsetWidth * Math.sin(radians) + (card.offsetHeight + extra) * Math.cos(radians);
      setFit(Math.max(.1, Math.min(1, (stage.clientWidth - 52) / w, (stage.clientHeight - 46) / h)));
    };
    fitCard();
    const observer = new ResizeObserver(fitCard);
    observer.observe(stageRef.current); observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [state.nodes, state.css, state.style, state.layers, compare, exploded, focus]);

  useEffect(() => {
    const card = cardRef.current;
    if (reduced || !state.css || compare || !card?.animate) return;
    const animation = card.animate([{scale:'.975',translate:'0 6px'},{scale:'1.012',translate:'0 -2px',offset:.65},{scale:'1',translate:'0 0'}],{duration:390,easing:'cubic-bezier(.2,.8,.2,1)'});
    return () => animation.cancel();
  },[state.css,state.universe,state.style,state.layers,compare,reduced]);

  const run = async () => {
    if (!state.js || !state.nodes.length) { setNotice('Ative o JavaScript no painel para dar vida à figurinha.'); return; }
    if (runLock.current) return;
    if (state.behavior === 'explode' && !state.css) { setNotice('Aplique o CSS para visualizar as camadas.'); return; }
    baseDispatch({ type: 'INTERACT' });
    if (state.behavior === 'flip') { setFlipped(value => !value); return; }
    if (state.behavior === 'explode') { setExploded(value => !value); return; }
    if (state.behavior === 'drag') { setNotice('Segure a figurinha e arraste.'); return; }
    if (state.behavior === 'next') {
      const ids = Object.keys(FILMS); baseDispatch({ type: 'UNIVERSE', id: ids[(ids.indexOf(state.universe) + 1) % ids.length] }); return;
    }
    const frames = {
      bounce: [{ transform: 'translateY(0)' }, { transform: 'translateY(-55px) rotate(-5deg)', offset: .4 }, { transform: 'translateY(0)' }],
      spin: [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }],
      fly: [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(55px,-35px) rotate(12deg)', offset: .35 }, { transform: 'translate(-45px,-20px) rotate(-8deg)', offset: .7 }, { transform: 'translate(0,0) rotate(0)' }],
    };
    if (reduced || !motionRef.current?.animate) { setNotice(`${BEHAVIORS[state.behavior][1]}: ação executada com movimento reduzido.`); return; }
    runLock.current = true; setBusy(true);
    const token = generation.current;
    const animation = motionRef.current.animate(frames[state.behavior], { duration: state.behavior === 'fly' ? 1000 : 700, easing: 'cubic-bezier(.22,.7,.2,1)' });
    activeAnimation.current = animation;
    try { await animation.finished; } catch { } finally { if (generation.current === token) { runLock.current = false; activeAnimation.current = null; setBusy(false); } }
  };

  const pointerDown = event => {
    if (!state.js || state.behavior !== 'drag' || event.target.closest('button') || event.button !== 0 || !event.isPrimary) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, initial: position, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = event => {
    const current = drag.current; if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x; const dy = event.clientY - current.y;
    current.moved ||= Math.hypot(dx, dy) > 4;
    const bounds = stageRef.current;
    const maxX = Math.max(0, (bounds.clientWidth - cardRef.current.offsetWidth * fit) / 2 - 16);
    const maxY = Math.max(0, (bounds.clientHeight - cardRef.current.offsetHeight * fit) / 2 - 16);
    setPosition({ x: Math.max(-maxX, Math.min(maxX, current.initial.x + dx)), y: Math.max(-maxY, Math.min(maxY, current.initial.y + dy)) });
  };
  const pointerUp = event => { if (drag.current?.id !== event.pointerId) return; if (drag.current.moved && event.type !== 'pointercancel') baseDispatch({ type: 'INTERACT' }); drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };

  const changeTab = mode => dispatch({ type: 'NAVIGATE', mode });
  const tabKeyDown = (event, index) => {
    const next = { ArrowRight: (index + 1) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2 }[event.key];
    if (next === undefined) return; event.preventDefault(); changeTab(modes[next]); tabsRef.current[next]?.focus();
  };

  return <div className="app-shell" data-mode={state.mode}>
    <header className="site-header flex items-center justify-between"><a className="brand flex items-center gap-3" href="./" aria-label="Júlia Studio, início"><span className="brand-mark">j<span>✦</span></span><span>júlia<span className="brand-slash">/</span><b>studio</b></span></a><span className="header-caption">Criar. Brincar. Entender.</span><button type="button" className="reset-button flex items-center gap-2" onClick={() => dispatch({ type: 'RESET' })}><RotateCcw size={16} /><span>Recomeçar</span></button></header>
    <main>
      <section className="intro"><div><div className="eyebrow flex items-center gap-2"><span className="live-dot" /> UM LABORATÓRIO DE IDEIAS</div><h1>Sua ideia.<br /><span>Ganha vida!</span><span className="title-asterisk" aria-hidden="true">✦</span></h1><p>Monte uma figurinha. Descubra como um site acontece.</p></div><div className="intro-stickers" aria-hidden="true"><div className="intro-sticker intro-stitch"><img src={FILMS.stitch.image} alt="" /><span>CRIATIVIDADE: ON</span></div><div className="intro-sticker intro-toy"><img src={FILMS.toy.image} alt="" /><span>AO INFINITO E ALÉM!</span></div><span className="intro-spark">✦</span><span className="intro-note">feito do seu jeito <svg viewBox="0 0 90 50" fill="none"><path d="M3 6c40 0 60 10 64 34m-14-9 15 11 9-15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span></div></section>
      <section ref={studioRef} className={`studio ${focus ? 'focus-mode' : ''}`} aria-label="Bancada de criação" role={focus ? 'dialog' : undefined} aria-modal={focus || undefined}>
        <nav className="technology-tabs" role="tablist" aria-label="Tecnologia">{modes.map((mode, index) => { const item = modeInfo[mode]; const Icon = item.icon; const done = mode === 'html' ? state.nodes.length > 0 : mode === 'css' ? state.css : state.js; return <button key={mode} type="button" ref={el => { tabsRef.current[index] = el; }} role="tab" id={`tab-${mode}`} aria-controls={`panel-${mode}`} aria-selected={state.mode === mode} tabIndex={state.mode === mode ? 0 : -1} className={`technology-tab ${state.mode === mode ? 'active' : ''}`} data-technology={mode} onClick={() => changeTab(mode)} onKeyDown={event => tabKeyDown(event, index)}><span className="tab-number">0{index + 1}</span><Icon className="tab-icon" size={19} /><span><strong>{item.name}</strong><small>{item.subtitle}</small></span><span className={`tab-status ${done ? 'done' : ''}`}>{done ? <Check size={12} /> : <ArrowUpRight size={16} />}</span></button>; })}</nav>
        <div className="workspace">
          <div className={`preview ${state.js && state.behavior === 'drag' ? 'can-drag' : ''}`}>
            <div className="preview-top"><span className="mono flex items-center gap-2"><span className="live-dot" /> SUA CRIAÇÃO, AO VIVO</span><div className="flex items-center gap-1"><IconButton label="Mostrar estrutura HTML" aria-pressed={outlines} disabled={!state.nodes.length} onClick={() => setOutlines(value => !value)}><Square size={15} /></IconButton><button type="button" ref={focusButtonRef} className="icon-button" aria-label={focus ? 'Sair do modo foco' : 'Modo foco'} aria-pressed={focus} onClick={() => setFocus(value => !value)}>{focus ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div></div>
            <span className="canvas-coordinate coordinate-left" aria-hidden="true">✦</span><span className="canvas-coordinate coordinate-right" aria-hidden="true">✳</span><span className="canvas-sticker" aria-hidden="true">100%<br /><b>sua ideia!</b></span>
            <Sticker state={state} compare={compare} flipped={flipped} exploded={exploded} outlines={outlines} onRun={run} stageRef={stageRef} cardRef={cardRef} fit={fit} position={position} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} motionRef={motionRef} />
            <div className="preview-bottom"><div className="status-chips"><span className={state.nodes.length ? 'active' : ''}><i />HTML</span><span className={state.css && !compare ? 'active' : ''}><i />CSS</span><span className={state.js ? 'active' : ''}><i />JS</span></div>{state.css ? <button className="compare-button" type="button" aria-pressed={compare} onClick={() => { clearEffects(); setCompare(value => !value); }}><Eye size={14} />{compare ? 'Voltar ao estilo' : 'Ver sem CSS'}</button> : <span className="preview-caption">{state.nodes.length ? 'Só o conteúdo. Sem estilo.' : 'O próximo passo é seu.'}</span>}</div>
            {state.js && <div className="action-feedback"><span>{state.interactions} {state.interactions === 1 ? 'interação' : 'interações'}</span><button type="button" onClick={clearEffects}><Undo2 size={12} />Centralizar</button></div>}
          </div>
          <aside className="tools"><div className="panel-intro"><span className="panel-kicker"><span>0{modes.indexOf(state.mode) + 1}</span> {info.name.toUpperCase()}</span><h2>{info.label}</h2><p>{info.description}</p></div><section key={state.mode} className="panel-content" role="tabpanel" id={`panel-${state.mode}`} aria-labelledby={`tab-${state.mode}`} tabIndex={0}>{state.mode === 'html' ? <HtmlPanel state={state} dispatch={dispatch} /> : state.mode === 'css' ? <CssPanel state={state} dispatch={dispatch} /> : <JsPanel state={state} dispatch={dispatch} run={run} busy={busy} />}</section><div className="panel-footer"><span>{state.mode === 'html' ? 'O HTML diz o que existe.' : state.mode === 'css' ? 'O CSS define como aparece.' : 'O JavaScript faz responder.'}</span><button type="button" onClick={() => { const index = (modes.indexOf(state.mode) + 1) % 3; changeTab(modes[index]); tabsRef.current[index]?.focus(); }}> {state.mode === 'js' ? 'Voltar ao HTML' : `Explorar ${modeInfo[modes[modes.indexOf(state.mode) + 1]].name}`}<ArrowRight size={15} /></button></div></aside>
        </div>
        <div className="studio-bottom"><span><span className="live-dot" /> EXPERIMENTE. COMPARE. DESCUBRA.</span><span>NENHUMA IDEIA NASCE PRONTA. <Sparkles size={12} /></span></div>
      </section>
      <footer className="site-footer"><span>JÚLIA STUDIO <span className="footer-divider">/</span> DO ZERO À SUA CRIAÇÃO.</span><a href={FILMS[state.universe].source} target="_blank" rel="noopener noreferrer">Créditos da ilustração <ArrowUpRight size={12} /></a></footer>
    </main>
    <StudioEffects reduced={reduced} />
    <div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite">{notice}</div>
  </div>;
}