import { Icono } from './Icono';

interface Props {
  onDigito: (d: string) => void;
  onBorrar: () => void;
  onOk: () => void;
  okDisabled?: boolean;
}

export function Keypad({ onDigito, onBorrar, onOk, okDisabled }: Props) {
  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto">
      {teclas.map((t) => (
        <button key={t} type="button" className="tecla" onClick={() => onDigito(t)} aria-label={t}>{t}</button>
      ))}
      <button type="button" className="tecla text-rosa-2" onClick={onBorrar} aria-label="Borrar"><Icono nombre="backspace" size={26} /></button>
      <button type="button" className="tecla" onClick={() => onDigito('0')} aria-label="0">0</button>
      <button type="button" className="tecla tecla-ok" onClick={onOk} disabled={okDisabled} aria-label="Aceptar"><Icono nombre="check" size={26} /></button>
    </div>
  );
}
