export const FILMS = Object.freeze({
  toy: { name: 'Toy Story', studio: 'DISNEY / PIXAR', image: './assets/toy.webp', source: 'https://movies.disney.com/toy-story', title: 'Toy Story', description: 'Amizade que vai além do infinito.', characters: ['Woody', 'Buzz', 'Rex'], accent: '#f9ce59', background: '#183b65', badge: 'AO INFINITO', quote: 'Toda grande aventura começa com uma ideia.', alt: 'Woody e Buzz Lightyear no quarto de Andy, em Toy Story' },
  stitch: { name: 'Lilo & Stitch', studio: 'DISNEY ANIMATION', image: './assets/stitch.webp', source: 'https://movies.disney.com/lilo-stitch', title: 'Lilo & Stitch', description: 'Uma conexão de outro planeta.', characters: ['Lilo', 'Stitch', 'Nani'], accent: '#ffb8ab', background: '#154b50', badge: 'OHANA', quote: 'As melhores ideias ficam melhores juntas.', alt: 'Lilo, Stitch e amigas dançando hula na animação Lilo & Stitch' },
  flintstones: { name: 'Os Flintstones', studio: 'HANNA-BARBERA', image: './assets/flintstones.webp', source: 'https://www.wvxu.org/media/2019-08-13/yabba-dabba-do-the-flinstones-coming-to-metv', title: 'Os Flintstones', description: 'Uma amizade da idade da pedra.', characters: ['Fred', 'Barney', 'Wilma'], accent: '#ffb65b', background: '#234953', badge: 'YABBA DABBA DOO!', quote: 'Ideias novas. Amigos de longa data.', alt: 'Fred Flintstone e Barney Rubble sorrindo, com fundo azul' },
  garfield: { name: 'Garfield', studio: 'GARFIELD / PAWS', image: './assets/garfield.webp', source: 'https://www.peacocktv.com/watch-online/tv/garfield-and-friends/8688578805012927112', title: 'Garfield', description: 'Criatividade com uma pitada de preguiça.', characters: ['Garfield', 'Odie', 'Jon'], accent: '#ffb247', background: '#343052', badge: 'MODO SONECA', quote: 'Uma pausa também faz parte da criação.', alt: 'Garfield e Odie pulando juntos, com fundo turquesa' },
  heman: { name: 'He-Man', studio: 'FILMATION / MATTEL', image: './assets/heman.webp', source: 'https://www.independent.co.uk/arts-entertainment/films/news/heman-directors-aaron-adam-nee-masters-universe-mattel-eternia-power-grayskull-a8314176.html', title: 'He-Man', description: 'O poder de criar está nas suas mãos.', characters: ['He-Man', 'Teela', 'Gato Guerreiro'], accent: '#bcacff', background: '#302550', badge: 'PELO PODER DE GRAYSKULL', quote: 'Uma ideia pode transformar um universo.', alt: 'He-Man clássico segurando a Espada do Poder, com um brilho ao fundo' }
});

export const NODES = Object.freeze({ image: ['▧', 'Ilustração', 'figure'], title: ['T', 'Título', 'h2'], text: ['≡', 'Texto', 'p'], button: ['↗', 'Botão', 'button'], badge: ['◇', 'Selo', 'span'], characters: ['☷', 'Personagens', 'ul'], quote: ['“', 'Frase', 'blockquote'], divider: ['—', 'Divisor', 'hr'] });
export const BEHAVIORS = Object.freeze({ flip: ['⤾', 'Virar', 'Descobrir o verso'], drag: ['↔', 'Arrastar', 'Mover com o toque'], explode: ['▱', 'Camadas', 'Separar e reunir'], bounce: ['↟', 'Pular', 'Um salto na cena'], spin: ['⟳', 'Girar', 'Uma volta completa'], fly: ['➶', 'Passear', 'Um pequeno voo'], next: ['⇄', 'Surpresa', 'Outro desenho na coleção'] });
const numeric = { radius: [0, 40], shadow: [0, 40], rotation: [-12, 12], size: [24, 48] };
const options = { look: ['cinema','glass','comic','minimal'], font: ['cinema','rounded','serif','mono'], filter: ['original','vivid','mono','vintage'], layout: ['poster','wide','reverse'] };
const own = (object, key) => Object.hasOwn(object, key);

export function createState(universe = 'toy') {
  const film = own(FILMS,universe) ? FILMS[universe] : FILMS.toy;
  return { universe: own(FILMS, universe) ? universe : 'toy', nodes: [], fields: {}, css: false, js: false, behavior: 'flip', interactions: 0, style: { look: 'cinema', font: 'cinema', filter: 'original', layout: 'poster', accent: film.accent, background: film.background, radius: 6, shadow: 24, rotation: -3, size: 30 } };
}

export function reduce(state, action) {
  if (!action || typeof action.type !== 'string') return state;
  switch (action.type) {
    case 'UNIVERSE': {
      if (!own(FILMS, action.id)) return state;
      const film = FILMS[action.id];
      return { ...state, universe: action.id, style: { ...state.style, accent: film.accent, background: film.background } };
    }
    case 'TOGGLE_NODE':
      if (!own(NODES, action.id)) return state;
      return { ...state, nodes: state.nodes.includes(action.id) ? state.nodes.filter(id => id !== action.id) : [...state.nodes, action.id] };
    case 'CLEAR': return { ...state, nodes: [] };
    case 'RESTORE': return { ...state, nodes: ['image','badge','title','text','button'] };
    case 'MOVE': {
      if (![1,-1].includes(action.direction)) return state;
      const index = state.nodes.indexOf(action.id);
      const target = index + action.direction;
      if (index < 0 || target < 0 || target >= state.nodes.length) return state;
      const nodes = [...state.nodes];
      [nodes[index], nodes[target]] = [nodes[target], nodes[index]];
      return { ...state, nodes };
    }
    case 'FIELD': {
      const limits = { title: 60, text: 110, button: 28, badge: 28, quote: 110 };
      if (!own(limits, action.key) || typeof action.value !== 'string') return state;
      return { ...state, fields: { ...state.fields, [action.key]: action.value.slice(0, limits[action.key]) } };
    }
    case 'STYLE': {
      let value = action.value;
      if (own(numeric, action.key)) {
        value = Number(value);
        if (!Number.isFinite(value)) return state;
        const [min, max] = numeric[action.key];
        value = Math.min(max, Math.max(min, value));
      } else if (own(options, action.key)) {
        if (!options[action.key].includes(value)) return state;
      } else if (['accent','background'].includes(action.key)) {
        if (typeof value !== 'string' || !/^#[a-f\d]{6}$/i.test(value)) return state;
      } else return state;
      return { ...state, style: { ...state.style, [action.key]: value } };
    }
    case 'CSS': return { ...state, css: Boolean(action.value) };
    case 'JS': return { ...state, js: Boolean(action.value) };
    case 'BEHAVIOR': return own(BEHAVIORS, action.id) ? { ...state, behavior: action.id } : state;
    case 'INTERACT': return state.js ? { ...state, interactions: Math.min(Number.MAX_SAFE_INTEGER, state.interactions + 1) } : state;
    case 'RESET': return createState(state.universe);
    default: return state;
  }
}
