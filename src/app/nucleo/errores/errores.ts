import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

/** Formato de TODOS los errores del backend (definido en comun/errores.py). */
export interface ErrorApi {
  error: string; // código, p. ej. "YA_INSCRITO"
  detalle: string; // mensaje para mostrar
  [extra: string]: unknown; // datos adicionales, p. ej. "filas" en la importación
}

/**
 * Las pantallas que muestran el error a su manera (p. ej. la importación, que
 * enseña la tabla de filas con error) desactivan el aviso automático:
 *   http.post(url, datos, { context: new HttpContext().set(SIN_AVISO_DE_ERROR, true) })
 */
export const SIN_AVISO_DE_ERROR = new HttpContextToken<boolean>(() => false);

/** Muestra el `detalle` de cualquier error en un aviso, en un solo lugar para toda la app. */
export const erroresInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const avisos = inject(MatSnackBar);

  return siguiente(peticion).pipe(
    catchError((error: unknown) => {
      // El 401 lo maneja el interceptor de sesión (manda al login).
      const debeAvisar =
        error instanceof HttpErrorResponse &&
        error.status !== 401 &&
        !peticion.context.get(SIN_AVISO_DE_ERROR);
      if (debeAvisar) {
        avisos.open(mensajeDeError(error), 'Cerrar', { duration: 6000 });
      }
      return throwError(() => error);
    }),
  );
};

/** Texto para el usuario a partir de cualquier error HTTP. */
export function mensajeDeError(error: HttpErrorResponse): string {
  const cuerpo = error.error as Partial<ErrorApi> | null;
  if (cuerpo?.detalle) {
    return cuerpo.detalle;
  }
  if (error.status === 0) {
    return 'No hay conexión con el servidor. Revisa que el backend esté encendido.';
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
