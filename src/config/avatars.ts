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
    scale: 1.18,
    skin: '#b7794c',
    hair: '#151113',
    outfit: '#17151a',
    accent: '#d9b36a',
    glasses: false,
  },
  santana: {
    key: 'santana',
    role: 'santana',
    displayName: 'Santana',
    heightLabel: '5 ft 8 in',
    scale: 1,
    skin: '#7f4329',
    hair: '#15100f',
    outfit: '#f7efe5',
    accent: '#b87431',
    glasses: true,
  },
};

export const childNpcConfigs = [
  {
    name: 'Lael',
    skin: '#8c5234',
    hair: '#17100f',
    outfit: '#d5a845',
    position: [4.3, 0, 2.8] as const,
  },
  {
    name: 'Leila',
    skin: '#7d462f',
    hair: '#18100f',
    outfit: '#8e4163',
    position: [5.2, 0, 2.2] as const,
  },
];
