# Backlog do Astropalavra

Próximas funcionalidades, na ordem sugerida de desenvolvimento. Cada item vira uma branch e um PR próprios.

## Visão geral

| Código | Item                    | Branch               | Tamanho | Depende de           | Situação |
| ------ | ----------------------- | -------------------- | ------- | -------------------- | -------- |
| M0     | Base para modos de jogo | `feat/game-modes`    | M       | —                    | Feito    |
| M1     | Modo Relâmpago          | `feat/blitz-mode`    | M       | M0                   | Feito    |
| M2     | Modo Sobrevivência      | `feat/survival-mode` | G       | M0                   | Feito    |
| M3     | Modo Por tema           | `feat/theme-mode`    | M       | M0                   | Feito    |
| M4     | Modo Letra sorteada     | `feat/letter-mode`   | M       | M0                   | Feito    |
| G1     | Diário de bordo         | `feat/logbook`       | M       | —                    | Feito    |
| G2     | Patentes                | `feat/ranks`         | P       | —                    | Feito    |
| G3     | Álbum de figurinhas     | `feat/sticker-album` | G       | — (cresce com M/G)   | A fazer  |
| G4     | Foguete personalizável  | `feat/rocket-hangar` | M       | G2 e G3 (em parte)   | A fazer  |
| A1     | App instalável (PWA)    | `feat/pwa`           | P       | —                    | Feito    |
| A2     | Publicação nas lojas    | `feat/store-apps`    | M       | A1, ação do Leonardo | A fazer  |

Tamanho é relativo, não é prazo: **P** mexe em uma regra ou uma tela; **M** em algumas telas e serviços; **G** envolve várias telas, arte nova ou sincronização.

## Como trabalhar cada item

1. Criar a branch a partir da `main` atualizada, com o nome da tabela.
2. Commits pequenos, no padrão do projeto (Conventional Commits em inglês).
3. Antes do PR: testes de unidade, testes de ponta a ponta, auditoria de acessibilidade (axe sem violações) e conferência do layout nos tamanhos de tela já usados (do celular pequeno ao projetor).
4. Quem pede menos movimento no aparelho continua tendo uma versão sem animação de cada novidade.
5. README atualizado no mesmo PR.
6. PR aberto e publicado só com aprovação do Leonardo.

## Decisões que valem para tudo

- **Sem conta e sem servidor.** O jogo não tem login e tudo fica salvo no aparelho do jogador (`ProgressRepository` e `localStorage`). Isso também simplifica a publicação nas lojas, porque nenhum dado pessoal é coletado.
- **Crianças.** O jogo é usado por crianças. Como não coleta dados, não precisa de consentimento; as lojas ainda pedem classificação etária e política de privacidade.
- **Fora deste backlog por decisão:** Missão do dia e sequência de dias (já existem no jogo de referência). Login com Google, progresso na nuvem e duelo online foram retirados em novembro de 2026. Ranking geral, turmas e painel do professor ficam para depois.

---

## Épico M — Modos de jogo

Nenhum destes itens precisa de servidor.

### M0 · Base para modos de jogo

**Branch:** `feat/game-modes` · **Tamanho:** M · **Depende de:** nada

Hoje as regras da partida estão fixas no `GameService` (7 categorias, 30 segundos cada). Este item separa as regras do motor da partida, cria a escolha de modo na tela inicial e guarda o modo em cada partida salva. Para quem joga o Clássico, nada muda.

**Passo a passo**

1. Criar `core/models/game-mode.ts` com `GameModeId` (`classic`, `blitz`, `survival`, `theme`, `letter`) e a lista `GAME_MODES` (id, nome, frase curta).
2. Criar `core/models/round-rules.ts` com a interface `RoundRules`, que reúne o que muda de um modo para outro:
   - `pickCategories`: quais categorias entram e em que ordem;
   - `clock`: relógio por categoria ou da partida inteira, e quantos segundos;
   - `isOver`: quando a partida acaba;
   - `lives` (opcional): número de vidas;
   - `accepts` (opcional): filtro extra de resposta, usado pela Letra sorteada;
   - `pace` (opcional): velocidade das animações, usada pelo Relâmpago.
