/** Guijarro de vidrio: la mascota del sistema. Flota, parpadea y tiene tres destellos. */
export function Mascota({ size = 200, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative grid place-items-center ${className}`} style={{ width: size * 1.3, height: size * 1.25 }} aria-hidden="true">
      <div className="guijarro-sombra inset-x-0 mx-auto" style={{ bottom: size * 0.02, width: size * 0.8, height: size * 0.1 }} />
      <div className="guijarro" style={{ width: size, height: size * 0.93 }}>
        <div className="guijarro-brillo" />
        <div className="guijarro-nucleo" />
        <div className="guijarro-ojo" style={{ left: '33%' }} />
        <div className="guijarro-ojo" style={{ right: '33%' }} />
        <div className="guijarro-rubor" style={{ left: '20%' }} />
        <div className="guijarro-rubor" style={{ right: '20%' }} />
      </div>
      <i className="destello" style={{ top: '22%', left: '18%', animationDelay: '.2s' }} />
      <i className="destello" style={{ top: '14%', right: '22%', width: 4, height: 4, animationDelay: '1.4s' }} />
      <i className="destello" style={{ bottom: '24%', right: '14%', animationDelay: '2.3s' }} />
    </div>
  );
}
