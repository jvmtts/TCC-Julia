import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Image, Type, Code2, MousePointer2, Tag, List, Quote, Minus } from 'lucide-react';
import { NODES } from '../scene.mjs';
import './sortable-parts.css';

const icons = { image: Image, title: Type, text: Code2, button: MousePointer2, badge: Tag, characters: List, quote: Quote, divider: Minus };
const sameOrder = (a, b) => a.length === b.length && a.every((id, index) => b[index] === id);

function scrollContainer(element) {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) return parent;
  }
  return document.scrollingElement;
}

export default function SortableParts({ nodes, onReorder }) {
  const [draft, setDraft] = useState(null);
  const [lifted, setLifted] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [message, setMessage] = useState('');
  const listRef = useRef(null);
  const session = useRef(null);
  const draftRef = useRef(nodes);
  const positions = useRef(new Map());
  const rowAnimations = useRef(new Map());
  const frame = useRef(0);
  const helpId = useId();
  const order = draft || nodes;

  function announce(id, index) { setMessage(`${NODES[id][1]}, posição ${index + 1} de ${nodes.length}.`); }

  function moveTo(index) {
    const current = session.current;
    if (!current) return;
    const from = draftRef.current.indexOf(current.id);
    const to = Math.max(0, Math.min(draftRef.current.length - 1, index));
    if (from === to) return;
    const next = draftRef.current.filter(id => id !== current.id);
    next.splice(to, 0, current.id);
    draftRef.current = next;
    setDraft(next);
    announce(current.id, to);
  }

  function locate(y) {
    const current = session.current;
    if (!current) return;
    const others = [...listRef.current.querySelectorAll('[data-part]')].filter(row => row.dataset.part !== current.id);
    const top = listRef.current.getBoundingClientRect().top;
    const index = others.findIndex(row => y < top + row.offsetTop + row.offsetHeight / 2);
    moveTo(index < 0 ? others.length : index);
  }

  function finish(cancelled = false) {
    const current = session.current;
    if (!current) return;
    session.current = null;
    cancelAnimationFrame(frame.current);
    if (current.pointerId !== undefined && listRef.current?.hasPointerCapture(current.pointerId)) listRef.current.releasePointerCapture(current.pointerId);
    if (current.active) {
      if (!cancelled && !sameOrder(current.original, draftRef.current)) onReorder([...draftRef.current]);
      setMessage(cancelled ? 'Movimento cancelado. A ordem anterior foi mantida.' : `${NODES[current.id][1]} na posição ${draftRef.current.indexOf(current.id) + 1}. Ordem atualizada.`);
    }
    setDraft(null); setLifted(null); setGhost(null);
  }

  function autoScroll() {
    const current = session.current;
    if (!current?.active || current.keyboard || !listRef.current) return;
    const container = scrollContainer(listRef.current);
    const page = container === document.scrollingElement;
    const rect = page ? { top: 0, bottom: innerHeight } : container.getBoundingClientRect();
    const preview = matchMedia('(max-width: 760px)').matches ? document.querySelector('.preview')?.getBoundingClientRect() : null;
    const top = Math.max(0, rect.top, preview && preview.top <= 1 ? preview.bottom : 0);
    const bottom = Math.min(innerHeight, rect.bottom);
    const speed = current.y < top + 52 ? -Math.min(13, (top + 52 - current.y) / 4) : current.y > bottom - 52 ? Math.min(13, (current.y - bottom + 52) / 4) : 0;
    if (speed) { container.scrollTop += speed; locate(current.y); }
    frame.current = requestAnimationFrame(autoScroll);
  }

  function pointerDown(event, id) {
    if (!event.isPrimary || event.button !== 0 || nodes.length < 2 || session.current) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    const rect = event.currentTarget.closest('[data-part]').getBoundingClientRect();
    draftRef.current = [...nodes];
    session.current = { id, original: [...nodes], pointerId: event.pointerId, startY: event.clientY, y: event.clientY, offset: event.clientY - rect.top, left: rect.left, width: rect.width, active: false };
    listRef.current.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    current.y = event.clientY;
    if (!current.active && Math.abs(current.y - current.startY) < 5) return;
    event.preventDefault();
    if (!current.active) { current.active = true; setLifted(current.id); setDraft([...nodes]); frame.current = requestAnimationFrame(autoScroll); }
    setGhost({ id: current.id, left: current.left, top: current.y - current.offset, width: current.width });
    locate(current.y);
  }

  function keyDown(event, id) {
    if (event.key === 'Escape' && session.current) { event.preventDefault(); event.stopPropagation(); finish(true); return; }
    const current = session.current;
    if ([' ', 'Enter'].includes(event.key)) {
      event.preventDefault();
      if (current?.keyboard) finish();
      else if (!current && nodes.length > 1) {
        draftRef.current = [...nodes];
        session.current = { id, original: [...nodes], active: true, keyboard: true };
        setDraft([...nodes]); setLifted(id);
        setMessage(`${NODES[id][1]} selecionado. Use as setas para mover e Enter para soltar.`);
      }
    } else if (current?.keyboard && current.id === id && ['ArrowUp','ArrowDown','Home','End'].includes(event.key)) {
      event.preventDefault();
      const index = draftRef.current.indexOf(id);
      moveTo(event.key === 'Home' ? 0 : event.key === 'End' ? nodes.length - 1 : index + (event.key === 'ArrowUp' ? -1 : 1));
    } else if (event.key === 'Tab' && current?.keyboard) finish();
  }

  useLayoutEffect(() => {
    const next = new Map();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    listRef.current?.querySelectorAll('[data-part]').forEach(row => {
      const id = row.dataset.part;
      const top = row.offsetTop;
      next.set(id, top);
      const previous = positions.current.get(id);
      rowAnimations.current.get(id)?.cancel();
      if (!reduced && previous !== undefined && previous !== top && id !== lifted) {
        const animation = row.animate([{ transform: `translateY(${previous - top}px)` }, { transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
        rowAnimations.current.set(id, animation);
      }
    });
    positions.current = next;
    if (session.current?.keyboard) listRef.current.querySelector(`[data-part="${session.current.id}"] button`)?.focus({ preventScroll: true });
  }, [order, lifted]);

  useEffect(() => {
    if (session.current && !sameOrder(session.current.original, nodes)) finish(true);
  }, [nodes]);

  useEffect(() => {
    const cancel = () => finish(true);
    const visibility = () => { if (document.hidden) finish(true); };
    const key = event => { if (event.key === 'Escape' && session.current && !session.current.keyboard) { event.preventDefault(); event.stopPropagation(); finish(true); } };
    window.addEventListener('blur', cancel); window.addEventListener('keydown', key, true); document.addEventListener('visibilitychange',visibility);
    return () => { window.removeEventListener('blur', cancel); window.removeEventListener('keydown', key, true); document.removeEventListener('visibilitychange',visibility); cancelAnimationFrame(frame.current); rowAnimations.current.forEach(animation => animation.cancel()); };
  }, []);

  const GhostIcon = ghost ? icons[ghost.id] : null;
  return <div className="parts-organizer">
    <p className="order-help" id={helpId}><GripVertical size={16} />Segure a alça e leve a parte para onde quiser.<span className="sr-only">No teclado, pressione Espaço para selecionar, use as setas e Enter para soltar. Escape cancela.</span></p>
    <ol ref={listRef} className={`parts-list ${lifted ? 'is-sorting' : ''}`} aria-label="Ordem das partes" onPointerMove={pointerMove} onPointerUp={event => { if (session.current?.pointerId === event.pointerId) finish(); }} onPointerCancel={() => finish(true)} onLostPointerCapture={() => { if (session.current?.pointerId !== undefined) finish(true); }}>
      {order.map((id, index) => { const Icon = icons[id]; return <li className={`part-row ${lifted === id ? 'is-lifted' : ''} ${lifted === id && ghost ? 'is-placeholder' : ''}`} key={id} data-part={id}>
        <span className="part-number" aria-hidden="true">{String(index + 1).padStart(2,'0')}</span><span className="part-symbol" aria-hidden="true"><Icon size={17} /></span><strong>{NODES[id][1]}</strong>
        <button className="part-handle" type="button" disabled={nodes.length < 2} aria-label={`Mover ${NODES[id][1]}`} aria-describedby={helpId} aria-pressed={lifted === id} onPointerDown={event => pointerDown(event,id)} onKeyDown={event => keyDown(event,id)}><GripVertical size={22} /></button>
      </li>; })}
      {!nodes.length && <li className="parts-empty">Adicione as primeiras partes para organizar.</li>}
    </ol>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{message}</div>
    {ghost && createPortal(<div className="part-row part-ghost" style={{ left: ghost.left, top: ghost.top, width: ghost.width }} aria-hidden="true"><span className="part-symbol"><GhostIcon size={18} /></span><strong>{NODES[ghost.id][1]}</strong><GripVertical size={22} /></div>,document.body)}
  </div>;
}