3. Criar `core/data/classic-rules.ts` com o comportamento de hoje.
4. `GameService.start()` passa a receber `{ mode, theme?, letter? }`, guarda as regras e deixa de usar `CATEGORIES_PER_ROUND` e `SECONDS_PER_CATEGORY` diretamente. O `status` passa a perguntar `rules.isOver`.
5. Rota `jogar/:mode` em `app.routes.ts`. O endereço `/jogar` continua abrindo o Clássico.
6. `RoundRecord`: trocar o campo `timerEnabled` (hoje sempre verdadeiro) por `mode`. Na leitura do progresso salvo, partida antiga sem `mode` vira `classic`. **Atenção:** hoje o `LocalProgressRepository` descarta todo o progresso quando a versão salva é diferente; não mudar `VERSION` sem escrever a migração.
7. Recordes por modo: novo `PlayerProgress.bestByMode`. O `ProgressService.record` calcula "novo recorde" dentro do modo.
8. Tela inicial: o botão "Começar partida" continua abrindo o Clássico. Abaixo dele, uma fileira "Outros modos" com cartões no estilo figurinha. Modo que ainda não existe não aparece.
9. Resultado e histórico mostram o nome do modo. O gráfico "Suas últimas partidas" compara só partidas do mesmo modo, e a escala deixa de ser fixa em 700 pontos (`MAX_ROUND_POINTS`) e passa a vir das regras.
10. O texto de compartilhar inclui o modo.

**Nota de projeto:** tema e letra são filtros de categorias e respostas, independentes de como a partida termina. Guardar `theme` e `letter` separados de `mode` permite combinações futuras (por exemplo, Relâmpago de Natureza) sem refazer nada.

**Testes:** regras do Clássico (sorteio sem repetir a partida anterior, fim na 7ª categoria); leitura de progresso antigo sem `mode`; os testes de ponta a ponta atuais passam sem alteração.

**Pronto quando:** o Clássico está idêntico ao de hoje, o seletor de modos existe, as partidas salvas têm `mode` e o progresso de quem já joga foi preservado.

**Situação:** feito.

**Como ficou, onde difere do plano**

- `RoundRules` tem só o que os modos existentes usam: `pickCategories`, `clock`, `pace` e `maxPoints`. `isOver`, `lives` e `accepts` entram com os modos que precisarem deles (Sobrevivência e Letra sorteada).
- `GameService.start()` recebe o modo, que já traz as regras. Tema e letra viram parâmetros quando esses modos chegarem.
- Cada modo tem a sua rota fixa (`/jogar/nome-do-modo`), criada a partir da lista de modos, em vez de uma rota `jogar/:mode`.
- O progresso salvo passou para a versão 2, com migração da versão 1: as partidas antigas viram partidas do Clássico.

### M1 · Modo Relâmpago

**Branch:** `feat/blitz-mode` · **Tamanho:** M · **Depende de:** M0

60 segundos para a partida inteira. O jogador responde o máximo de categorias que conseguir.

**Regras**

- Um relógio só, de 60 segundos, que começa quando o primeiro cartão entra (a decolagem não conta).
- Categorias sem repetir, uma atrás da outra, sem limite.
- O relógio para enquanto o cartão mostra o resultado. Sem isso, resposta rara custaria mais tempo, porque o voo dela é mais longo.
- Animações curtas: voo de no máximo 1,2 segundo e cartão virado por cerca de 1 segundo.
- O teclado não se recolhe entre as respostas (exceção à regra do Clássico), porque aqui a velocidade importa. O resultado já aparece no cartão do topo.
- Resposta fora da lista: mesma mensagem de "tente outra". Pular vale 0 e passa para a próxima.
- Quando o tempo acaba, vale o que estiver digitado.
- Pontos e destinos iguais aos do Clássico, com recorde próprio.

**Passo a passo**

