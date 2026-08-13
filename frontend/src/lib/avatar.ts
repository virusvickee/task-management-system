const AVATAR_SIZE_CLASS: Record<number, string> = {
  5: 'w-5 h-5',
  6: 'w-6 h-6',
  7: 'w-7 h-7',
  8: 'w-8 h-8',
};

export function avatarSizeClass(size: number): string {
  return AVATAR_SIZE_CLASS[size] ?? 'w-6 h-6';
}

export const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-blue-500',
];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function avatarInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
