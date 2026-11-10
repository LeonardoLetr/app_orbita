# Backlog do Astropalavra

Próximas funcionalidades, na ordem sugerida de desenvolvimento. Cada item vira uma branch e um PR próprios.

## Visão geral

| Código | Item                                   | Branch                 | Tamanho | Depende de         | Situação |
| ------ | -------------------------------------- | ---------------------- | ------- | ------------------ | -------- |
| M0     | Base para modos de jogo                | `feat/game-modes`      | M       | —                  | Feito    |
| M1     | Modo Relâmpago                         | `feat/blitz-mode`      | M       | M0                 | Feito    |
| M2     | Modo Sobrevivência                     | `feat/survival-mode`   | G       | M0                 | Feito    |
| M3     | Modo Por tema                          | `feat/theme-mode`      | M       | M0                 | Feito    |
| M4     | Modo Letra sorteada                    | `feat/letter-mode`     | M       | M0                 | A fazer  |
| G1     | Diário de bordo                        | `feat/logbook`         | M       | —                  | A fazer  |
| G2     | Patentes                               | `feat/ranks`           | P       | —                  | A fazer  |
| G3     | Álbum de figurinhas                    | `feat/sticker-album`   | G       | — (cresce com M/G) | A fazer  |
| G4     | Foguete personalizável                 | `feat/rocket-hangar`   | M       | G2 e G3 (em parte) | A fazer  |
| N1     | Projeto Firebase                       | `chore/firebase-setup` | P       | ação do Leonardo   | A fazer  |
| N2     | Login com Google                       | `feat/google-sign-in`  | M       | N1                 | A fazer  |
| N3     | Progresso na nuvem                     | `feat/cloud-progress`  | G       | N2                 | A fazer  |
| D1     | Duelo online: salas                    | `feat/duel-rooms`      | M       | N1                 | A fazer  |
| D2     | Duelo online: partida sincronizada     | `feat/duel-match`      | G       | D1                 | A fazer  |
| D3     | Duelo online: dois foguetes e revanche | `feat/duel-scene`      | M       | D2                 | A fazer  |
| D4     | Duelo online: quedas de conexão        | `feat/duel-reconnect`  | M       | D2                 | A fazer  |

Tamanho é relativo, não é prazo: **P** mexe em uma regra ou uma tela; **M** em algumas telas e serviços; **G** envolve várias telas, arte nova ou sincronização.

## Como trabalhar cada item

1. Criar a branch a partir da `main` atualizada, com o nome da tabela.
2. Commits pequenos, no padrão do projeto (Conventional Commits em inglês).
3. Antes do PR: testes de unidade, testes de ponta a ponta, auditoria de acessibilidade (axe sem violações) e conferência do layout nos tamanhos de tela já usados (do celular pequeno ao projetor).
4. Quem pede menos movimento no aparelho continua tendo uma versão sem animação de cada novidade.
5. README atualizado no mesmo PR.
6. PR aberto e publicado só com aprovação do Leonardo.

## Decisões que valem para tudo

- **Jogar sem conta continua funcionando.** Login é opcional e só acrescenta coisas (guardar o progresso na nuvem, duelo com o próprio nome).
- **A gamificação salva no aparelho primeiro.** Diário, patentes, figurinhas e foguete usam o mesmo caminho do progresso atual (`ProgressRepository` e `localStorage`) e funcionam sem conta. A nuvem (N3) sincroniza depois. Assim os épicos M e G não dependem de servidor.
- **Servidor recomendado: Firebase** (Authentication + Firestore, plano gratuito). Funciona direto de um site estático no GitHub Pages, o login com Google é nativo, tem atualização em tempo real para o duelo, e o projeto gratuito não é pausado por falta de uso (no Supabase, a alternativa mais próxima, projetos gratuitos pausam depois de uma semana parados).
- **Crianças e dados pessoais.** O jogo é usado por crianças, e a LGPD pede consentimento de um responsável para tratar dados pessoais de crianças. Por isso: login nunca é obrigatório, guardamos o mínimo (um apelido, não o e-mail nem o nome completo), existe botão de apagar a conta e uma página de privacidade em linguagem simples. Contas Google de menores de 13 anos são supervisionadas e podem não conseguir entrar em sites de terceiros. Se o jogo for adotado oficialmente por uma escola, vale confirmar esse ponto com quem cuida disso lá.
- **Fora deste backlog por decisão:** Missão do dia e sequência de dias (já existem no jogo de referência). Ranking geral, turmas e painel do professor ficam para depois.

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

- Pular não gasta relógio, porque ele para em todo cartão de resultado. Dá para pular até achar uma categoria fácil. Se isso deixar o modo fácil demais, a saída é o relógio continuar correndo durante o cartão de quem pulou.
- No iPhone o teclado só abre com um toque, então o começo dos 60 segundos vai nesse toque. Se incomodar, o relógio pode esperar o primeiro toque no campo.

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

