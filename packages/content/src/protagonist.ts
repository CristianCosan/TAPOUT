// The v1 protagonist. Every value here is open to Sir's veto (docs/DECISIONS.md).
// Height and weight match the defaults every v8-v12 balance pass was measured on.

export interface Relationship {
  id: string;
  role: 'partner' | 'parent';
  name: string;
  note: string;
}

export interface ProtagonistDefinition {
  id: string;
  displayName: string;
  fullName: string;
  age: number;
  heightCm: number;
  startWeightKg: number;
  sex: 'man';
  fear: 'dark' | 'injury' | 'failing' | 'empty';
  relationships: readonly Relationship[];
}

export const P1: ProtagonistDefinition = {
  id: 'p1',
  displayName: 'Dan',
  fullName: 'Daniel Brandt',
  age: 34,
  heightCm: 178,
  startWeightKg: 88,
  sex: 'man',
  fear: 'failing',
  relationships: [
    { id: 'mara', role: 'partner', name: 'Mara', note: 'His girlfriend. She pushed him to apply.' },
    { id: 'tomas', role: 'parent', name: 'Tomas', note: 'His father, 66. Retired lineman with a bad knee; taught him the axe.' },
    { id: 'ilse', role: 'parent', name: 'Ilse', note: 'His mother, 63. School librarian; still keeps the landline. Birthday in late October.' },
  ],
};