1. `core/data/blitz-rules.ts`: relógio da partida com 60 segundos, `isOver` quando o relógio zera, `pace` rápido.
2. `Countdown` (`features/game/countdown.ts`): aprender a pausar e retomar. Hoje só começa e para.
3. `game.ts`: com relógio de partida, não reiniciar o cronômetro a cada categoria; pausar em `finishCategory` e retomar em `beginCategory`; ao zerar, pontuar o que estiver digitado e encerrar. Não chamar `blur()` neste modo.
4. `flightDuration` (`journey-scene.ts`, hoje de 1,3 a 6 segundos) e `revealDelay` (`game.ts`, hoje no mínimo 1,5 segundo) passam a respeitar o `pace` das regras.
5. Cabeçalho: no lugar de "Categoria X de 7" e dos tracinhos, mostrar "N respostas". O `TimerRing` mostra o relógio da partida e pulsa nos últimos 10 segundos.
6. Som de tique nos últimos 5 segundos (o efeito `tick` já existe).
7. Resultado: "N respostas em 60 segundos", lista completa das respostas e gráfico só de partidas Relâmpago.
8. Tornar a duração injetável (um token, como já existe para a decolagem) para os testes não esperarem 60 segundos de verdade.

**Testes:** o relógio para durante o resultado; a partida acaba quando zera; nenhuma categoria se repete; ponta a ponta com duração reduzida.

**Pronto quando:** dá para jogar uma partida inteira de Relâmpago no celular com o teclado aberto o tempo todo, o recorde do modo é salvo e o Clássico não mudou.

**Situação:** feito, com 60 segundos (decidido depois de ver uma partida gravada).

**Como ficou, onde difere do plano**

- A duração vem das regras do modo (`core/data/blitz-rules.ts`), que os testes trocam por outras. Não foi preciso um token; nos testes de ponta a ponta o relógio da página é controlado.
- Quando o relógio zera sem pontuar, o cartão mostra "Tempo esgotado", mesmo que tenha ficado algo digitado fora da lista.
- O topo da tela conta só as respostas que pontuaram. Pulos não entram.
- A partida também acaba se as categorias terminarem antes do tempo.
- A tela inicial e o histórico mostram um recorde para cada modo.

**A observar jogando**

- Decidido depois de jogar: o Relâmpago não tem pular (a categoria só passa com resposta válida ou quando o tempo acaba), e o relógio começa assim que o primeiro cartão entra, sem esperar o toque no campo.

### M2 · Modo Sobrevivência

**Branch:** `feat/survival-mode` · **Tamanho:** G · **Depende de:** M0

A partida não acaba em 7 categorias: acaba quando o jogador perde as 3 vidas. A rota continua depois de Plutão.

**Regras**

- 3 vidas. Perde uma quando o tempo acaba sem resposta válida ou quando pula a categoria.
- Resposta fora da lista continua permitindo tentar de novo até o tempo acabar.
- Categorias embaralhadas sem repetir (hoje são 42). Se acabarem, embaralha de novo.
- Pressão crescente (valores iniciais): 30 segundos nas categorias 1 a 7, 25 nas 8 a 14, 20 nas 15 a 21 e 15 daí em diante.
- Rota estendida depois de Plutão (rascunho):

| Parada           | Pontos | Distância aproximada            |
| ---------------- | ------ | ------------------------------- |
| Éris             | 800    | 10 bilhões de km                |
| Heliopausa       | 1.000  | 18 bilhões de km                |
| Voyager 1        | 1.300  | 25 bilhões de km (e aumentando) |
| Nuvem de Oort    | 1.700  | 300 bilhões de km               |
| Proxima Centauri | 2.200  | 40 trilhões de km               |

As distâncias desta tabela são aproximadas e precisam ser conferidas em fonte confiável (NASA/JPL) antes de entrar no jogo, como foi feito com os planetas.

**Passo a passo**

1. `core/data/survival-rules.ts`: vidas, relógio por categoria com tempo decrescente, `isOver` quando as vidas chegam a zero.
2. `GameService`: novo estado `lives`; `answer()` desconta uma vida em resposta em branco ou tempo esgotado; sorteio sem fim (uma fila que se reabastece).
3. Rota como parâmetro. Hoje `journey.ts` (`routePosition`, `reachedIndex`, `distanceAt`) e o `ScoringService` (`destinationFor`, `nextDestination`) leem a lista `PLANETS` direto. Passam a receber a rota: a clássica, com 8 paradas, ou a estendida, com 13.
4. `core/data/planets.ts`: as 5 paradas novas, cada uma com sua curiosidade. `PlanetId` ganha os novos ids. `formatDistance` aprende "trilhão" e "trilhões".
5. `PlanetArt`: 5 desenhos novos (Éris gelado, o arco brilhante da heliopausa, a sonda Voyager, a nuvem de cometas, a estrela vermelha).
6. Cena: indicador de vidas no cabeçalho (3 foguetinhos). Ao perder uma vida, o motor engasga (já existe), a tela pisca e um foguetinho apaga. O botão "Pular" vira "Pular (−1 vida)".
7. Resultado: "Você sobreviveu a N categorias", destino, recorde de categorias e de pontos. Lista de respostas recolhida quando for longa.
8. Tela inicial: a fileira "Destinos alcançados" continua com as 8 paradas do Clássico. As paradas novas entram no álbum (G3).

