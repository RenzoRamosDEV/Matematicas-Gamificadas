import { CONFIG } from '../config';
import { supabase } from './supabase';

/**
 * Canjea el link único: https://.../juego/?u=hermano&t=<token>
 * El token es la contraseña del usuario <u>@<AUTH_EMAIL_DOMAIN>. Tras entrar, se limpia
 * la URL para que el token no acabe en el historial, capturas o portapapeles.
 * Devuelve un mensaje de error si el link no vale; null si todo fue bien o no había token.
 */
export async function entrarConToken(): Promise<string | null> {
  const params = new URLSearchParams(location.search);
  const token = params.get('t');
  if (!token) return null;

  const usuario = (params.get('u') ?? CONFIG.USUARIO_POR_DEFECTO).toLowerCase();
  const { error } = await supabase.auth.signInWithPassword({
    email: `${usuario}@${CONFIG.AUTH_EMAIL_DOMAIN}`,
    password: token,
  });

  history.replaceState(null, '', location.pathname);
  return error ? 'Ese link no funciona. Pide uno nuevo.' : null;
}

export async function haySesion(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}
