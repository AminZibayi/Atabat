import * as migration_20251231_210954 from './20251231_210954';

export const migrations = [
  {
    up: migration_20251231_210954.up,
    down: migration_20251231_210954.down,
    name: '20251231_210954',
  },
];