**A decidir:** os tempos e os pontos das paradas (ajustar jogando); se a rota estendida também vale no Relâmpago.

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

Tudo aqui salva no aparelho e funciona sem conta. O item N3 leva esses dados para a nuvem depois.

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

### G3 · Álbum de figurinhas

**Branch:** `feat/sticker-album` · **Tamanho:** G · **Depende de:** nada para começar; ganha figurinhas novas conforme M1 a M4, G1 e G2 ficam prontos

Conquistas viram figurinhas num álbum, no mesmo visual dos cartões do jogo.

**Conjunto inicial (rascunho, cerca de 30)**

- **Destinos (8):** uma por parada do Clássico, da Órbita da Terra a Plutão.
- **Raridades (5):** primeira Supernova; primeiro Pulsar; 3 Supernovas numa partida; partida completa sem pular nenhuma categoria; partida sem nenhuma resposta Satélite ou Meteorito.
- **Modos (8):** jogar cada um dos 4 modos novos; 10 respostas num Relâmpago; 15 categorias numa Sobrevivência; passar de Plutão; vencer um duelo.
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

## Épico N — Conta e nuvem

### N1 · Projeto Firebase

**Branch:** `chore/firebase-setup` · **Tamanho:** P · **Depende de:** ação do Leonardo

Pode começar a qualquer momento, em paralelo com os épicos M e G.

**O que só o Leonardo pode fazer** (no console do Firebase, com a conta Google dele)

1. Criar o projeto em `console.firebase.google.com`, no plano gratuito (Spark).
2. Em Authentication, ativar os provedores **Google** e **Anônimo**. O anônimo permite duelar com apelido, sem conta.
3. Em Firestore, criar o banco na região `southamerica-east1` (São Paulo), em modo de produção.
4. Em Authentication → Settings → Authorized domains, acrescentar `leonardoletr.github.io`.
5. Registrar um app Web e passar o bloco de configuração que o console mostra.

**Passo a passo no repositório**

1. Dependência `firebase` (SDK modular), carregada sob demanda: o código só é baixado quando o jogador entra na conta ou no duelo. Quem joga sem conta não fica com o jogo mais pesado. Conferir os limites de tamanho do `angular.json`.
2. `core/cloud/firebase.ts`: inicialização preguiçosa com a configuração do projeto. Essa configuração não é segredo (fica visível em qualquer site que usa Firebase); a proteção são as regras de segurança do banco.
3. `firestore.rules` versionado no repositório, com testes das regras rodando no emulador do Firebase dentro do CI.
4. Publicação das regras: no começo, manual pela linha de comando do Firebase; depois, se quiser, automática por GitHub Action com credencial guardada nos segredos do repositório.
5. Os testes de ponta a ponta continuam usando os repositórios locais, sem rede.
6. Página `/privacidade` explicando, em linguagem simples, o que é guardado e como apagar.

**Pronto quando:** o site publicado consegue ler e gravar um documento de teste protegido pelas regras, e o jogo sem conta continua do mesmo tamanho.

### N2 · Login com Google

**Branch:** `feat/google-sign-in` · **Tamanho:** M · **Depende de:** N1

Entrar com a conta Google para guardar o progresso e levar para outro aparelho. Sempre opcional.

**Passo a passo**

1. `core/data/auth-repository.ts`: abstração `AuthRepository`, no mesmo molde dos repositórios que já existem, com o jogador atual, `signInWithGoogle()`, `signOut()` e `deleteAccount()`. Duas implementações: a do Firebase e uma de mentira para os testes.
2. Usar a janela de login (popup). O login por redirecionamento falha em navegadores que bloqueiam armazenamento de terceiros quando o site não está no domínio do próprio Firebase, que é o nosso caso no GitHub Pages.
3. Tela inicial: botão "Entrar com Google" com uma linha dizendo para que serve. Depois de entrar, um selo com o apelido abre o perfil.
4. Apelido: começa com o primeiro nome da conta e pode ser trocado. É o que os outros jogadores veem. O e-mail não é guardado no nosso banco, e a foto da conta não é usada: o avatar do jogador é o foguete dele.
5. Perfil: trocar apelido, sair e **apagar minha conta e meus dados**.
6. Tratar os erros comuns: janela bloqueada ou fechada, e navegador embutido de aplicativos (WhatsApp, Instagram), que não permite login Google. Nesse caso, pedir para abrir no navegador do celular.

**Testes:** fluxo completo com o repositório de mentira; mensagens de erro; apagar a conta remove os dados (teste das regras no emulador).

