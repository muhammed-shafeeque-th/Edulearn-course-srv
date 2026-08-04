#!/usr/bin/env node

/**
 * db-migration.js
 *
 * Script for managing and generating TypeORM migrations using the TypeORM CLI via package.json scripts.
 * This allows you to run all typical migration tasks (generate, create, run, revert, show, run:ts) by invoking this script,
 * which can also be referenced directly as an npm script ("cmd") in package.json.
 *
 * Example usage:
 *   node scripts/db-migration.js generate <MigrationName>
 *   node scripts/db-migration.js create <MigrationName>
 *   node scripts/db-migration.js run
 *   node scripts/db-migration.js revert
 *   node scripts/db-migration.js show
 *   node scripts/db-migration.js run:ts
 *
 * To add a package.json script:
 *   "migrate": "node scripts/db-migration.js"
 * Then call: npm run migrate -- <command> [migration-name]
 * Example: npm run migrate -- generate AddUserTable
 */

const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];
const migrationName = args[1];

// Command map: maps CLI command to how to call TypeORM CLI (mirroring package.json scripts)
const SCRIPT_MAP = {
  generate: name => [
    'npx',
    [
      'typeorm',
      'migration:generate',
      `src/infrastructure/database/migrations/${name}`,
      '-d',
      'dist/infrastructure/database/typeorm.datasource.js'
    ]
  ],
  create: name => [
    'npx',
    [
      'typeorm',
      'migration:create',
      `src/infrastructure/database/migrations/${name}`,
    ]
  ],
  run: () => [
    'node',
    [
      './node_modules/typeorm/cli.js',
      'migration:run',
      '-d',
      'dist/infrastructure/database/typeorm.datasource.js'
    ]
  ],
  revert: () => [
    'node',
    [
      './node_modules/typeorm/cli.js',
      'migration:revert',
      '-d',
      'dist/infrastructure/database/typeorm.datasource.js'
    ]
  ],
  show: () => [
    'node',
    [
      './node_modules/typeorm/cli.js',
      'migration:show',
      '-d',
      'dist/infrastructure/database/typeorm.datasource.js'
    ]
  ],
  'run:ts': () => [
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'cross-env',
      'NODE_ENV=development',
      'ts-node',
      './node_modules/typeorm/cli.js',
      'migration:run',
      '-d',
      'src/infrastructure/database/typeorm.datasource.ts'
    ]
  ]
};

function printUsage() {
  console.log(`
Usage: node scripts/db-migration.js <command> [migration-name]

Commands:
  generate <migration-name>   Generate a migration file based on model changes
  create <migration-name>     Create a new blank migration file
  run                        Apply all pending migrations
  revert                     Revert the latest executed migration
  show                       Show current migration status/history
  run:ts                     Run migrations in TypeScript using ts-node (for development)

Then call: npm run migrate -- <command> [migration-name]
Example: npm run migrate -- generate AddUserTable
`);
}

if (!command || !(command in SCRIPT_MAP)) {
  printUsage();
  process.exit(1);
}
if ((command === 'generate' || command === 'create') && !migrationName) {
  console.error(`\nError: migration-name argument is required for '${command}'\n`);
  printUsage();
  process.exit(1);
}

let execCommand, execArgs;
if (command === 'generate' || command === 'create') {
  [execCommand, execArgs] = SCRIPT_MAP[command](migrationName);
} else {
  [execCommand, execArgs] = SCRIPT_MAP[command]();
}

const result = spawnSync(execCommand, execArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}
