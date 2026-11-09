# Astropalavra

Jogo web de categorias com tema espacial. A cada partida o jogador recebe 7 categorias e dá uma resposta para cada uma. Quanto mais rara a resposta, mais pontos — e mais longe a nave viaja pelo Sistema Solar.

Sem cadastro, sem login e sem limite de partidas: é só abrir e jogar.

## Como funciona

- Cada partida sorteia **7 categorias** de uma base local com **42 categorias** e cerca de **2.700 respostas** (ex.: "Animal que vive no mar", "País da África", "Constelação", "Dinossauro", "Brincadeira de criança").
- As categorias aparecem **uma por vez** e o jogador digita uma resposta para cada uma, com **cronômetro opcional de 30 segundos por categoria**. Se o tempo acabar, vale o que estiver digitado.
- Cada categoria aparece num **cartão** no topo da tela. Ao responder, o cartão vira e mostra o nível, os pontos e quantos km o foguete percorreu; depois o próximo cartão entra e o anterior sai voando. Como o cartão fica no topo, o resultado aparece mesmo com o teclado do celular aberto.
- O foguete sobe pela rota de planetas conforme os pontos ganhos: resposta rara voa longe, resposta que vale 0 faz o motor engasgar. Os planetas passam enormes, saindo pela borda da tela, para mostrar o tamanho deles perto do foguete, com o nome e a distância real até a Terra.
- No celular, a barra de resposta fica colada em cima do teclado, e o teclado não fecha durante a partida.
- O céu corre sem parar atrás do foguete, com a chama acesa, para ele parecer sempre em voo. O cenário não muda de tamanho quando o teclado abre ou fecha.
- Cada categoria tem uma lista de respostas aceitas, cada uma com um nível de raridade:

| Nível     | Pontos | Significado               |
| --------- | ------ | ------------------------- |
| Satélite  | +10    | resposta comum            |
| Meteorito | +25    | pouco comum               |
| Cometa    | +50    | incomum                   |
| Pulsar    | +75    | rara                      |
| Supernova | +100   | raríssima                 |
| —         | 0      | fora da base ou em branco |

- As respostas são **normalizadas** antes da comparação (minúsculas, sem acentos, sem espaços extras), e sinônimos definidos na base também são aceitos.
- Resposta fora da base não encerra a categoria: o jogo pede para **tentar de novo** até o tempo acabar (ou até a criança pular). Erro de **uma letra** em palavras de 4 letras ou mais é corrigido automaticamente, e o jogo mostra a grafia certa.
- O total de pontos define o **destino alcançado**, com animação de viagem e uma curiosidade sobre o planeta:

| Pontos  | Destino         |
| ------- | --------------- |
| 0–39    | Órbita da Terra |
| 40–99   | Lua             |
| 100–179 | Marte           |
| 180–269 | Júpiter         |
| 270–369 | Saturno         |
| 370–479 | Urano           |
| 480–599 | Netuno          |
| 600–700 | Plutão          |

- A tela de resultado mostra o foguete chegando em órbita do planeta alcançado, os pontos e quanto faltou para o próximo destino, um gráfico das últimas partidas com a média, cada resposta com o seu nível e as respostas mais raras possíveis de cada categoria.
- O resultado pode ser **compartilhado** pelo menu do celular, ou copiado quando o navegador não tem esse menu.
- **Jogar de novo** sorteia novas categorias, sem limite.
- **Sons e música opcionais** (desligados por padrão), gerados no navegador, sem arquivos de áudio: efeitos para cada nível, ronco do motor durante o voo e uma música espacial de fundo.
- Histórico (últimas 50 partidas), recorde, destinos alcançados e a preferência do cronômetro ficam salvos no `localStorage`, só no aparelho do jogador.

## Stack

- [Angular](https://angular.dev) (versão estável mais recente) com standalone components e signals
- [Tailwind CSS](https://tailwindcss.com)
- Animações em CSS, sem dependências pesadas
- Base de categorias em JSON dentro do projeto (sem backend)
- Deploy estático (Vercel, Netlify ou GitHub Pages)

## Como rodar

Requer Node.js 22 ou superior.

```bash
npm install
npm start          # abre em http://localhost:4200
npm test           # testes unitários (Vitest)
npm run e2e        # testes de ponta a ponta (Playwright, tela de celular)
npm run build      # build de produção em dist/orbita/browser
```

## Estrutura

```
src/app/
  core/
    models/   tipos do domínio (Category, Answer, Rarity)
    data/     acesso aos dados (CategoryRepository, ProgressRepository e versões locais)
    utils/    funções puras, como a normalização de respostas
  features/   telas do jogo (home, game, result, history)
  shared/     componentes e ilustrações reutilizáveis
public/data/categories.json   base de categorias
```

O jogo só conhece as classes `CategoryRepository` (categorias) e `ProgressRepository` (histórico e recorde). Para trocar o JSON e o `localStorage` por uma API, basta criar outras implementações e registrá-las em `src/app/app.config.ts`.

### Formato da base

```json
{
  "id": "sea-animal",
  "title": "Animal que vive no mar",
  "answers": [
    { "text": "Tubarão", "rarity": "satellite" },
    { "text": "Foca", "rarity": "meteorite" },
    { "text": "Peixe-boi", "rarity": "comet", "synonyms": ["manati"] },
    { "text": "Coral", "rarity": "pulsar" },
    { "text": "Narval", "rarity": "supernova" }
  ]
}
```

`rarity` aceita `satellite`, `meteorite`, `comet`, `pulsar` ou `supernova`. O teste `categories-data.spec.ts` garante que cada categoria tenha os cinco níveis e nenhuma resposta repetida.

## Deploy

O deploy é feito pelo GitHub Pages a cada push na `main` (workflow em `.github/workflows/deploy.yml`), e também pode ser disparado manualmente na aba **Actions**. O workflow roda os testes, gera o build e publica em:

**https://leonardoletr.github.io/app_orbita/**

Configuração única no repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Princípios

- **Mobile-first** e legível em projetor.
- Interface em **pt-BR**; código, variáveis e comentários em inglês.
- Lógica de pontuação e acesso aos dados isolados em services, para no futuro trocar o JSON por um backend (turmas e alunos) sem reescrever o jogo.
- Identidade visual **100% original**, em estilo de fliperama: letras grossas com contorno (Lilita One e Nunito), cartões que parecem figurinhas, paleta própria e ilustrações SVG feitas para o projeto.

## Roadmap

- [x] **Etapa 1** — Setup do Angular com Tailwind, estrutura de pastas e base JSON com pelo menos 20 categorias
- [x] **Etapa 2** — Tela de jogo: sorteio das categorias, uma categoria por vez, cronômetro opcional e pontuação
- [x] **Etapa 3** — Tela de resultado com planeta, animação de viagem e respostas mais raras
- [x] **Etapa 4** — Histórico, recorde e coleção de destinos no `localStorage`, e botão de jogar de novo
- [x] **Etapa 5** — Polimento (acessibilidade, sons opcionais, testes) e deploy

## Convenções de Git

- Commits em inglês no padrão [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`.
- Mensagens curtas, no imperativo e em minúsculas. Ex.: `feat: add planet animation on result screen`.
- Commits pequenos, um assunto por commit.
- Branches curtas e descritivas: `feat/category-draw`, `fix/score-rounding`, `chore/setup-tailwind`.
