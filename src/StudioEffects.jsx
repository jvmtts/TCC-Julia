import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function StudioEffects({ reduced }) {
  const [bursts, setBursts] = useState([]);
  const serial = useRef(0);
  useEffect(() => {
    const root = document.querySelector('.app-shell');
    let start = null;
    let lastTouch = null;
    const down = event => {
      const button = event.target.closest('button');
      if (event.pointerType !== 'touch' || !event.isPrimary || !button || button.disabled || button.classList.contains('part-handle') || button.closest('fieldset:disabled')) { start = null; return; }
      start = { button, id:event.pointerId, x:event.clientX, y:event.clientY };
    };
    const up = event => {
      const current = start;
      start = null;
      if (!current || current.id !== event.pointerId || !current.button.contains(event.target) || Math.hypot(event.clientX-current.x,event.clientY-current.y) > 12 || !current.button.isConnected) return;
      event.preventDefault();
      lastTouch = { button:current.button, time:performance.now() };
      current.button.click();
    };
    const cancel = () => { start = null; };
    const click = event => {
      if (event.detail > 0 && lastTouch && performance.now()-lastTouch.time < 750 && lastTouch.button.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    root?.addEventListener('pointerdown',down,true); root?.addEventListener('pointerup',up,true); root?.addEventListener('pointercancel',cancel,true); root?.addEventListener('click',click,true);
    return () => { root?.removeEventListener('pointerdown',down,true); root?.removeEventListener('pointerup',up,true); root?.removeEventListener('pointercancel',cancel,true); root?.removeEventListener('click',click,true); };
  },[]);
  useEffect(() => {
    if (reduced) { setBursts([]); return; }
    const timers = new Set();
    const animations = new Set();
    const buttons = new WeakMap();
    const root = document.querySelector('.app-shell');
    const click = event => {
      const button = event.target.closest('button');
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' || button.classList.contains('part-handle') || button.closest('fieldset:disabled')) return;
      const rect = button.getBoundingClientRect();
      const id = ++serial.current;
      const x = event.detail ? event.clientX : rect.left + rect.width / 2;
      const y = event.detail ? event.clientY : rect.top + rect.height / 2;
      setBursts(previous => [...previous.slice(-2),{ id, x, y }]);
      const timer = setTimeout(() => { timers.delete(timer); setBursts(previous => previous.filter(burst => burst.id !== id)); },650);
      timers.add(timer);
      if (typeof button.animate === 'function') {
        buttons.get(button)?.cancel();
        const animation = button.animate([{scale:'.96'},{scale:'1.035',offset:.6},{scale:'1'}],{duration:260,easing:'ease-out'});
        buttons.set(button,animation); animations.add(animation);
        animation.finished.catch(() => undefined).finally(() => animations.delete(animation));
      }
    };
    root?.addEventListener('click',click,true);
    return () => { root?.removeEventListener('click',click,true); timers.forEach(clearTimeout); animations.forEach(animation => animation.cancel()); };
  },[reduced]);
  return createPortal(<div className="feedback-layer" aria-hidden="true">{bursts.map(burst => <span className="choice-burst" key={burst.id} style={{left:burst.x,top:burst.y}}>{[[26,-23],[-26,-18],[22,20],[-23,22]].map(([x,y],index)=><i key={index} style={{'--travel-x':`${x}px`,'--travel-y':`${y}px`,'--spark-color':['#ffcf58','#bd98f2','#a9dfc0','#ffb69d'][index]}} />)}</span>)}</div>,document.body);
}
