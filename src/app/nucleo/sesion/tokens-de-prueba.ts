/**
 * Ayudante SOLO para las pruebas: arma un JWT con el mismo contenido que firma
 * servicio-auth. La firma es falsa, pero el frontend no la valida (eso lo hace
 * el backend), así que para probar el frontend basta con el contenido.
 */

import { Rol } from './roles';

export function crearTokenDePrueba(
  rol: Rol | string = Rol.DOCENTE,
  { minutosParaExpirar = 60, nombre = 'Laura Méndez Ortega', usuario = '100521347' } = {},
): string {
  const contenido = {
    sub: usuario,
    nombre,
    rol,
    exp: Math.floor(Date.now() / 1000) + minutosParaExpirar * 60,
  };
  return `encabezado.${aBase64Url(JSON.stringify(contenido))}.firma`;
}

function aBase64Url(texto: string): string {
  // TextEncoder para que los acentos se codifiquen en UTF-8, como en un JWT real.
  const bytes = new TextEncoder().encode(texto);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
