import { Injectable, computed, signal } from '@angular/core';

import { Rol } from './roles';

/** Lo que el frontend sabe del usuario: sale del contenido (payload) del JWT. */
export interface UsuarioSesion {
  usuario: string; // matrícula o número de empleado
  nombre: string;
  rol: Rol;
  expira: Date;
}

const LLAVE_TOKEN = 'schooldesk.token';

/**
 * Estado de la sesión con signals.
 *
 * El token se guarda en localStorage para que la sesión sobreviva a recargar la
 * página. La desventaja: si la página tuviera una vulnerabilidad XSS, un script
 * podría leerlo. La alternativa (solo en memoria) es más segura pero obliga a
 * iniciar sesión en cada recarga.
 *
 * El frontend solo LEE el token (nombre, rol, expiración) para decidir qué mostrar;
 * no lo valida. Validarlo es trabajo del backend, que tiene la clave.
 */
@Injectable({ providedIn: 'root' })
export class ServicioSesion {
  private readonly token = signal<string | null>(leerTokenGuardado());

  readonly usuario = computed(() => {
    const token = this.token();
    return token ? decodificarToken(token) : null;
  });
  readonly estaAutenticada = computed(() => this.usuario() !== null);
  readonly rol = computed(() => this.usuario()?.rol ?? null);

  constructor() {
    // Un token guardado de una visita anterior puede haber expirado.
    const usuario = this.usuario();
    if (this.token() && (!usuario || usuario.expira <= new Date())) {
      this.cerrar();
    }
  }

  /** Token para el header Authorization (lo usa el interceptor). */
  obtenerToken(): string | null {
    return this.token();
  }

  guardar(token: string): void {
    localStorage.setItem(LLAVE_TOKEN, token);
    this.token.set(token);
  }

  cerrar(): void {
    localStorage.removeItem(LLAVE_TOKEN);
    this.token.set(null);
  }
}

function leerTokenGuardado(): string | null {
  return localStorage.getItem(LLAVE_TOKEN);
}

/**
 * Lee el contenido del JWT. Un JWT tiene 3 partes separadas por puntos:
 * encabezado.contenido.firma. El contenido está en base64url (base64 con - y _).
 * Devuelve null si el token no tiene el formato esperado.
 */
export function decodificarToken(token: string): UsuarioSesion | null {
  try {
    const contenido = token.split('.')[1];
    const base64 = contenido.replace(/-/g, '+').replace(/_/g, '/');
    // atob devuelve bytes; TextDecoder los convierte a texto UTF-8 para que los
    // acentos ("Méndez") se lean bien.
    const bytes = Uint8Array.from(atob(base64), (caracter) => caracter.charCodeAt(0));
    const datos = JSON.parse(new TextDecoder().decode(bytes));

    if (!Object.values(Rol).includes(datos.rol)) {
      return null; // un rol desconocido no se acepta, igual que en el backend
    }
    return {
      usuario: datos.sub,
      nombre: datos.nombre,
      rol: datos.rol,
      expira: new Date(datos.exp * 1000), // exp viene en segundos
    };
  } catch {
    return null;
  }
}
