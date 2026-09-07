// Adivina la bandera (extra). Solo países: los 193 miembros de la ONU
// más Ciudad del Vaticano y Palestina. El emoji se calcula del código ISO.
export interface Pais {
  codigo: string; // ISO 3166-1 alfa-2
  nombre: string; // nombre común en español, con sus tildes
}

export const PAISES: Pais[] = [
  { codigo: 'AF', nombre: 'Afganistán' }, { codigo: 'AL', nombre: 'Albania' }, { codigo: 'DE', nombre: 'Alemania' },
  { codigo: 'AD', nombre: 'Andorra' }, { codigo: 'AO', nombre: 'Angola' }, { codigo: 'AG', nombre: 'Antigua y Barbuda' },
  { codigo: 'SA', nombre: 'Arabia Saudí' }, { codigo: 'DZ', nombre: 'Argelia' }, { codigo: 'AR', nombre: 'Argentina' },
  { codigo: 'AM', nombre: 'Armenia' }, { codigo: 'AU', nombre: 'Australia' }, { codigo: 'AT', nombre: 'Austria' },
  { codigo: 'AZ', nombre: 'Azerbaiyán' }, { codigo: 'BS', nombre: 'Bahamas' }, { codigo: 'BD', nombre: 'Bangladés' },
  { codigo: 'BB', nombre: 'Barbados' }, { codigo: 'BH', nombre: 'Baréin' }, { codigo: 'BE', nombre: 'Bélgica' },
  { codigo: 'BZ', nombre: 'Belice' }, { codigo: 'BJ', nombre: 'Benín' }, { codigo: 'BY', nombre: 'Bielorrusia' },
  { codigo: 'MM', nombre: 'Birmania' }, { codigo: 'BO', nombre: 'Bolivia' }, { codigo: 'BA', nombre: 'Bosnia y Herzegovina' },
  { codigo: 'BW', nombre: 'Botsuana' }, { codigo: 'BR', nombre: 'Brasil' }, { codigo: 'BN', nombre: 'Brunéi' },
  { codigo: 'BG', nombre: 'Bulgaria' }, { codigo: 'BF', nombre: 'Burkina Faso' }, { codigo: 'BI', nombre: 'Burundi' },
  { codigo: 'BT', nombre: 'Bután' }, { codigo: 'CV', nombre: 'Cabo Verde' }, { codigo: 'KH', nombre: 'Camboya' },
  { codigo: 'CM', nombre: 'Camerún' }, { codigo: 'CA', nombre: 'Canadá' }, { codigo: 'QA', nombre: 'Catar' },
  { codigo: 'TD', nombre: 'Chad' }, { codigo: 'CL', nombre: 'Chile' }, { codigo: 'CN', nombre: 'China' },
  { codigo: 'CY', nombre: 'Chipre' }, { codigo: 'VA', nombre: 'Ciudad del Vaticano' }, { codigo: 'CO', nombre: 'Colombia' },
  { codigo: 'KM', nombre: 'Comoras' }, { codigo: 'CG', nombre: 'Congo' }, { codigo: 'KP', nombre: 'Corea del Norte' },
  { codigo: 'KR', nombre: 'Corea del Sur' }, { codigo: 'CI', nombre: 'Costa de Marfil' }, { codigo: 'CR', nombre: 'Costa Rica' },
  { codigo: 'HR', nombre: 'Croacia' }, { codigo: 'CU', nombre: 'Cuba' }, { codigo: 'DK', nombre: 'Dinamarca' },
  { codigo: 'DM', nombre: 'Dominica' }, { codigo: 'EC', nombre: 'Ecuador' }, { codigo: 'EG', nombre: 'Egipto' },
  { codigo: 'SV', nombre: 'El Salvador' }, { codigo: 'AE', nombre: 'Emiratos Árabes Unidos' }, { codigo: 'ER', nombre: 'Eritrea' },
  { codigo: 'SK', nombre: 'Eslovaquia' }, { codigo: 'SI', nombre: 'Eslovenia' }, { codigo: 'ES', nombre: 'España' },
  { codigo: 'US', nombre: 'Estados Unidos' }, { codigo: 'EE', nombre: 'Estonia' }, { codigo: 'SZ', nombre: 'Esuatini' },
  { codigo: 'ET', nombre: 'Etiopía' }, { codigo: 'PH', nombre: 'Filipinas' }, { codigo: 'FI', nombre: 'Finlandia' },
  { codigo: 'FJ', nombre: 'Fiyi' }, { codigo: 'FR', nombre: 'Francia' }, { codigo: 'GA', nombre: 'Gabón' },
  { codigo: 'GM', nombre: 'Gambia' }, { codigo: 'GE', nombre: 'Georgia' }, { codigo: 'GH', nombre: 'Ghana' },
  { codigo: 'GD', nombre: 'Granada' }, { codigo: 'GR', nombre: 'Grecia' }, { codigo: 'GT', nombre: 'Guatemala' },
  { codigo: 'GN', nombre: 'Guinea' }, { codigo: 'GQ', nombre: 'Guinea Ecuatorial' }, { codigo: 'GW', nombre: 'Guinea-Bisáu' },
  { codigo: 'GY', nombre: 'Guyana' }, { codigo: 'HT', nombre: 'Haití' }, { codigo: 'HN', nombre: 'Honduras' },
  { codigo: 'HU', nombre: 'Hungría' }, { codigo: 'IN', nombre: 'India' }, { codigo: 'ID', nombre: 'Indonesia' },
  { codigo: 'IQ', nombre: 'Irak' }, { codigo: 'IR', nombre: 'Irán' }, { codigo: 'IE', nombre: 'Irlanda' },
  { codigo: 'IS', nombre: 'Islandia' }, { codigo: 'MH', nombre: 'Islas Marshall' }, { codigo: 'SB', nombre: 'Islas Salomón' },
  { codigo: 'IL', nombre: 'Israel' }, { codigo: 'IT', nombre: 'Italia' }, { codigo: 'JM', nombre: 'Jamaica' },
  { codigo: 'JP', nombre: 'Japón' }, { codigo: 'JO', nombre: 'Jordania' }, { codigo: 'KZ', nombre: 'Kazajistán' },
  { codigo: 'KE', nombre: 'Kenia' }, { codigo: 'KG', nombre: 'Kirguistán' }, { codigo: 'KI', nombre: 'Kiribati' },
  { codigo: 'KW', nombre: 'Kuwait' }, { codigo: 'LA', nombre: 'Laos' }, { codigo: 'LS', nombre: 'Lesoto' },
  { codigo: 'LV', nombre: 'Letonia' }, { codigo: 'LB', nombre: 'Líbano' }, { codigo: 'LR', nombre: 'Liberia' },
  { codigo: 'LY', nombre: 'Libia' }, { codigo: 'LI', nombre: 'Liechtenstein' }, { codigo: 'LT', nombre: 'Lituania' },
  { codigo: 'LU', nombre: 'Luxemburgo' }, { codigo: 'MK', nombre: 'Macedonia del Norte' }, { codigo: 'MG', nombre: 'Madagascar' },
  { codigo: 'MY', nombre: 'Malasia' }, { codigo: 'MW', nombre: 'Malaui' }, { codigo: 'MV', nombre: 'Maldivas' },
  { codigo: 'ML', nombre: 'Malí' }, { codigo: 'MT', nombre: 'Malta' }, { codigo: 'MA', nombre: 'Marruecos' },
  { codigo: 'MU', nombre: 'Mauricio' }, { codigo: 'MR', nombre: 'Mauritania' }, { codigo: 'MX', nombre: 'México' },
  { codigo: 'FM', nombre: 'Micronesia' }, { codigo: 'MD', nombre: 'Moldavia' }, { codigo: 'MC', nombre: 'Mónaco' },
  { codigo: 'MN', nombre: 'Mongolia' }, { codigo: 'ME', nombre: 'Montenegro' }, { codigo: 'MZ', nombre: 'Mozambique' },
  { codigo: 'NA', nombre: 'Namibia' }, { codigo: 'NR', nombre: 'Nauru' }, { codigo: 'NP', nombre: 'Nepal' },
  { codigo: 'NI', nombre: 'Nicaragua' }, { codigo: 'NE', nombre: 'Níger' }, { codigo: 'NG', nombre: 'Nigeria' },
  { codigo: 'NO', nombre: 'Noruega' }, { codigo: 'NZ', nombre: 'Nueva Zelanda' }, { codigo: 'OM', nombre: 'Omán' },
  { codigo: 'NL', nombre: 'Países Bajos' }, { codigo: 'PK', nombre: 'Pakistán' }, { codigo: 'PW', nombre: 'Palaos' },
  { codigo: 'PS', nombre: 'Palestina' }, { codigo: 'PA', nombre: 'Panamá' }, { codigo: 'PG', nombre: 'Papúa Nueva Guinea' },
  { codigo: 'PY', nombre: 'Paraguay' }, { codigo: 'PE', nombre: 'Perú' }, { codigo: 'PL', nombre: 'Polonia' },
  { codigo: 'PT', nombre: 'Portugal' }, { codigo: 'GB', nombre: 'Reino Unido' }, { codigo: 'CF', nombre: 'República Centroafricana' },
  { codigo: 'CZ', nombre: 'República Checa' }, { codigo: 'CD', nombre: 'República Democrática del Congo' },
  { codigo: 'DO', nombre: 'República Dominicana' }, { codigo: 'RW', nombre: 'Ruanda' }, { codigo: 'RO', nombre: 'Rumanía' },
  { codigo: 'RU', nombre: 'Rusia' }, { codigo: 'WS', nombre: 'Samoa' }, { codigo: 'KN', nombre: 'San Cristóbal y Nieves' },
  { codigo: 'SM', nombre: 'San Marino' }, { codigo: 'VC', nombre: 'San Vicente y las Granadinas' },
  { codigo: 'LC', nombre: 'Santa Lucía' }, { codigo: 'ST', nombre: 'Santo Tomé y Príncipe' }, { codigo: 'SN', nombre: 'Senegal' },
  { codigo: 'RS', nombre: 'Serbia' }, { codigo: 'SC', nombre: 'Seychelles' }, { codigo: 'SL', nombre: 'Sierra Leona' },
  { codigo: 'SG', nombre: 'Singapur' }, { codigo: 'SY', nombre: 'Siria' }, { codigo: 'SO', nombre: 'Somalia' },
  { codigo: 'LK', nombre: 'Sri Lanka' }, { codigo: 'ZA', nombre: 'Sudáfrica' }, { codigo: 'SD', nombre: 'Sudán' },
  { codigo: 'SS', nombre: 'Sudán del Sur' }, { codigo: 'SE', nombre: 'Suecia' }, { codigo: 'CH', nombre: 'Suiza' },
  { codigo: 'SR', nombre: 'Surinam' }, { codigo: 'TH', nombre: 'Tailandia' }, { codigo: 'TZ', nombre: 'Tanzania' },
  { codigo: 'TJ', nombre: 'Tayikistán' }, { codigo: 'TL', nombre: 'Timor Oriental' }, { codigo: 'TG', nombre: 'Togo' },
  { codigo: 'TO', nombre: 'Tonga' }, { codigo: 'TT', nombre: 'Trinidad y Tobago' }, { codigo: 'TN', nombre: 'Túnez' },
  { codigo: 'TM', nombre: 'Turkmenistán' }, { codigo: 'TR', nombre: 'Turquía' }, { codigo: 'TV', nombre: 'Tuvalu' },
  { codigo: 'UA', nombre: 'Ucrania' }, { codigo: 'UG', nombre: 'Uganda' }, { codigo: 'UY', nombre: 'Uruguay' },
  { codigo: 'UZ', nombre: 'Uzbekistán' }, { codigo: 'VU', nombre: 'Vanuatu' }, { codigo: 'VE', nombre: 'Venezuela' },
  { codigo: 'VN', nombre: 'Vietnam' }, { codigo: 'YE', nombre: 'Yemen' }, { codigo: 'DJ', nombre: 'Yibuti' },
  { codigo: 'ZM', nombre: 'Zambia' }, { codigo: 'ZW', nombre: 'Zimbabue' },
];

