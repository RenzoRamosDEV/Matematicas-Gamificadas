const ANILLO = '0 0 0 2px var(--color-fondo), 0 0 0 3px var(--color-linea)';

export function Avatar({ nombre, url, size = 38 }: { nombre: string; url?: string | null; size?: number }) {
  if (url) {
    return <img src={url} alt={nombre} width={size} height={size} className="rounded-full object-cover" style={{ boxShadow: ANILLO }} />;
  }
  return (
    <div
      className="rounded-full grid place-items-center font-bold shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.42, color: '#1a1c2a', boxShadow: ANILLO,
        background: 'linear-gradient(150deg, var(--color-amarillo), var(--color-rosa))',
      }}
      aria-label={nombre}
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}
