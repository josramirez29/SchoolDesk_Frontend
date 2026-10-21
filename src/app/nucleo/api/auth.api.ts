import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SIN_AVISO_DE_ERROR } from '../errores/errores';
import { Rol } from '../sesion/roles';
import { RespuestaLogin, Usuario, UsuarioEdicion, UsuarioNuevo } from './modelos';

/** Llamadas a servicio-auth a través del gateway (/api/auth/...). */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.urlApi}/auth`;

  login(usuario: string, contrasena: string): Observable<RespuestaLogin> {
    // La pantalla de login muestra el error dentro del formulario, no en un aviso.
    const context = new HttpContext().set(SIN_AVISO_DE_ERROR, true);
    return this.http.post<RespuestaLogin>(
      `${this.url}/login`,
      { usuario, contrasena },
      { context },
    );
  }

  perfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/perfil`);
  }

  cambiarContrasena(contrasenaActual: string, contrasenaNueva: string): Observable<void> {
    const context = new HttpContext().set(SIN_AVISO_DE_ERROR, true);
    return this.http.put<void>(
      `${this.url}/perfil/contrasena`,
      { contrasena_actual: contrasenaActual, contrasena_nueva: contrasenaNueva },
      { context },
    );
  }

  // --- Usuarios (admin) ---

  listarUsuarios(rol?: Rol): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.url}/usuarios`, { params: rol ? { rol } : {} });
  }

  obtenerUsuario(usuario: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/usuarios/${usuario}`);
  }

  crearUsuario(datos: UsuarioNuevo): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/usuarios`, datos);
  }

  editarUsuario(usuario: string, cambios: UsuarioEdicion): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/usuarios/${usuario}`, cambios);
  }
}
