# Júlia Studio — laboratório de figurinhas

Experiência visual para apresentar HTML, CSS e JavaScript na escola. Feita com as três tecnologias, sem dependências de execução. Prioriza celular e também funciona no computador.

## Iniciar

Na pasta do projeto, com Node.js 20 ou superior:

```powershell
npm run dev
```

Abra o endereço mostrado no terminal, normalmente http://127.0.0.1:4173. Para ver esta atualização, encerre o servidor anterior com Ctrl+C, execute o comando novamente e atualize a página com Ctrl+F5. Não precisa instalar pacotes.

Se a porta estiver ocupada por outra sessão do projeto, use o endereço da sessão existente ou encerre essa sessão no próprio terminal. Também é possível escolher outra porta:

```powershell
$env:PORT = '4174'
npm run dev
```

## Usar na apresentação

O site abre no HTML com a figurinha vazia e crua. A primeira visita ao CSS liga o estilo; a primeira visita ao JavaScript liga as interações. As partes montadas são preservadas. Reiniciar retorna ao início vazio. Depois da primeira ativação, os interruptores mantêm a escolha manual.


- **HTML:** esvazie a figurinha e adicione as partes manualmente. O painel mostra quais elementos estão presentes. A edição de texto mostra apenas os campos das partes adicionadas; edição e ordem ficam recolhidas inicialmente.
- **CSS:** escolha Toy Story, Lilo & Stitch, Os Flintstones, Garfield ou He-Man. Experimente acabamento, amostras de fontes, cores, filtros, formato e ajustes finos. A troca de desenho aplica um tema completo e mantém as partes e os textos personalizados. A imagem continua sendo conteúdo de um elemento HTML; fontes, moldura, cores e efeitos visuais são CSS.
- **JavaScript:** toque numa ação para experimentá-la imediatamente; o botão Testar repete a ação. Virar e separar camadas são reversíveis. Em Arrastar, segure a figurinha para movê-la. Desligar interações bloqueia as ações da figurinha.
- **Estrutura:** mostra os elementos HTML na própria figurinha. **Foco:** mantém a prévia e as ferramentas visíveis numa bancada que ocupa a tela; Escape sai desse modo.

A montagem não usa temporizadores para recolocar elementos. Trocar cores ou desenhos preserva uma figurinha vazia. As mudanças visuais dão retorno ao toque, e a preferência do sistema por movimento reduzido é respeitada.

## Verificação e build

```powershell
npm run check
npm test
npm run build
```

Os testes verificam montagem, ordenação, preservação de conteúdo, limites dos estilos e o servidor HTTP. O build copia somente os arquivos públicos necessários para `dist/`. O servidor bloqueia acesso a arquivos internos do projeto.

Os arquivos `index.html`, `styles.css`, `app.js` e `scene.mjs` separam estrutura, aparência, interação e regras de estado. As imagens são locais e otimizadas em WebP; as fontes têm alternativas locais quando o Google Fonts está indisponível.

Créditos das imagens em `assets/CREDITS-ANIMATION.md`. Personagens e artes pertencem aos respectivos titulares; o projeto é uma demonstração acadêmica.
