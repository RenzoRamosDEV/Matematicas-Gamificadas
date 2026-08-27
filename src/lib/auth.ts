import { CONFIG } from '../config';
import { supabase } from './supabase';

const emailDe = (usuario: string) => `${usuario.trim().toLowerCase()}@${CONFIG.AUTH_EMAIL_DOMAIN}`;

export async function entrar(usuario: string, password: string): Promise<string | null> {
  if (!usuario.trim() || !password) return 'Escribe tu usuario y tu contraseña.';
  const { error } = await supabase.auth.signInWithPassword({ email: emailDe(usuario), password });
  return error ? 'Usuario o contraseña incorrectos.' : null;
}

export async function salir() {
  await supabase.auth.signOut();
}

export async function entrarConToken(): Promise<string | null> {
  const params = new URLSearchParams(location.search);
  const token = params.get('t');
  if (!token) return null;

  const usuario = params.get('u');
  const { error } = usuario
    ? await supabase.auth.signInWithPassword({ email: emailDe(usuario), password: token })
    : { error: new Error('link sin usuario') };

  history.replaceState(null, '', location.pathname + location.hash);
  return error ? 'Ese link no funciona. Entra con tu usuario y contraseña.' : null;
}

export async function haySesion(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}
