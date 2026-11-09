import { Planet } from '../models/planet';

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
    minPoints: 20,
    distanceKm: 384_400,
    fact: 'A Lua se afasta da Terra cerca de 3,8 centímetros por ano.',
  },
  {
    id: 'mars',
    name: 'Marte',
    toName: 'a Marte',
    minPoints: 40,
    distanceKm: 225_000_000,
    fact: 'Marte tem o Monte Olimpo, um vulcão com cerca de duas vezes e meia a altura do Everest.',
  },
  {
    id: 'jupiter',
    name: 'Júpiter',
    toName: 'a Júpiter',
    minPoints: 60,
    distanceKm: 780_000_000,
    fact: 'Júpiter é tão grande que caberiam mais de 1.300 Terras dentro dele.',
  },
  {
    id: 'saturn',
    name: 'Saturno',
    toName: 'a Saturno',
    minPoints: 80,
    distanceKm: 1_430_000_000,
    fact: 'Saturno é menos denso que a água: numa banheira gigante, ele boiaria.',
  },
  {
    id: 'uranus',
    name: 'Urano',
    toName: 'a Urano',
    minPoints: 100,
    distanceKm: 2_870_000_000,
    fact: 'Urano gira praticamente deitado, com o eixo inclinado quase 98 graus.',
  },
  {
    id: 'neptune',
    name: 'Netuno',
    toName: 'a Netuno',
    minPoints: 120,
    distanceKm: 4_500_000_000,
    fact: 'Em Netuno sopram os ventos mais rápidos do Sistema Solar, acima de 2.000 km/h.',
  },
  {
    id: 'pluto',
    name: 'Plutão',
    toName: 'a Plutão',
    minPoints: 140,
    distanceKm: 5_900_000_000,
    fact: 'Plutão é um planeta-anão, e um ano lá dura 248 anos da Terra.',
  },
];
