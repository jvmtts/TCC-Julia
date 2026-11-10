# Júlia Studio

Laboratório de figurinhas para demonstrar conteúdo (HTML), aparência (CSS) e comportamento (JavaScript). Interface em React 19, Tailwind CSS 4 e Vite 7. Imagens locais em WebP; a página não depende de serviços externos durante a apresentação.

## Rodar localmente

Use Node.js 22.12 ou superior. Na pasta do projeto:

```powershell
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite. Se a porta 4173 já estiver ocupada, ele informa a próxima disponível. Mantenha o terminal aberto. Para escolher outra porta:

```powershell
npm run dev -- --port 4178
```

## Fluxo da apresentação

1. O início fica vazio. No HTML, escolha um personagem e adicione imagem, título, texto, botão e outras partes. Os elementos aparecem sem estilo. Edição e reordenação são opcionais.
2. Abrir a aba CSS apenas muda o painel. Use **Aplicar CSS** para transformar a figurinha. Experimente acabamentos e desligue individualmente cores, tipografia, moldura e composição. Filtros, paletas e formatos usam escolhas visuais, sem menus nativos. O texto do botão e do corpo se adapta às cores escolhidas para manter contraste. **Ver sem CSS** compara com a estrutura original sem perder ajustes.
3. Abrir JavaScript também preserva os recursos desligados. Use **Ativar JS**, escolha uma resposta e pressione **Testar**. Escolher uma resposta não executa a ação. O botão da figurinha executa a resposta escolhida.
4. Recomeçar esvazia a figurinha, desliga CSS/JS e volta ao HTML. O personagem é mantido. Remover a última parte também desliga os recursos, sem recolocar partes automaticamente.

Na composição com imagem e título curto, o título aparece sobre a imagem. Títulos longos passam para uma área própria. Partes adicionais são agrupadas com o botão ao final; desligar CSS revela a ordem original do HTML.

Trocar de personagem altera somente o conteúdo; cores e estilos personalizados são preservados. Arrastar funciona pelo toque ou mouse; usar o teclado para executar as demais ações continua disponível. Camadas requer CSS ativo. O modo Foco mantém a prévia junto das ferramentas; Escape encerra o modo. A preferência por movimento reduzido é respeitada.

Os controles da bancada usam JavaScript para demonstrar as três tecnologias. O interruptor de JS controla os comportamentos da figurinha, não o JavaScript de toda a aplicação.

## Verificar e gerar a entrega

```powershell
npm run check
npm test
npm run build
npm run preview
```

Os testes de estado cobrem montagem, reordenação, edição, valores inválidos, limites, navegação sem ativação, preservação dos dados, ativação explícita e reinício. O build gera `dist/`, pronta para hospedagem estática. O projeto permanece local; esta revisão não publica o site.

## Organização

- `scene.mjs`: dados e regras de estado puras, verificadas com o test runner do Node.
- `src/App.jsx`: bancada, painéis e figurinha; efeitos transitórios separados do conteúdo.
- `src/styles.css`: Tailwind e direção cartunesca responsiva, com alternativas para movimento reduzido.
- `src/sticker.css`: apresentação da figurinha, comparação sem estilo e efeitos de camadas.
- `src/StyleChoices.jsx` e `src/style-choices.css`: filtros com prévias, paletas e formatos.
- `src/colors.mjs`: cálculo de contraste e escolha de texto claro ou escuro.
- `public/assets`: imagens e créditos.

Créditos em `public/assets/CREDITS-ANIMATION.md`. Personagens e artes pertencem aos respectivos titulares. Demonstração acadêmica.
