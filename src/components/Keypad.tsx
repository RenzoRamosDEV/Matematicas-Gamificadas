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
        <button key={t} type="button" className="key" onClick={() => onDigito(t)} aria-label={t}>{t}</button>
      ))}
      <button type="button" className="key text-rose-300" onClick={onBorrar} aria-label="Borrar">⌫</button>
      <button type="button" className="key" onClick={() => onDigito('0')} aria-label="0">0</button>
      <button
        type="button"
        className="key bg-amber-400 text-slate-950 shadow-[0_5px_0_0_#b45309] disabled:opacity-40"
        onClick={onOk}
        disabled={okDisabled}
        aria-label="Aceptar"
      >
        ✓
      </button>
    </div>
  );
}
