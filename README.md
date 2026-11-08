# Órbita

Jogo web de categorias com tema espacial. A cada partida o jogador recebe 5 categorias e dá uma resposta para cada uma. Quanto mais rara a resposta, mais pontos — e mais longe a nave viaja pelo Sistema Solar.

Sem cadastro, sem login e sem limite de partidas: é só abrir e jogar.

## Como funciona

- Cada partida sorteia **5 categorias** de uma base local (ex.: "Animal que vive no mar", "País da América do Sul").
- O jogador digita uma resposta por categoria, com **cronômetro opcional**.
- Cada categoria tem uma lista de respostas aceitas, cada uma com um nível de raridade:

| Nível        | Pontos | Significado              |
| ------------ | ------ | ------------------------ |
| 🛰️ Satélite  | +10    | resposta comum           |
| ☄️ Cometa    | +20    | resposta incomum         |
| 💥 Supernova | +30    | resposta rara            |
| —            | 0      | fora da base ou em branco |

- As respostas são **normalizadas** antes da comparação (minúsculas, sem acentos, sem espaços extras), e sinônimos definidos na base também são aceitos.
- O total de pontos define o **planeta alcançado** (Lua, Marte, Júpiter, Saturno, Netuno...), com animação de viagem.
- A tela de resultado mostra os pontos, o planeta, a pontuação de cada resposta e as respostas mais raras possíveis de cada categoria.
- **Jogar de novo** sorteia novas categorias, sem limite.
- Histórico, recorde e planetas já alcançados ficam salvos no `localStorage`.

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
npm run build      # build de produção em dist/orbita/browser
```

## Estrutura

```
src/app/
  core/
    models/   tipos do domínio (Category, Answer, Rarity)
    data/     acesso às categorias (CategoryRepository e versão JSON)
    utils/    funções puras, como a normalização de respostas
  features/   telas do jogo (home, game, result, history)
  shared/     componentes e ilustrações reutilizáveis
public/data/categories.json   base de categorias
```

O jogo só conhece a classe `CategoryRepository`. Para trocar o JSON por uma API, basta criar outra implementação e registrá-la em `src/app/app.config.ts`.

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
- [ ] **Etapa 2** — Tela de jogo: sorteio das categorias, campos de resposta e cronômetro opcional
- [ ] **Etapa 3** — Pontuação e tela de resultado com planeta e animação
- [ ] **Etapa 4** — Histórico e recorde no `localStorage`, e botão de jogar de novo
- [ ] **Etapa 5** — Polimento (acessibilidade, sons opcionais, testes) e deploy

## Convenções de Git

- Commits em inglês no padrão [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`.
- Mensagens curtas, no imperativo e em minúsculas. Ex.: `feat: add planet animation on result screen`.
- Commits pequenos, um assunto por commit.
- Branches curtas e descritivas: `feat/category-draw`, `fix/score-rounding`, `chore/setup-tailwind`.
