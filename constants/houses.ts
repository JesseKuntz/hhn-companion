import type { ImageSourcePropType } from 'react-native';

export type House = {
  id: string;
  name: string;
  image: ImageSourcePropType;
};

export const HOUSES: House[] = [
  {
    id: 'ozzy-osbourne-prince-of-darkness',
    name: 'Ozzy Osbourne: Prince of Darkness',
    image: require('../assets/houses/ozzy-osbourne-prince-of-darkness.jpg'),
  },
  {
    id: 'evil-dead-burn',
    name: 'Evil Dead Burn',
    image: require('../assets/houses/evil-dead-burn.jpg'),
  },
  {
    id: 'hellraiser',
    name: 'Hellraiser',
    image: require('../assets/houses/hellraiser.jpg'),
  },
  {
    id: 'stranger-things-5',
    name: 'Stranger Things 5',
    image: require('../assets/houses/stranger-things-5.jpg'),
  },
  {
    id: 'sinners',
    name: 'Sinners',
    image: require('../assets/houses/sinners.jpg'),
  },
  {
    id: 'jack-and-oddfellow-chaos-and-control',
    name: 'Jack & Oddfellow: Chaos & Control',
    image: require('../assets/houses/jack-and-oddfellow-chaos-and-control.jpg'),
  },
  {
    id: 'cybergoria',
    name: 'Cybergoria',
    image: require('../assets/houses/cybergoria.jpg'),
  },
  {
    id: 'invasion-alien-abduction',
    name: 'INVASION: Alien Abduction',
    image: require('../assets/houses/invasion-alien-abduction.jpg'),
  },
  {
    id: 'madlands-caged-cannibals',
    name: 'MADLANDS: Caged Cannibals',
    image: require('../assets/houses/madlands-caged-cannibals.jpg'),
  },
  {
    id: 'hr-bloodengutz',
    name: 'H.R. Bloodengutz Presents: A Halloween Fright-Tacular!',
    image: require('../assets/houses/hr-bloodengutz.jpg'),
  },
];

export const HOUSES_ALPHABETICAL: House[] = [...HOUSES].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export const HOUSE_BY_ID: Record<string, House> = Object.fromEntries(
  HOUSES.map((h) => [h.id, h])
);