// 🇪🇸 = dos "regional indicator symbols" a partir del código ISO.
export const emojiDe = (codigo: string) =>
  [...codigo.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');

const normalizar = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '');

export const llevaTilde = (nombre: string) => /[áéíóúü]/i.test(nombre);

// 'con-tilde' → 3 puntos · 'bien' → 2 · 'mal' → 0. La tilde solo puntúa extra
// si el nombre la lleva Y la escribió exacta; sin país con tilde, el máximo es 2.
export type Veredicto = 'con-tilde' | 'bien' | 'mal';

export function evaluar(nombre: string, respuesta: string): Veredicto {
  if (normalizar(respuesta) !== normalizar(nombre)) return 'mal';
  if (!llevaTilde(nombre)) return 'bien';
  const limpia = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return limpia(respuesta) === limpia(nombre) ? 'con-tilde' : 'bien';
}

export const puntosDe = (v: Veredicto) => (v === 'con-tilde' ? 3 : v === 'bien' ? 2 : 0);

export function ronda(n: number, paises: Pais[] = PAISES): Pais[] {
  const copia = [...paises];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, n);
}

export const TIEMPO_POR_BANDERA = 60; // segundos para resolver cada bandera

// Logros del juego: banderas DISTINTAS adivinadas. Repetir una ya adivinada
// da puntos igualmente, pero no avanza los logros.
export const HITOS_BANDERAS = [10, 25, 50, 100, 195];

export function hitosConseguidos(total: number): { conseguidos: number[]; siguiente: number | null } {
  return {
    conseguidos: HITOS_BANDERAS.filter((h) => total >= h),
    siguiente: HITOS_BANDERAS.find((h) => total < h) ?? null,
  };
}
