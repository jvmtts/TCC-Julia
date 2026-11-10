import { Check, Image, LayoutTemplate, ArrowDownUp } from 'lucide-react';
import { PALETTES } from './colors.mjs';

const filters = [
  ['original', 'Original'],
  ['vivid', 'Vibrante'],
  ['mono', 'Preto e branco'],
  ['vintage', 'Retrô'],
];
const layouts = [
  ['poster', 'Figurinha', Image],
  ['wide', 'Paisagem', LayoutTemplate],
  ['reverse', 'Imagem no final', ArrowDownUp],
];

export default function StyleChoices({ state, film, onStyle }) {
  const applyPalette = palette => {
    onStyle('background', palette.background);
    onStyle('accent', palette.accent);
  };
  const changeColor = (key, value) => {
    if (state.style[key] !== value) onStyle(key, value);
  };

  return <>
    <div className="section-title">PALETA DE CORES</div>
    <div className="palette-options" role="group" aria-label="Paleta de cores">
      {PALETTES.map(palette => {
        const selected = state.style.accent === palette.accent && state.style.background === palette.background;
        return <button type="button" key={palette.name} aria-pressed={selected} onClick={() => applyPalette(palette)}>
          <span className="palette-swatch" style={{ background: palette.background }}><i style={{ background: palette.accent }} />{selected && <span className="choice-check"><Check size={11} /></span>}</span>
          <span>{palette.name}</span>
        </button>;
      })}
    </div>
    <div className="section-title">FILTRO DA IMAGEM</div>
    <div className="image-filters" role="group" aria-label="Filtro da imagem">
      {filters.map(([id, name]) => <button type="button" key={id} data-filter={id} aria-pressed={state.style.filter === id} onClick={() => onStyle('filter', id)}>
        <span><img src={film.image} alt="" draggable="false" />{state.style.filter === id && <i className="choice-check"><Check size={11} /></i>}</span>
        <strong>{name}</strong>
      </button>)}
    </div>
    <div className="section-title">COMPOSIÇÃO</div>
    <div className="format-choices" role="group" aria-label="Formato da figurinha">
      {layouts.map(([id, name, Icon]) => <button type="button" key={id} aria-pressed={state.style.layout === id} onClick={() => onStyle('layout', id)}>
        <span className={`format-preview format-${id}`}><Icon size={20} /></span><strong>{name}</strong>{state.style.layout === id && <Check size={12} />}
      </button>)}
    </div>
    <details className="custom-colors">
      <summary>Cores personalizadas</summary>
      <div className="color-controls">
        <label>Destaque<input aria-label="Cor de destaque" type="color" value={state.style.accent} onInput={event => changeColor('accent', event.target.value)} onChange={event => changeColor('accent', event.target.value)} /></label>
        <label>Fundo<input aria-label="Cor de fundo" type="color" value={state.style.background} onInput={event => changeColor('background', event.target.value)} onChange={event => changeColor('background', event.target.value)} /></label>
      </div>
      <p>O texto se adapta para continuar legível.</p>
    </details>
  </>;
}
