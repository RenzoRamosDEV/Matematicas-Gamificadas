import { useEffect, useState } from 'react';
import { Icono } from '../components/Icono';
import { Keypad } from '../components/Keypad';
import { PIN_LONGITUD, pinCorrecto } from '../lib/pin';

interface Props {
  onDesbloquear: () => void;
  onVolver: () => void;
}

export function Pin({ onDesbloquear, onVolver }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [comprobando, setComprobando] = useState(false);

  const digito = (d: string) => { setError(false); setPin((p) => (p.length < PIN_LONGITUD ? p + d : p)); };
  const borrar = () => { setError(false); setPin((p) => p.slice(0, -1)); };
  const comprobar = async () => {
    if (pin.length !== PIN_LONGITUD || comprobando) return;
    setComprobando(true);
    let ok = false;
    try { ok = await pinCorrecto(pin); } catch { ok = false; }
    setComprobando(false);
    if (ok) onDesbloquear();
    else { setError(true); setPin(''); }
  };

  useEffect(() => {
    const h = (ev: KeyboardEvent) => {
      if (/^[0-9]$/.test(ev.key)) digito(ev.key);
      else if (ev.key === 'Backspace') borrar();
      else if (ev.key === 'Enter') void comprobar();
      else if (ev.key === 'Escape') onVolver();
      else return;
      ev.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className={`glass rounded-[32px] p-7 sm:p-8 max-w-sm w-full flex flex-col items-center gap-5 pop ${error ? 'sacudir' : ''}`}>
        <div className="tile tile-violeta w-16 h-16 rounded-[20px]"><Icono nombre="lock" size={30} /></div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Modo admin</h1>
          <p className="text-tinta-2 text-sm mt-1">Escribe el PIN de familia para ver las estadísticas.</p>
        </div>

        <div className="flex gap-2.5" aria-label={`PIN: ${pin.length} de ${PIN_LONGITUD} dígitos`} role="status">
          {Array.from({ length: PIN_LONGITUD }, (_, i) => (
            <i key={i} className={`w-3 h-3 rounded-full transition ${i < pin.length ? 'bg-tinta' : 'bg-tinta/15'}`} />
          ))}
        </div>
        <p className={`text-sm font-semibold h-5 ${error ? 'text-rojo-2' : 'text-transparent'}`} role="alert">{error ? 'PIN incorrecto' : ' '}</p>

        <Keypad onDigito={digito} onBorrar={borrar} onOk={comprobar} okDisabled={pin.length !== PIN_LONGITUD || comprobando} />

        <button type="button" onClick={onVolver} className="inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition">
          <Icono nombre="chevLeft" size={16} />Volver al inicio
        </button>
      </div>
    </main>
  );
}
