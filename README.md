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

## Princípios

- **Mobile-first** e legível em projetor.
- Interface em **pt-BR**; código, variáveis e comentários em inglês.
- Lógica de pontuação e acesso aos dados isolados em services, para no futuro trocar o JSON por um backend (turmas e alunos) sem reescrever o jogo.
- Identidade visual **100% original**: paleta própria e ilustrações SVG feitas para o projeto.

## Roadmap

- [ ] **Etapa 1** — Setup do Angular com Tailwind, estrutura de pastas e base JSON com pelo menos 20 categorias
- [ ] **Etapa 2** — Tela de jogo: sorteio das categorias, campos de resposta e cronômetro opcional
- [ ] **Etapa 3** — Pontuação e tela de resultado com planeta e animação
- [ ] **Etapa 4** — Histórico e recorde no `localStorage`, e botão de jogar de novo
- [ ] **Etapa 5** — Polimento (acessibilidade, sons opcionais, testes) e deploy

## Convenções de Git

- Commits em inglês no padrão [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`.
- Mensagens curtas, no imperativo e em minúsculas. Ex.: `feat: add planet animation on result screen`.
- Commits pequenos, um assunto por commit.
- Branches curtas e descritivas: `feat/category-draw`, `fix/score-rounding`, `chore/setup-tailwind`.
