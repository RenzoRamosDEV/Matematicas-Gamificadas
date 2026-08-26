import { CONFIG } from '../config';
import { supabase } from './supabase';

const emailDe = (usuario: string) => `${usuario.trim().toLowerCase()}@${CONFIG.AUTH_EMAIL_DOMAIN}`;

/**
 * Login normal: usuario + contraseña (la contraseña la fija quien administra el juego
 * en Supabase → Authentication → Users). Devuelve un mensaje de error o null si entró.
 */
export async function entrar(usuario: string, password: string): Promise<string | null> {
  if (!usuario.trim() || !password) return 'Escribe tu usuario y tu contraseña.';
  const { error } = await supabase.auth.signInWithPassword({ email: emailDe(usuario), password });
  return error ? 'Usuario o contraseña incorrectos.' : null;
}

export async function salir() {
  await supabase.auth.signOut();
}

/**
 * Acceso directo opcional por link: https://.../juego/?u=abel&t=<contraseña>
 * Tras entrar, se limpia la URL para que la contraseña no acabe en el historial.
 * Devuelve un mensaje de error si el link no vale; null si todo fue bien o no había token.
 */
export async function entrarConToken(): Promise<string | null> {
  const params = new URLSearchParams(location.search);
  const token = params.get('t');
  if (!token) return null;

  const usuario = params.get('u') ?? CONFIG.USUARIO_POR_DEFECTO;
  const { error } = await supabase.auth.signInWithPassword({ email: emailDe(usuario), password: token });

  history.replaceState(null, '', location.pathname);
  return error ? 'Ese link no funciona. Entra con tu usuario y contraseña.' : null;
}

export async function haySesion(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}