**Testes:** perda de vida, fim da partida, tempo decrescente, rota estendida em `journey.spec.ts`, formatação de trilhões; ponta a ponta perdendo as 3 vidas.

**Pronto quando:** dá para jogar até perder as vidas, passar de Plutão mostra as paradas novas com distância e curiosidade, e o recorde do modo é salvo.

**Situação:** feito.

**Como ficou, onde difere do plano**

- As distâncias das paradas novas foram conferidas em páginas da NASA: Éris a 68 UA (10,1 bilhões de km), heliopausa a 121 UA (18,2 bilhões), Voyager 1 a um dia-luz no fim de 2026 (25,9 bilhões), borda interna da Nuvem de Oort a 2.000 UA (300 bilhões) e Proxima Centauri a 4,2 anos-luz (40 trilhões).
- As regras ganharam `lives` e `route`, e o relógio ganhou `secondsAt` (tempo por posição da categoria). O fim da partida por vidas ficou no `GameService`, sem um `isOver` nas regras.
- O resultado diz "N respostas antes de perder as 3 vidas". O recorde continua sendo de pontos; não há recorde separado de categorias.
- Lista de respostas com mais de 12 itens começa recolhida, mostrando 10, em qualquer modo.
- Na tela inicial, "Destinos alcançados" conta só as 8 paradas clássicas.

- Depois de jogar, o tempo passou a encurtar a cada 5 categorias, e não a cada 7: 30, 25, 20, 15 e por fim 12 segundos.

**A decidir:** os pontos das paradas (ajustar jogando); se a rota estendida também vale no Relâmpago.

### M3 · Modo Por tema

**Branch:** `feat/theme-mode` · **Tamanho:** M · **Depende de:** M0

O jogador escolhe um tema e a partida, com as regras do Clássico, sorteia só categorias dele.

**Temas (rascunho com as 42 categorias de hoje)**

| Tema             | Categorias                                                                                                                                                       | Total |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Natureza         | animais do mar, aves, insetos, mamíferos, peixes, répteis e anfíbios, animais da Amazônia, dinossauros, árvores, flores, frutas, legumes e verduras              | 12    |
| Dia a dia        | cozinha, roupas, material escolar, ferramentas, móveis, transportes, profissões, cores, sentimentos, instrumentos musicais, esportes com bola, esportes sem bola | 12    |
| Ciência e espaço | astros do Sistema Solar, constelações, elementos químicos, fenômenos da natureza, pedras preciosas, formas geométricas, corpo humano, dinossauros                | 8     |
| Mundo            | países da América do Sul, da Europa, da África e da Ásia, idiomas, estados brasileiros, capitais brasileiras                                                     | 7     |
| Brasil           | estados, capitais, doces, pratos salgados, folclore, animais da Amazônia, brincadeiras                                                                           | 7     |

Uma categoria pode estar em mais de um tema. Um tema só é oferecido quando tem pelo menos 9 categorias, para as partidas variarem. **Mundo** e **Brasil** têm 7, então este item inclui criar pelo menos 2 categorias novas para cada (ideias: países das Américas do Norte e Central, capitais do mundo, rios brasileiros, cidades brasileiras, ritmos e festas do Brasil).

**Passo a passo**

