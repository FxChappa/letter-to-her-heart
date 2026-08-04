import type { AvatarKey, ProfileRole } from '../lib/supabase/database.types';

export type AvatarConfig = {
  key: AvatarKey;
  role: ProfileRole;
  displayName: string;
  heightLabel: string;
  scale: number;
  skin: string;
  hair: string;
  outfit: string;
  accent: string;
  glasses: boolean;
};

export const avatarConfigs: Record<AvatarKey, AvatarConfig> = {
  aldane: {
    key: 'aldane',
    role: 'aldane',
    displayName: 'Aldane',
    heightLabel: '6 ft 4 in',
    scale: 1.135,
    skin: '#a9653f',
    hair: '#151113',
    outfit: '#17151a',
    accent: '#d9b36a',
    glasses: false,
  },
  santana: {
    key: 'santana',
    role: 'santana',
    displayName: 'Santana',
    heightLabel: '5 ft 7 in',
    scale: 1,
    skin: '#744028',
    hair: '#15100f',
    outfit: '#f7efe5',
    accent: '#b87431',
    glasses: true,
  },
};

export const childNpcConfigs = [
  {
    name: 'Lael',
    gender: 'boy' as const,
    style: 'reader' as const,
    skin: '#8c5234',
    hair: '#17100f',
    outfit: '#d5a845',
    position: [4.45, 0, 1.45] as const,
  },
  {
    name: 'Leila',
    gender: 'girl' as const,
    style: 'builder' as const,
    skin: '#7d462f',
    hair: '#18100f',
    outfit: '#8e4163',
    position: [5.15, 0, 2.05] as const,
  },
];

export const puppyNpcConfig = {
  name: 'Wren',
  coat: '#b97b4e',
  muzzle: '#d9aa79',
  ears: '#74452f',
  collar: '#7b284c',
  path: [
    [4.82, 0, 2.42],
    [4.45, 0, 1.72],
    [3.42, 0, 0.55],
    [0.25, 0, 0.18],
    [-3.5, 0, -0.42],
    [-4.75, 0, -2.35],
    [-2.4, 0, 0.72],
    [1.4, 0, 0.46],
    [4.35, 0, 1.58],
  ] as const,
};
