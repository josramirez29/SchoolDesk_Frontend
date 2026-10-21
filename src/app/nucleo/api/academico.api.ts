import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Alumno, AlumnoDetalle, AlumnoNuevo } from './modelos';

/** Llamadas a servicio-academico a través del gateway (/api/academico/...). */
@Injectable({ providedIn: 'root' })
export class AcademicoApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.urlApi}/academico`;

  // --- Alumnos (admin) ---

  buscarAlumnos(buscar = ''): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(`${this.url}/alumnos`, { params: buscar ? { buscar } : {} });
  }

  obtenerAlumno(matricula: string): Observable<AlumnoDetalle> {
    return this.http.get<AlumnoDetalle>(`${this.url}/alumnos/${matricula}`);
  }

  crearAlumno(alumno: AlumnoNuevo): Observable<Alumno> {
    return this.http.post<Alumno>(`${this.url}/alumnos`, alumno);
  }

  editarAlumno(
    matricula: string,
    cambios: Partial<Pick<Alumno, 'nombre' | 'apellidos'>>,
  ): Observable<Alumno> {
    return this.http.patch<Alumno>(`${this.url}/alumnos/${matricula}`, cambios);
  }
}