1. `categories.json`: campo `themes` (lista de ids) em cada categoria; atualizar o modelo `Category`. Criar `core/data/themes.ts` (id, nome, cor e ícone).
2. Teste de dados em `categories-data.spec.ts`: toda categoria tem ao menos um tema válido e todo tema oferecido tem 9 categorias ou mais.
3. Escrever as categorias novas de Mundo e Brasil, no mesmo formato e com respostas nos 5 níveis.
4. Tela de escolha do tema (`features/themes`) com um cartão-figurinha por tema.
5. Regras do tema: as do Clássico, com `pickCategories` filtrando pelo tema escolhido.
6. Mostrar o tema no cabeçalho da partida, no resultado, no histórico e no texto de compartilhar.

**Testes:** o sorteio só traz categorias do tema; os testes de dados acima; ponta a ponta escolhendo um tema.

**Pronto quando:** os 5 temas aparecem, cada partida de tema só traz categorias dele e nenhum tema fica repetitivo.

**Situação:** feito.

**Como ficou, onde difere do plano**

- A base já tinha crescido para 80 categorias, então não foi preciso criar categorias para Mundo e Brasil. São 6 temas, com o novo **Arte e esporte**: Natureza (18 categorias), Dia a dia (19), Ciência e espaço (13), Mundo (13), Brasil (11) e Arte e esporte (12).
- Cada tema tem o seu endereço (`/jogar/tema/natureza`), e `/jogar/tema` é a tela de escolha.
- O tema é salvo em cada partida (`theme`). O recorde e o gráfico são do modo inteiro, não de cada tema.
- Os temas têm nome, frase e cor; não têm ícone.

### M4 · Modo Letra sorteada

**Branch:** `feat/letter-mode` · **Tamanho:** M · **Depende de:** M0

No começo da partida uma letra é sorteada. Nas 7 categorias, só vale resposta que comece com ela, como no stop (adedonha).

**O que a base atual permite** (medido nas 42 categorias e 2.759 respostas)

- Exigindo pelo menos 5 respostas válidas por categoria, 10 letras têm 7 categorias ou mais: A, B, C, E, F, G, M, P, S e T.
- Exigindo pelo menos 3, são 18 letras: as anteriores mais D, H, I, J, L, O, R e V.

Recomendação: começar exigindo 5 (10 letras) e reforçar a base nas letras fracas.

**Regras**

- A letra é sorteada entre as viáveis. A conta é feita na hora, a partir da base, então novas letras entram sozinhas quando a base cresce.
- As categorias são sorteadas só entre as que têm o mínimo de respostas com a letra.
- Acento não conta: "Árvore" vale para A.
- Resposta que existe mas começa com outra letra não pontua e não gasta a vez. Aparece uma mensagem própria: "Essa existe, mas precisa começar com M!".
- A correção de uma letra errada continua valendo, desde que a resposta corrigida comece com a letra sorteada.
- Pontos por raridade iguais aos do Clássico.

**Passo a passo**

1. `core/utils/letters.ts`: `startsWithLetter`, `viableLetters(categories, min)` e `categoriesFor(letter, categories, min)`, usando o `normalizeAnswer` que já existe.
2. `ScoringService.score`: novo desfecho `wrong-letter` quando `rules.accepts` recusa a resposta. A correção de erro de digitação (`closeMatch`) passa a considerar só respostas com a letra.
3. Regras da letra: sorteiam a letra e depois as categorias.
4. Abertura: depois da decolagem, uma roleta de letras gira e para na sorteada. A letra fica como selo no canto do cartão durante a partida.
5. Mensagens de nova tentativa e anúncio para leitor de tela no caso `wrong-letter`.
6. Resultado: título com a letra; "Para ir mais longe" só sugere respostas com ela.
7. Teste de dados garantindo um mínimo de letras viáveis (por exemplo, 8), para a base não regredir.
8. Conteúdo: acrescentar respostas para as letras fracas.

**Testes:** funções de letras (com acentos); pontuação com letra certa, errada e com erro de digitação; ponta a ponta com letra fixada.

**Pronto quando:** toda partida do modo é possível de vencer (sempre existem respostas com a letra em todas as categorias sorteadas) e a mensagem de letra errada deixa claro o que aconteceu.

**A decidir:** mínimo de 5 ou 3 respostas por categoria; se resposta com outra letra vale zero ou metade.

---

## Épico G — Gamificação

Tudo aqui salva no aparelho e funciona sem conta.

### G1 · Diário de bordo

