import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SIN_AVISO_DE_ERROR } from '../errores/errores';
import { ResultadoImportacion } from './modelos';

/**
 * Sube un CSV a cualquier endpoint de importación (auth o academico).
 *
 * Va como multipart/form-data con el campo "archivo", que es lo que espera el
 * UploadFile del backend. Sin aviso automático de error: la pantalla de
 * importación muestra los errores en su propia tabla, fila por fila.
 */
export function subirCsv(
  http: HttpClient,
  url: string,
  archivo: File,
): Observable<ResultadoImportacion> {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  const context = new HttpContext().set(SIN_AVISO_DE_ERROR, true);
  return http.post<ResultadoImportacion>(url, formulario, { context });
}
