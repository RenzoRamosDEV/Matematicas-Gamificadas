const COLORES = ['bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-violet-400', 'bg-rose-400', 'bg-teal-400'];

export function Avatar({ nombre, url, size = 48 }: { nombre: string; url?: string | null; size?: number }) {
  if (url) {
    return <img src={url} alt={nombre} width={size} height={size} className="rounded-full object-cover" />;
  }
  const hash = [...nombre].reduce((h, c) => h + c.charCodeAt(0), 0);
  return (
    <div
      className={`${COLORES[hash % COLORES.length]} rounded-full grid place-items-center font-black text-slate-950`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-label={nombre}
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}