**Branch:** `feat/logbook` · **Tamanho:** M · **Depende de:** nada

Coleção das respostas que o jogador já descobriu, por categoria e nível. É a parte que mais ensina: vocabulário novo vira coleção.

**Passo a passo**

1. Modelo: novo `PlayerProgress.discoveries`, um mapa por categoria com cada resposta descoberta, a data da primeira vez e quantas vezes foi usada. A chave da resposta é o texto oficial normalizado (`normalizeAnswer(match.text)`), para "narval" e "Narval" serem a mesma descoberta.
2. `ProgressRepository.addRound` registra as respostas pontuadas da partida. Leitura tolerante para progresso antigo, sem o campo.
3. Preenchimento inicial: quem já joga começa com o diário preenchido pelas partidas guardadas no histórico (até 50), que já têm a resposta oficial.
4. `ProgressService`: expor as descobertas, o total geral e, no resultado da partida (`RoundOutcome`), a lista de descobertas novas.
5. Tela `/diario` (`features/logbook`): grade de categorias com "12 de 58" e contadores por nível; no topo, o total geral ("214 de 2.759 respostas").
6. Página da categoria: respostas descobertas agrupadas por nível, com as mesmas pílulas coloridas do resultado. O que falta aparece só como quantidade ("faltam 9 Supernovas"), sem revelar as respostas.
7. Resultado: selo "Nova descoberta!" nas respostas inéditas e link para o diário.
8. Tela inicial: entrada "Diário de bordo" no cartão de progresso.

**Testes:** registro e contagem de descobertas; preenchimento a partir do histórico; ponta a ponta jogando uma partida e vendo a resposta no diário.

**Pronto quando:** toda resposta pontuada aparece no diário, o progresso por categoria bate com a base e nada do que o jogador ainda não digitou é revelado.

**Nota:** as dicas "Para ir mais longe" do resultado continuam aparecendo, porque ensinam, mas só entra no diário o que o jogador realmente digitou.

### G2 · Patentes

**Branch:** `feat/ranks` · **Tamanho:** P · **Depende de:** nada

Os pontos de todas as partidas, em todos os modos, somam experiência (XP), e o jogador sobe de patente.

**Tabela (rascunho, para calibrar)**

| Patente          | XP     |
| ---------------- | ------ |
| Cadete           | 0      |
| Piloto           | 500    |
| Navegador        | 1.500  |
| Capitão          | 3.500  |
| Comandante       | 7.000  |
| Almirante        | 12.000 |
| Lenda da Galáxia | 20.000 |

Com uma média perto de 200 pontos por partida, o jogador vira Piloto em umas 3 partidas e Almirante em umas 60.

**Passo a passo**

1. `core/data/ranks.ts` com a tabela e `core/utils/ranks.ts` com `rankFor(xp)`, que devolve a patente atual, a próxima e o quanto falta.
2. Novo `PlayerProgress.xp`. Para quem já joga, o valor inicial é a soma dos pontos das partidas guardadas no histórico. É uma aproximação, porque só as 50 últimas ficam salvas.
3. Insígnia em SVG para cada patente (arte original).
4. Tela inicial: selo da patente e barra de progresso até a próxima.
5. Resultado: "+335 XP" com a barra enchendo. Ao subir de patente, comemoração com estrelas e som.
6. `RoundOutcome.rankUp` para o resultado saber quando comemorar.

**Testes:** `rankFor` nos limites de cada patente; XP inicial a partir do histórico; resultado mostrando a subida de patente.

**Pronto quando:** a patente aparece na tela inicial, sobe na hora certa e a comemoração acontece uma vez só.

**Situação:** feito, com a tabela do rascunho.

**Como ficou, onde difere do plano**

- A insígnia é um escudo: uma a três divisas nas três primeiras patentes, uma a três estrelas nas três seguintes e uma estrela grande com coroa na última.
- A subida de patente é comemorada com estrelas no resultado. Não há um som próprio para ela.
- Apagar o histórico também zera a experiência.

### G3 · Álbum de figurinhas

**Branch:** `feat/sticker-album` · **Tamanho:** G · **Depende de:** nada para começar; ganha figurinhas novas conforme M1 a M4, G1 e G2 ficam prontos

