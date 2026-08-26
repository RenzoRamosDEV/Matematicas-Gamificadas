#!/usr/bin/env node
// Genera una contraseña aleatoria para un jugador y su link de acceso directo (opcional: también puede entrar con usuario y contraseña).
// Uso: node scripts/token.mjs <usuario> [url-base]
//   node scripts/token.mjs abel https://renzoramosdev.github.io/Matematicas-Gamificadas/
import { randomBytes } from 'node:crypto';

const [usuario = 'abel', base = 'https://renzoramosdev.github.io/Matematicas-Gamificadas/'] = process.argv.slice(2);
// Espejo de CONFIG.AUTH_EMAIL_DOMAIN (src/config.ts). Supabase Auth rechaza dominios reservados (.local, .test…).
const dominio = 'renzoramosdev.github.io';
const token = randomBytes(24).toString('base64url');

console.log(`
Usuario:   ${usuario}
Email:     ${usuario.toLowerCase()}@${dominio}      ← créalo en Supabase → Authentication → Users → Add user
Password:  ${token}                                   ← pégalo como contraseña (marca "Auto Confirm User")

Link único (mándaselo UNA vez; al abrirlo se guarda la sesión y se limpia la URL):
${base}?u=${usuario.toLowerCase()}&t=${token}
`);
