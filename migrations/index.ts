import * as migration_20261109_223002_initial from './20261109_223002_initial';

export const migrations = [
  {
    up: migration_20261109_223002_initial.up,
    down: migration_20261109_223002_initial.down,
    name: '20261109_223002_initial'
  },
];
