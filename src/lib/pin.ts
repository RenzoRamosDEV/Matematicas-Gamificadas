import { CONFIG } from '../config';

export const PIN_LONGITUD = 8;
const CLAVE_DESBLOQUEO = 'reto:admin';

/** SHA-256 en hexadecimal (Web Crypto). */
export async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compara el PIN con la huella guardada en la configuración (el PIN en claro no está en el código). */
export async function pinCorrecto(pin: string): Promise<boolean> {
  return (await sha256Hex(pin)) === CONFIG.ADMIN_PIN_SHA256;
}

/** El desbloqueo dura lo que dure la pestaña. */
export const adminDesbloqueado = () => { try { return sessionStorage.getItem(CLAVE_DESBLOQUEO) === '1'; } catch { return false; } };
export const desbloquearAdmin = () => { try { sessionStorage.setItem(CLAVE_DESBLOQUEO, '1'); } catch { /* ignorar */ } };
export const bloquearAdmin = () => { try { sessionStorage.removeItem(CLAVE_DESBLOQUEO); } catch { /* ignorar */ } };
