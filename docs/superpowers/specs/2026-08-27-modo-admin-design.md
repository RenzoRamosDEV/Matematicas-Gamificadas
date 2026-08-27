# Modo admin: panel de estadísticas protegido por PIN

Fecha: 2026-08-27 · Estado: aprobado en conversación.

## Objetivo

Que la persona adulta que acompaña al jugador pueda ver, dentro de la misma sesión del jugador, un panel de solo lectura con su rendimiento: días/semanas/meses/años, aciertos y fallos, promedios de acierto y de tiempo, puntos débiles por tipo de cuenta y las cuentas de cualquier día con sus respuestas. Acceso desde un menú de perfil, protegido por PIN.

## Decisiones (respuestas del usuario)

- Protección: **PIN dentro de la sesión del jugador** (no una cuenta admin aparte). PIN: `15591403`. Se guarda en el código solo su hash SHA-256; se compara en el navegador. Es una barrera frente al niño, no frente a alguien con conocimientos: se documenta así.
- Entrada: el bloque **avatar + nombre** de la cabecera pasa a ser un botón con menú: *Mi progreso · Mis logros · Modo admin · Salir*. El botón Salir independiente desaparece.
- Apuntes del niño: **no** se muestran en el panel.
- Extras: **puntos débiles** y **tiempo por cuenta**. Fuera: exportar CSV, ajustes del juego, varios jugadores.

## Alcance

**Dentro**
- `MenuPerfil` en la cabecera (menú de vidrio, cierre con Escape y clic fuera).
- Pantalla `Pin` (teclado numérico reutilizando `Keypad`, 8 dígitos, error si no coincide). Desbloqueo recordado en `sessionStorage` (`reto:admin`) hasta cerrar la pestaña o pulsar "Bloquear".
- Pantalla `Admin` en `#admin` con cinco secciones (abajo).
- `lib/estadisticas.ts` (lógica pura, con tests) y `api.cargarTodasLasCuentas()`.

**Fuera**: cambios en Supabase (tablas, RLS, permisos), apuntes, exportación, ajustes, multijugador.

## Datos

Todo se calcula en el cliente a partir de lo que la cuenta ya puede leer:
- `sessions` (todas las del jugador, completadas y en curso; ya se cargan las completadas: se amplía a todas con su estado).
- `exercises` de todas sus sesiones: nueva `cargarTodasLasCuentas(): Promise<EjercicioDB[]>` (`select *` con `limit 20000`, orden por sesión y `orden`). RLS ya restringe a las propias. Volumen: 20 por día, ~7.300 al año.
- Cada cuenta lleva `a, b, op, sol, respuesta, correcta, ms` (ms = tiempo acumulado en esa cuenta). La fecha sale de su sesión.

## Estadísticas (`lib/estadisticas.ts`)

Entrada: `{ sesiones: Session[]; cuentas: EjercicioDB[] }`. Solo se consideran cuentas de sesiones **completadas** (las de una sesión en curso aún no están corregidas).

- `resumenGeneral`: retos completados, cuentas totales, aciertos, porcentaje, promedio de aciertos por reto (sobre 20), tiempo medio por cuenta (s, sobre cuentas con `ms`), puntos totales, mejor racha (del perfil).
- `porPeriodo(granularidad: 'dia' | 'semana' | 'mes' | 'anio')`: lista ordenada descendente de `{ clave, etiqueta, retos, cuentas, aciertos, fallos, porcentaje, tiempoMedio, puntos }`. Semana = lunes ISO (`lunesDe`), etiqueta "Semana del 24 ago"; mes "Agosto 2026"; año "2026".
- `porOperacion`: por `op`: cuentas, aciertos, porcentaje, tiempo medio.
- `puntosDebiles`:
  - sumas: con llevadas vs sin (`tieneLlevadas` del generador);
  - restas: con préstamos vs sin (`tienePrestamos`);
  - multiplicaciones: por multiplicador `b` (tabla del 2 al 9);
  - divisiones: por divisor `b`;
  - `masFalladas`: top 10 de `a op b` por número de fallos, con las respuestas dadas y la correcta.
- `tiempos`: promedio general, por operación, y evolución por semana y por mes (`{ etiqueta, tiempoMedio }`).
- `cuentasDelDia(fecha)`: las cuentas de esa sesión con `segundos` por cuenta.

Reglas: "correcta" = `esCorrecta` de `lib/correccion.ts`. Divisiones por cero de promedio → `null` (se muestra "—").

## Pantallas

### Menú de perfil (`components/MenuPerfil.tsx`)
Botón (avatar + nombre + chevron) → menú de vidrio anclado bajo el botón: Mi progreso (`#progreso`), Mis logros (`#logros`), Modo admin (`#admin`, icono candado), separador, Salir. `aria-haspopup`, `aria-expanded`, cierra con Escape/clic fuera/selección.

### Pin (`screens/Pin.tsx`)
Tarjeta de vidrio: candado, "Modo admin", "Escribe el PIN de familia", 8 celdas de puntos que se rellenan, `Keypad` (borrar/OK). OK compara SHA-256 (Web Crypto) con `CONFIG.ADMIN_PIN_SHA256`; si falla, sacude y vacía; si acierta, guarda `sessionStorage['reto:admin']='1'` y muestra el panel. Enlace "Inicio" para salir.

### Admin (`screens/Admin.tsx`)
Cabecera + botón "Bloquear" (borra el desbloqueo y vuelve al inicio) y "Inicio". Secciones:
1. **Resumen general**: 6 tarjetas.
2. **Por periodo**: segmentos Día/Semana/Mes/Año + gráfica de barras (porcentaje de aciertos por periodo, últimos 12–30 según granularidad) + tabla (periodo, retos, aciertos/cuentas, %, fallos, tiempo medio, puntos).
3. **Puntos débiles**: barras por operación; pares "con/sin llevadas", "con/sin préstamos"; barras por tabla (×2…×9) y por divisor; lista "más falladas".
4. **Tiempo por cuenta**: tarjetas (general y por operación) + gráfica de evolución (semanas/meses).
5. **Día a día**: `Calendario` (reutilizado) → panel con las cuentas del día (`Correccion` + segundos por cuenta) y su total.

Gráficas: barras/líneas en SVG inline propio (sin librerías), colores del sistema, accesibles (título y tabla equivalente). Estado vacío claro cuando aún no hay retos completados.

### App
- Ruta `#admin`. Si `sessionStorage['reto:admin']` no es `'1'` → `Pin`; si lo es → `Admin`.
- Carga de `cargarTodasLasCuentas()` al abrir `Admin` (no en el arranque), con `reintentar`.
- `Cabecera` recibe `onIr(vista)` y `onSalir`; se elimina el botón Salir.

## Verificación
- Tests de `estadisticas.ts`: agrupación por periodo (cruce de mes/año), porcentajes, clasificación llevadas/préstamos/tablas/divisores, más falladas, tiempos con `ms` nulos, exclusión de sesiones en curso.
- Test del hash del PIN.
- Recorrido real con un jugador de pruebas (no la cuenta del usuario): menú → Modo admin → PIN incorrecto → PIN correcto → panel con datos → día a día → Bloquear.
