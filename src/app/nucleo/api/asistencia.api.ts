import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SIN_AVISO_DE_ERROR } from '../errores/errores';
import {
  MiAsistencia,
  QrGenerado,
  RegistroAsistencia,
  SesionDetalle,
  SesionResumen,
} from './modelos';

/** Llamadas a servicio-asistencia a través del gateway (/api/asistencia/...). */
@Injectable({ providedIn: 'root' })
export class AsistenciaApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.urlApi}/asistencia`;

  // --- Sesiones (docente) ---

  /** Sin aviso automático: si ya hay una sesión abierta (409), la pantalla la retoma. */
  abrirSesion(nrc: string): Observable<SesionDetalle> {
    const context = new HttpContext().set(SIN_AVISO_DE_ERROR, true);
    return this.http.post<SesionDetalle>(`${this.url}/sesiones`, { nrc }, { context });
  }

  listarSesiones(nrc: string): Observable<SesionResumen[]> {
    return this.http.get<SesionResumen[]>(`${this.url}/sesiones`, { params: { nrc } });
  }

  obtenerSesion(sesionId: number): Observable<SesionDetalle> {
    return this.http.get<SesionDetalle>(`${this.url}/sesiones/${sesionId}`);
  }

  cerrarSesion(sesionId: number): Observable<SesionDetalle> {
    return this.http.post<SesionDetalle>(`${this.url}/sesiones/${sesionId}/cerrar`, {});
  }

  /** Sin aviso automático: el resultado de cada escaneo se muestra en la propia pantalla. */
  escanear(sesionId: number, token: string): Observable<RegistroAsistencia> {
    const context = new HttpContext().set(SIN_AVISO_DE_ERROR, true);
    return this.http.post<RegistroAsistencia>(
      `${this.url}/sesiones/${sesionId}/escanear`,
      { token },
      { context },
    );
  }

  // --- Alumno ---

  /**
   * Sin aviso automático: si asistencia no responde, la pantalla del alumno muestra
   * sus calificaciones de todas formas y avisa solo en la sección de asistencia.
   */
  miAsistencia(nrc: string): Observable<MiAsistencia> {
    const context = new HttpContext().set(SIN_AVISO_DE_ERROR, true);
    return this.http.get<MiAsistencia>(`${this.url}/mi-asistencia`, { params: { nrc }, context });
  }

  /** Sin aviso automático: la pantalla del QR explica cada caso (sin sesión, ya registrado...). */
  generarQr(nrc: string): Observable<QrGenerado> {
    const context = new HttpContext().set(SIN_AVISO_DE_ERROR, true);
    return this.http.post<QrGenerado>(`${this.url}/qr`, { nrc }, { context });
  }
}
