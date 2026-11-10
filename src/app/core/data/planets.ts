import { Planet, Route } from '../models/planet';

/**
 * Journey stops, ordered by distance and by the points needed to reach them.
 * Distances are rounded averages from Earth (Earth orbit is the space station's height).
 */
export const PLANETS: readonly Planet[] = [
  {
    id: 'earth-orbit',
    name: 'Órbita da Terra',
    toName: 'à órbita da Terra',
    minPoints: 0,
    distanceKm: 400,
    fact: 'A Estação Espacial Internacional dá uma volta completa na Terra a cada 90 minutos, mais ou menos.',
  },
  {
    id: 'moon',
    name: 'Lua',
    toName: 'à Lua',
    minPoints: 40,
    distanceKm: 384_400,
    fact: 'A Lua se afasta da Terra cerca de 3,8 centímetros por ano.',
  },
  {
    id: 'mars',
    name: 'Marte',
    toName: 'a Marte',
    minPoints: 100,
    distanceKm: 225_000_000,
    fact: 'Marte tem o Monte Olimpo, um vulcão com cerca de duas vezes e meia a altura do Everest.',
  },
  {
    id: 'jupiter',
    name: 'Júpiter',
    toName: 'a Júpiter',
    minPoints: 180,
    distanceKm: 780_000_000,
    fact: 'Júpiter é tão grande que caberiam mais de 1.300 Terras dentro dele.',
  },
  {
    id: 'saturn',
    name: 'Saturno',
    toName: 'a Saturno',
    minPoints: 270,
    distanceKm: 1_430_000_000,
    fact: 'Saturno é menos denso que a água: numa banheira gigante, ele boiaria.',
  },
  {
    id: 'uranus',
    name: 'Urano',
    toName: 'a Urano',
    minPoints: 370,
    distanceKm: 2_870_000_000,
    fact: 'Urano gira praticamente deitado, com o eixo inclinado quase 98 graus.',
  },
  {
    id: 'neptune',
    name: 'Netuno',
    toName: 'a Netuno',
    minPoints: 480,
    distanceKm: 4_500_000_000,
    fact: 'Em Netuno sopram os ventos mais rápidos do Sistema Solar, acima de 2.000 km/h.',
  },
  {
    id: 'pluto',
    name: 'Plutão',
    toName: 'a Plutão',
    minPoints: 600,
    distanceKm: 5_900_000_000,
    fact: 'Plutão é um planeta-anão, e um ano lá dura 248 anos da Terra.',
  },
];

/**
 * What lies beyond Pluto, for rounds that can go on past the classic route. Distances
 * from NASA: Eris at its average distance from the Sun (68 AU), the heliopause where
 * Voyager 1 crossed it (121 AU), Voyager 1 where it is at the end of 2026 (one light-day),
 * the inner edge of the Oort Cloud (2,000 AU) and Proxima Centauri (4.2 light-years).
 */
export const DEEP_SPACE: readonly Planet[] = [
  {
    id: 'eris',
    name: 'Éris',
    toName: 'a Éris',
    minPoints: 800,
    distanceKm: 10_100_000_000,
    fact: 'Éris é um planeta-anão quase do tamanho de Plutão, e leva 557 anos para dar uma volta no Sol.',
  },
  {
    id: 'heliopause',
    name: 'Heliopausa',
    toName: 'à heliopausa',
    minPoints: 1000,
    distanceKm: 18_200_000_000,
    fact: 'Na heliopausa o vento do Sol perde a força: dali em diante começa o espaço entre as estrelas.',
  },
  {
    id: 'voyager',
    name: 'Voyager 1',
    toName: 'à Voyager 1',
    minPoints: 1300,
    distanceKm: 25_900_000_000,
    fact: 'A Voyager 1 partiu em 1977 e é o objeto feito por humanos que foi mais longe. Um sinal dela leva quase um dia para chegar à Terra.',
  },
  {
    id: 'oort-cloud',
    name: 'Nuvem de Oort',
    toName: 'à Nuvem de Oort',
    minPoints: 1700,
    distanceKm: 300_000_000_000,
    fact: 'A Nuvem de Oort é uma bolha gigante de pedaços de gelo em volta do Sistema Solar. É de lá que vêm muitos cometas.',
  },
  {
    id: 'proxima',
    name: 'Proxima Centauri',
    toName: 'a Proxima Centauri',
    minPoints: 2200,
    distanceKm: 40_000_000_000_000,
    fact: 'Proxima Centauri é a estrela mais próxima do Sol. A luz dela leva mais de 4 anos para chegar aqui.',
  },
];

/** The classic route and, after Pluto, the way out of the Solar System. */
export const EXTENDED_ROUTE: Route = [...PLANETS, ...DEEP_SPACE];
