/**
 * Formato de los datos que devuelve y recibe la API.
 *
 * Cada interfaz refleja un esquema de Pydantic del backend, con los mismos nombres
 * de campos. Si el backend cambia un esquema, aquí se cambia la interfaz y el
 * compilador señala cada pantalla afectada.
 */

import { Rol } from '../sesion/roles';

// --- servicio-auth ---

export interface Usuario {
  usuario: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface RespuestaLogin {
  token_acceso: string;
  tipo_token: string;
  usuario: Usuario;
}
