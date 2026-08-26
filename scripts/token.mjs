#!/usr/bin/env node
// Genera el token (contraseña) de un jugador y el link que hay que mandarle.
// Uso: node scripts/token.mjs <usuario> [url-base]
//   node scripts/token.mjs hermano https://tu-usuario.github.io/ejercicio-gamificados/
import { randomBytes } from 'node:crypto';

const [usuario = 'hermano', base = 'https://TU-USUARIO.github.io/ejercicio-gamificados/'] = process.argv.slice(2);
const token = randomBytes(24).toString('base64url');

console.log(`
Usuario:   ${usuario}
Email:     ${usuario.toLowerCase()}@juego.local      ← créalo en Supabase → Authentication → Users → Add user
Password:  ${token}                                   ← pégalo como contraseña (marca "Auto Confirm User")

Link único (mándaselo UNA vez; al abrirlo se guarda la sesión y se limpia la URL):
${base}?u=${usuario.toLowerCase()}&t=${token}
`);