Conquistas viram figurinhas num álbum, no mesmo visual dos cartões do jogo.

**Conjunto inicial (rascunho, cerca de 30)**

- **Destinos (8):** uma por parada do Clássico, da Órbita da Terra a Plutão.
- **Raridades (5):** primeira Supernova; primeiro Pulsar; 3 Supernovas numa partida; partida completa sem pular nenhuma categoria; partida sem nenhuma resposta Satélite ou Meteorito.
- **Modos (7):** jogar cada um dos 4 modos novos; 10 respostas num Relâmpago; 15 categorias numa Sobrevivência; passar de Plutão.
- **Coleção (5):** 10, 50, 200 e 500 descobertas no diário; todas as Supernovas de uma categoria.
- **Patentes (6):** uma por patente acima de Cadete.

**Passo a passo**

1. `core/data/stickers.ts`: cada figurinha é um item com id, grupo, título, dica e a regra `earned(ctx)`. O `ctx` traz o progresso acumulado e a partida que acabou de terminar. Criar uma figurinha nova é acrescentar um item a essa lista.
2. `StickerService.evaluate()` roda depois de salvar a partida e devolve as figurinhas novas. Novo `PlayerProgress.stickers` guarda cada uma com a data.
3. Primeira execução: avaliar com o progresso que já existe, para quem já chegou a Saturno ganhar na hora as figurinhas dos destinos.
4. Tela `/album` (`features/album`): uma página por grupo. Figurinha ganha aparece colorida e levemente torta; a que falta aparece como contorno tracejado com a dica ("Chegue a Saturno"). Contador "12 de 30".
5. Arte: cada figurinha é uma pequena composição em SVG que reaproveita os planetas, o foguete, as insígnias e alguns ícones novos.
6. Resultado: cartão "Nova figurinha!" com animação de colar e som.
7. Tela inicial: a fileira "Destinos alcançados" vira atalho para o álbum.

**Testes:** uma regra de teste por figurinha; avaliação inicial com progresso existente; ponta a ponta ganhando a figurinha da Lua.

**Pronto quando:** as figurinhas disponíveis são ganhas na hora certa, uma vez só, e o álbum mostra claramente o que falta e como conseguir.

### G4 · Foguete personalizável

**Branch:** `feat/rocket-hangar` · **Tamanho:** M · **Depende de:** G2 e G3 para os desbloqueios (dá para começar só com opções livres)

O jogador monta o próprio foguete num hangar. Patentes e figurinhas liberam cores, fogos e adesivos.

**Passo a passo**

1. `core/models/rocket-look.ts`: `RocketLook` com as cores do corpo, das asas, da faixa e da janela, o tipo de fogo e um adesivo opcional.
2. `RocketShape`: hoje as cores são classes fixas (`fill-space-50`, `fill-nebula-500`, `fill-candy-500`, `fill-aurora-400`). Trocar por variáveis CSS (`--rocket-body` e as demais), com as cores atuais como padrão. O contorno escuro não muda.
3. `ExhaustPlume`: a paleta do fogo (a constante `FLAME`) vira uma entrada do componente.
4. `core/data/rocket-parts.ts`: catálogo de opções. Cada uma diz como é liberada: livre, por uma patente ou por uma figurinha.
5. Guardar a escolha no `PreferencesService`.
6. Tela `/hangar`: foguete grande flutuando com o fogo ligado; abas Corpo, Asas, Faixa, Janela, Fogo e Adesivo. Opção bloqueada mostra o que falta para liberar.
7. Usar o foguete do jogador em todo lugar: na partida, na chegada em órbita do resultado e na tela inicial.
8. Cada cor tem um nome escrito, para a escolha não depender só de enxergar a cor.

**Testes:** `RocketShape` com um visual escolhido; regras de desbloqueio; a escolha continua depois de recarregar a página.

**Pronto quando:** o foguete escolhido aparece em todas as telas, as opções bloqueadas explicam como liberar e o foguete padrão é o mesmo de hoje.

---

## Épico A — Aplicativo

### A1 · App instalável (PWA)

**Branch:** `feat/pwa` · **Tamanho:** P · **Depende de:** nada

O próprio site passa a poder ser instalado pelo navegador, com ícone, tela cheia e funcionando sem internet. Não passa por loja.

