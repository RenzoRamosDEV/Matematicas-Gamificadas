import type { ButtonHTMLAttributes } from 'react';
import { Icono, type NombreIcono } from './Icono';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primary' | 'glass' | 'peligro';
  icono?: NombreIcono;
  iconoAlFinal?: boolean;
};

export function Boton({ variante = 'primary', icono, iconoAlFinal, className = '', children, type = 'button', ...rest }: Props) {
  const ic = icono ? <Icono nombre={icono} size={18} /> : null;
  return (
    <button type={type} className={`btn btn-${variante} ${className}`} {...rest}>
      {!iconoAlFinal && ic}
      {children}
      {iconoAlFinal && ic}
    </button>
  );
}