**Pronto quando:** dá para entrar, sair e apagar a conta no celular e no computador, e quem não entra não percebe diferença.

### N3 · Progresso na nuvem

**Branch:** `feat/cloud-progress` · **Tamanho:** G · **Depende de:** N2 (e sincroniza o que existir de G1 a G4)

O progresso do jogador que entrou na conta fica guardado no Firestore e aparece em qualquer aparelho.

**Dados no Firestore**

- `users/{uid}`: apelido, XP, recordes por modo, paradas alcançadas, figurinhas, visual do foguete.
- `users/{uid}/rounds/{id}`: as 50 últimas partidas.
- `users/{uid}/logbook/{categoryId}`: as descobertas de cada categoria.

**Passo a passo**

1. `CloudProgressRepository`, implementação de `ProgressRepository` que grava primeiro no aparelho (como hoje) e depois na nuvem. Trocar a implementação em `app.config.ts` conforme o jogador está ou não na conta.
2. Função pura de fusão para o primeiro login num aparelho que já tem progresso: une as partidas pelo id, fica com o maior recorde de cada modo, une paradas, figurinhas e descobertas (mantendo a data mais antiga). Marcar no aparelho o que já foi enviado, para não contar duas vezes.
3. Funcionar sem internet: usar o cache local do Firestore e enviar quando a conexão voltar.
4. Regras de segurança: cada jogador só lê e grava o que está em `users/{seu uid}`; validar tipos e limites (por exemplo, pontos de uma partida dentro do possível).
5. Ao sair da conta, o aparelho volta ao progresso de visitante. Isso protege quem divide o aparelho com irmãos ou colegas.

**Testes:** a função de fusão em vários cenários (aparelho novo, aparelho com progresso, os dois lados com dados); regras no emulador; ponta a ponta com o repositório de mentira.

**Pronto quando:** jogar no celular e depois abrir no computador com a mesma conta mostra o mesmo progresso, e nenhum jogador consegue ler dados de outro.

**A decidir:** o comportamento ao sair da conta (voltar a visitante, como proposto, ou manter o progresso no aparelho).

---

## Épico D — Duelo online

Dois jogadores, cada um no seu aparelho, respondem as mesmas categorias ao mesmo tempo. Precisa de N1. Não exige login com Google: quem não tem conta entra com um apelido (login anônimo).

**Regras propostas**

- As mesmas 7 categorias, na mesma ordem, com 30 segundos cada.
- Os dois respondem ao mesmo tempo. Quando ambos responderam, ou o tempo acabou, os cartões viram e mostram as duas respostas.
- Resposta igual à do adversário: cada um leva metade dos pontos. Reforça a ideia do jogo, porque vence quem pensa na resposta mais rara.
- Vence quem for mais longe. No empate de pontos, quem tiver mais Supernovas; se persistir, empate.

**A decidir:** resposta igual vale metade (proposta) ou zero, como no stop.

**Limites do plano gratuito:** um duelo gasta cerca de 100 gravações no banco. O limite gratuito é de 20 mil gravações por dia, o que dá para uns 200 duelos por dia. Se passar disso, dá para reduzir as gravações ou mudar de plano.

**Sem servidor próprio:** o plano gratuito não tem funções de servidor, então a pontuação é calculada nos aparelhos. Para ninguém inventar pontos, cada aparelho recalcula os pontos do adversário a partir do texto que ele digitou, usando a própria base de categorias.

### D1 · Salas

**Branch:** `feat/duel-rooms` · **Tamanho:** M · **Depende de:** N1

**Passo a passo**

1. Modelo do documento `duels/{code}`: situação (`waiting`, `playing`, `finished`), as 7 categorias sorteadas, a rodada atual, o horário de início da rodada (relógio do servidor), os dois jogadores (apelido, visual do foguete, pronto ou não) e a validade da sala.
2. `core/data/duel-repository.ts`: abstração com criar sala, entrar, marcar pronto e observar a sala. Implementação no Firestore e uma em memória para os testes.
3. Código da sala com 4 letras, sem caracteres que se confundem (O e 0, I e 1).
4. Regras de segurança: só entra quem encontra vaga; cada jogador só altera a própria parte; as categorias não mudam depois que a partida começa.
5. Tela `/duelo`: "Criar sala" ou "Entrar com código"; pede um apelido se o jogador ainda não tem.
6. Sala de espera em `/duelo/:code`: código grande, botão de compartilhar o link, os dois foguetes lado a lado e o botão "Pronto!".
7. Mensagens para código inexistente, sala cheia e sala vencida.

**Testes:** regras no emulador (terceiro jogador barrado, um jogador não altera o outro); criar e entrar com o repositório em memória; ponta a ponta com dois navegadores.

