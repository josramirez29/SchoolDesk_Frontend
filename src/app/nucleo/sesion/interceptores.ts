import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ServicioSesion } from './servicio-sesion';

/** Agrega el JWT a cada petición hacia nuestra API (y solo a ella). */
export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(ServicioSesion).obtenerToken();
  // Solo a nuestra API: el token no debe viajar a ningún otro dominio.
  if (!token || !peticion.url.startsWith(environment.urlApi)) {
    return siguiente(peticion);
  }
  return siguiente(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

/**
 * Si el backend responde 401, el token ya no sirve (expiró o es inválido):
 * se cierra la sesión y se manda al login con un aviso.
 *
 * Por eso el backend nunca usa 401 para otra cosa (contraseña actual incorrecta
 * es 422, error entre servicios es 502): un 401 aquí siempre significa "vuelve a entrar".
 */
export const sesionExpiradaInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(ServicioSesion);
  const router = inject(Router);

  return siguiente(peticion).pipe(
    catchError((error: unknown) => {
      // Sin sesión activa, un 401 es un login fallido: lo maneja la pantalla de login.
      if (error instanceof HttpErrorResponse && error.status === 401 && sesion.estaAutenticada()) {
        sesion.cerrar();
        router.navigate(['/login'], { queryParams: { motivo: 'expirada' } });
      }
      return throwError(() => error);
    }),
  );
};
