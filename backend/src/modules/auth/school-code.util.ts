export function generateSchoolCode(schoolName: string): string {
  const words = String(schoolName || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return 'SCH';
  if (words.length === 1) return words[0].slice(0, 4).padEnd(3, 'X');

  const initials = words.map(word => word[0]).join('').slice(0, 6);
  return initials.length >= 3 ? initials : words.join('').slice(0, 4);
}

export function roleLoginId(localPart: string, role: string, schoolCode: string): string {
  const cleanLocal = String(localPart || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'user';
  const cleanRole = String(role || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const cleanCode = String(schoolCode || 'SCH').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'sch';
  return `${cleanLocal}@${cleanRole}.${cleanCode}.edu.pk`;
}
