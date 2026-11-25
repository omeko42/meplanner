#!/usr/bin/env node
/**
 * Generate a scrypt password hash compatible with MEPlanner (`src/lib/auth.ts`).
 *
 * Usage:
 *   node scripts/hash-password.mjs "YourStrongPassword123!"
 *
 * Output can be placed directly into `SUPERADMIN_PASSWORD_HASH` in `.env.local`
 * or Vercel Project Settings -> Environment Variables.
 */
import crypto from 'node:crypto';
import readline from 'node:readline';

function hashScrypt(password) {
  const salt = crypto.randomBytes(8).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

async function main() {
  let plain = process.argv[2];
  if (!plain) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    plain = await new Promise((resolve) => {
      rl.question('Masukkan password yang akan di-hash: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  const trimmed = String(plain || '').trim();
  if (trimmed.length < 8) {
    console.error('Error: Password minimal 8 karakter.');
    process.exit(1);
  }

  const hash = hashScrypt(trimmed);
  console.log('\nHash siap pakai untuk SUPERADMIN_PASSWORD_HASH:\n');
  console.log(hash);
  console.log('');
}

main();
