# Órbita

Jogo web de categorias com tema espacial. A cada partida o jogador recebe 5 categorias e dá uma resposta para cada uma. Quanto mais rara a resposta, mais pontos — e mais longe a nave viaja pelo Sistema Solar.

Sem cadastro, sem login e sem limite de partidas: é só abrir e jogar.

## Como funciona

- Cada partida sorteia **5 categorias** de uma base local (ex.: "Animal que vive no mar", "País da América do Sul").
- As categorias aparecem **uma por vez** e o jogador digita uma resposta para cada uma, com **cronômetro opcional de 30 segundos por categoria**. Se o tempo acabar, vale o que estiver digitado.
- A pontuação de cada resposta aparece logo depois de responder, e o foguete sobe pela rota de planetas conforme os pontos ganhos: resposta rara voa longe, resposta que vale 0 faz o motor engasgar. Os planetas passam com o nome e a distância real até a Terra, e cada resposta mostra quantos km o foguete percorreu.
- No celular, a barra de resposta fica colada em cima do teclado, e o teclado não fecha durante a partida.
- Cada categoria tem uma lista de respostas aceitas, cada uma com um nível de raridade:

| Nível        | Pontos | Significado              |
| ------------ | ------ | ------------------------ |
| 🛰️ Satélite  | +10    | resposta comum           |
| ☄️ Cometa    | +20    | resposta incomum         |
| 💥 Supernova | +30    | resposta rara            |
| —            | 0      | fora da base ou em branco |

- As respostas são **normalizadas** antes da comparação (minúsculas, sem acentos, sem espaços extras), e sinônimos definidos na base também são aceitos.
- O total de pontos define o **destino alcançado**, com animação de viagem e uma curiosidade sobre o planeta:

| Pontos  | Destino         |
| ------- | --------------- |
| 0–19    | Órbita da Terra |
| 20–39   | Lua             |
| 40–59   | Marte           |
| 60–79   | Júpiter         |
| 80–99   | Saturno         |
| 100–119 | Urano           |
| 120–139 | Netuno          |
| 140–150 | Plutão          |

- A tela de resultado mostra os pontos, o planeta, a pontuação de cada resposta e as respostas mais raras possíveis de cada categoria.
- **Jogar de novo** sorteia novas categorias, sem limite.
- **Sons opcionais** (desligados por padrão), gerados no navegador, sem arquivos de áudio.
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
    { "text": "Peixe-boi", "rarity": "comet", "synonyms": ["manati"] },
    { "text": "Narval", "rarity": "supernova" }
  ]
}
```

`rarity` aceita `satellite`, `comet` ou `supernova`. O teste `categories-data.spec.ts` garante que cada categoria tenha os três níveis e nenhuma resposta repetida.

## Deploy

O deploy é feito pelo GitHub Pages a cada push na `main` (workflow em `.github/workflows/deploy.yml`), e também pode ser disparado manualmente na aba **Actions**. O workflow roda os testes, gera o build e publica em:

**https://leonardoletr.github.io/app_orbita/**

Configuração única no repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Princípios

- **Mobile-first** e legível em projetor.
- Interface em **pt-BR**; código, variáveis e comentários em inglês.
- Lógica de pontuação e acesso aos dados isolados em services, para no futuro trocar o JSON por um backend (turmas e alunos) sem reescrever o jogo.
- Identidade visual **100% original**: paleta própria e ilustrações SVG feitas para o projeto.

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