**Pronto quando:** duas pessoas em aparelhos diferentes entram na mesma sala pelo código ou pelo link e veem uma à outra.

### D2 · Partida sincronizada

**Branch:** `feat/duel-match` · **Tamanho:** G · **Depende de:** D1

**Passo a passo**

1. Máquina de estados do duelo como função pura (`core/utils/duel-state.ts`): a partir do documento da sala, diz em que fase cada aparelho está. É a parte mais importante de testar.
2. Relógio comum: a rodada começa no horário gravado pelo servidor, e cada aparelho calcula quanto falta a partir dele. A contagem "3, 2, 1" da decolagem serve de folga para os dois começarem juntos.
3. Respostas em `duels/{code}/answers/{uid}_{rodada}`, com o texto digitado. As regras só deixam ler a resposta do adversário depois que o próprio jogador respondeu ou a rodada acabou.
4. Na sala fica só o aviso de que o adversário já respondeu, sem o conteúdo, para mostrar "Ana já respondeu!".
5. Avanço de rodada: quando as duas respostas existem ou o tempo acabou (com 2 segundos de tolerância para a rede), qualquer um dos aparelhos avança, numa transação que só vale se a rodada ainda for a mesma. Assim nunca avança duas vezes.
6. Pontuação: cada aparelho pontua a própria resposta e recalcula a do adversário; aplica a regra da resposta igual.
7. `GameService` e a tela da partida passam a aceitar o duelo como fonte das categorias e do relógio, reaproveitando o cartão, o cronômetro e a cena.
8. O verso do cartão mostra as duas respostas: a do jogador e a do adversário, com nível e pontos.

**Testes:** a máquina de estados em todos os caminhos (os dois respondem, um responde, ninguém responde, respostas iguais); regra de leitura das respostas no emulador; ponta a ponta com dois navegadores jogando as 7 rodadas.

**Pronto quando:** dois aparelhos jogam as 7 categorias em sincronia, ninguém vê a resposta do outro antes da hora e os dois chegam ao mesmo placar.

### D3 · Dois foguetes, resultado e revanche

**Branch:** `feat/duel-scene` · **Tamanho:** M · **Depende de:** D2

**Passo a passo**

1. Cena: o foguete do adversário aparece na rota, acima ou abaixo do jogador conforme a diferença de pontos. Quando sai da tela, uma seta na borda mostra onde ele está ("↑ Ana · Júpiter").
2. Cabeçalho com os dois placares.
3. Resultado do duelo: quem venceu, os dois destinos e a comparação categoria por categoria (minha resposta e a dele).
4. "Revanche": novas 7 categorias na mesma sala, sem precisar de outro código.
5. Figurinha "Vencer um duelo" (G3) e XP normal da partida (G2).
6. O histórico registra o duelo com o apelido do adversário.

**Testes:** posição do foguete adversário para várias diferenças de pontos; resultado com vitória, derrota e empate; revanche.

**Pronto quando:** dá para ver o adversário avançando durante a partida, o resultado deixa claro quem venceu e por quê, e a revanche começa com um toque.

### D4 · Quedas de conexão e limpeza

**Branch:** `feat/duel-reconnect` · **Tamanho:** M · **Depende de:** D2

**Passo a passo**

1. Sinal de presença: cada aparelho avisa a cada 10 segundos que continua na sala.
2. Adversário em silêncio por 20 segundos: aviso "Ana saiu da sala" e escolha entre esperar ou encerrar com vitória.
3. Recarregar a página ou perder a conexão por instantes: ao voltar ao link, o jogador retoma a partida de onde ela está.
4. Mesmo jogador em duas abas: só a mais recente joga.
5. Salas vencidas são apagadas (validade de 24 horas). Conferir se a exclusão automática do Firestore está disponível no plano gratuito; se não estiver, apagar as salas antigas do próprio jogador quando ele cria uma nova.
6. Conferir o consumo real de gravações por duelo e ajustar o intervalo do sinal de presença.

**Testes:** máquina de estados com adversário ausente e com retorno; ponta a ponta fechando um dos navegadores no meio da partida.

**Pronto quando:** uma queda de conexão de qualquer lado nunca deixa o outro jogador preso numa tela sem saída.

---

## Ordem sugerida

1. **M0**, depois **M1**, **M2**, **M3** e **M4**: cada modo fica pronto para jogar sozinho.
2. **G1**, **G2**, **G3** e **G4**: objetivos de longo prazo, ainda sem servidor.
3. **N1** em paralelo, assim que o projeto Firebase for criado; depois **N2** e **N3**.
4. **D1** a **D4**: o duelo online, que depende de N1.

A ordem pode mudar. As únicas amarras são as da coluna "Depende de" na tabela do início.