**Passo a passo**

1. `ng add @angular/pwa`: manifesto, service worker e registro no `app.config.ts`.
2. Manifesto: nome "Astropalavra", cores do tema, `display: standalone`, orientação retrato e `start_url`/`scope` relativos, para funcionar em `/app_orbita/` no GitHub Pages.
3. Ícones originais em todos os tamanhos, incluindo o "maskable" do Android e o `apple-touch-icon`.
4. Cache: o aplicativo e `categories.json` ficam guardados para abrir offline; a base é atualizada em segundo plano.
5. Aviso discreto de "nova versão disponível", com botão para recarregar.
6. Convite para instalar na tela inicial: botão no Android (`beforeinstallprompt`) e instrução curta no iPhone ("Compartilhar → Adicionar à Tela de Início").
7. Conferir que o progresso salvo no navegador aparece no app instalado no Android. No iPhone o app instalado tem armazenamento próprio, e isso deve ser avisado.

**Testes:** manifesto válido; o jogo abre e joga uma partida sem rede (ponta a ponta com a rede desligada); auditoria de PWA do Lighthouse.

**Pronto quando:** dá para instalar no Android e no iPhone, abrir em tela cheia e jogar sem internet.

**Situação:** feito.

**Como ficou, onde difere do plano**

- O aviso de versão nova e o convite para instalar ficam na tela inicial, para não aparecerem no meio de uma partida.
- A partida sem rede foi conferida num build de produção, fora dos testes de ponta a ponta, que rodam com o servidor de desenvolvimento (sem service worker). A auditoria do Lighthouse não foi rodada.
- Falta conferir em aparelhos de verdade: instalar no Android e no iPhone, e as fontes sem internet.

### A2 · Publicação nas lojas

**Branch:** `feat/store-apps` · **Tamanho:** M · **Depende de:** A1 e de ações do Leonardo

O mesmo código empacotado com Capacitor em um app Android e um app iOS, publicados na Play Store e na App Store.

**O que só o Leonardo pode fazer**

1. Criar a conta de desenvolvedor do Google Play (US$ 25, uma vez) e a da Apple (US$ 99 por ano).
2. Ter acesso a um Mac com Xcode: sem ele não dá para gerar nem enviar o app de iOS.
3. Assinar e enviar os apps, e responder às revisões das lojas.

**Passo a passo**

1. Adicionar o Capacitor (`@capacitor/core`, `android`, `ios`), com `webDir` apontando para o build e identificador do app (por exemplo `br.com.astropalavra`).
2. Build com `base-href` `/` para os apps, separado do build do GitHub Pages.
3. Ícone e tela de abertura nativos, a partir da arte do A1.
4. Retestar dentro do app o que foi ajustado para navegador: barra de resposta sobre o teclado, área segura do iPhone, áudio e botão de voltar do Android.
5. Compartilhar o resultado pela folha nativa (`@capacitor/share`).
6. Material das lojas: nome, descrição, capturas de tela, classificação etária e política de privacidade (o jogo não coleta dados).
7. Regras para público infantil: Famílias, no Google Play, e categoria Kids, na Apple, se o jogo for declarado para crianças.
8. Publicar primeiro em teste fechado (trilha interna do Play e TestFlight) e depois abrir.
9. Documentar no README como gerar e enviar cada versão.

**Testes:** os de ponta a ponta atuais no build dos apps; roteiro manual em um Android e um iPhone reais.

**Pronto quando:** o Astropalavra pode ser baixado nas duas lojas e uma atualização consegue ser enviada seguindo o README.

**A decidir:** começar só pelo Android, que é mais barato e não exige Mac; nome e identificador definitivos do app; se o app será declarado como feito para crianças.

---

## Ordem sugerida

1. **M0**, depois **M1**, **M2**, **M3** e **M4**: cada modo fica pronto para jogar sozinho.
2. **G1**, **G2**, **G3** e **G4**: objetivos de longo prazo, sem servidor.
3. **A1**, que é pequeno e pode entrar a qualquer momento; depois **A2**, quando as contas das lojas existirem.

A ordem pode mudar. As únicas amarras são as da coluna "Depende de" na tabela do início.
