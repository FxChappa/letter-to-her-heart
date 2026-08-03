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
    style: 'reader' as const,
    skin: '#8c5234',
    hair: '#17100f',
    outfit: '#d5a845',
    position: [4.45, 0, 1.45] as const,
  },
  {
    name: 'Leila',
    style: 'builder' as const,
    skin: '#7d462f',
    hair: '#18100f',
    outfit: '#8e4163',
    position: [5.15, 0, 2.05] as const,
  },
];
