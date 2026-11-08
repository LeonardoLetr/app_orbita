import { Planet } from '../models/planet';

/** Journey stops, ordered by distance and by the points needed to reach them. */
export const PLANETS: readonly Planet[] = [
  {
    id: 'earth-orbit',
    name: 'Órbita da Terra',
    minPoints: 0,
    fact: 'A Estação Espacial Internacional dá uma volta completa na Terra a cada 90 minutos, mais ou menos.',
  },
  {
    id: 'moon',
    name: 'Lua',
    minPoints: 20,
    fact: 'A Lua se afasta da Terra cerca de 3,8 centímetros por ano.',
  },
  {
    id: 'mars',
    name: 'Marte',
    minPoints: 40,
    fact: 'Marte tem o Monte Olimpo, um vulcão com cerca de duas vezes e meia a altura do Everest.',
  },
  {
    id: 'jupiter',
    name: 'Júpiter',
    minPoints: 60,
    fact: 'Júpiter é tão grande que caberiam mais de 1.300 Terras dentro dele.',
  },
  {
    id: 'saturn',
    name: 'Saturno',
    minPoints: 80,
    fact: 'Saturno é menos denso que a água: numa banheira gigante, ele boiaria.',
  },
  {
    id: 'uranus',
    name: 'Urano',
    minPoints: 100,
    fact: 'Urano gira praticamente deitado, com o eixo inclinado quase 98 graus.',
  },
  {
    id: 'neptune',
    name: 'Netuno',
    minPoints: 120,
    fact: 'Em Netuno sopram os ventos mais rápidos do Sistema Solar, acima de 2.000 km/h.',
  },
  {
    id: 'pluto',
    name: 'Plutão',
    minPoints: 140,
    fact: 'Plutão é um planeta-anão, e um ano lá dura 248 anos da Terra.',
  },
];
