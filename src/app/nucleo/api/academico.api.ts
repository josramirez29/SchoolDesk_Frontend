import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Alumno,
  AlumnoDetalle,
  AlumnoNuevo,
  Materia,
  MateriaEdicion,
  MateriaNueva,
  ResultadoImportacion,
  CalificacionEntrada,
  Categoria,
  CategoriaEntrada,
  Concentrado,
  ReporteMateria,
  Tarea,
} from './modelos';
import { subirCsv } from './subir-csv';

/** Lo que se puede importar en academico (cada uno es un CSV distinto). */
export type TipoImportacion = 'alumnos' | 'materias' | 'inscripciones';

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

  // --- Materias e inscripciones ---

  /** El admin recibe todas; el docente, solo las que imparte (lo decide el backend). */
  listarMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(`${this.url}/materias`);
  }

  obtenerMateria(nrc: string): Observable<Materia> {
    return this.http.get<Materia>(`${this.url}/materias/${nrc}`);
  }

  crearMateria(materia: MateriaNueva): Observable<Materia> {
    return this.http.post<Materia>(`${this.url}/materias`, materia);
  }

  editarMateria(nrc: string, cambios: MateriaEdicion): Observable<Materia> {
    return this.http.patch<Materia>(`${this.url}/materias/${nrc}`, cambios);
  }

  eliminarMateria(nrc: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/materias/${nrc}`);
  }

  listarInscritos(nrc: string): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(`${this.url}/materias/${nrc}/alumnos`);
  }

  inscribir(nrc: string, matricula: string): Observable<Alumno> {
    return this.http.post<Alumno>(`${this.url}/materias/${nrc}/alumnos`, { matricula });
  }

  darDeBaja(nrc: string, matricula: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/materias/${nrc}/alumnos/${matricula}`);
  }

  // --- Ponderaciones: categorías y tareas (docente titular) ---

  obtenerCategorias(nrc: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.url}/materias/${nrc}/categorias`);
  }

  /** Reemplaza la lista completa: los pesos son una regla del conjunto (suman 100). */
  guardarCategorias(nrc: string, categorias: CategoriaEntrada[]): Observable<Categoria[]> {
    return this.http.put<Categoria[]>(`${this.url}/materias/${nrc}/categorias`, categorias);
  }

  crearTarea(nrc: string, categoriaId: number, nombre: string): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.url}/materias/${nrc}/categorias/${categoriaId}/tareas`, {
      nombre,
    });
  }

  renombrarTarea(nrc: string, tareaId: number, nombre: string): Observable<Tarea> {
    return this.http.patch<Tarea>(`${this.url}/materias/${nrc}/tareas/${tareaId}`, { nombre });
  }

  eliminarTarea(nrc: string, tareaId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/materias/${nrc}/tareas/${tareaId}`);
  }

  // --- Calificaciones (docente titular) ---

  obtenerConcentrado(nrc: string): Observable<Concentrado> {
    return this.http.get<Concentrado>(`${this.url}/materias/${nrc}/calificaciones`);
  }

  /** Guarda varias celdas a la vez (todas o ninguna) y devuelve el concentrado actualizado. */
  capturarCalificaciones(nrc: string, entradas: CalificacionEntrada[]): Observable<Concentrado> {
    return this.http.put<Concentrado>(`${this.url}/materias/${nrc}/calificaciones`, entradas);
  }

  // --- Reporte (admin o docente titular) ---

  /** Calificaciones de academico + asistencia de servicio-asistencia, en un solo reporte. */
  obtenerReporte(nrc: string): Observable<ReporteMateria> {
    return this.http.get<ReporteMateria>(`${this.url}/materias/${nrc}/reporte`);
  }

  // --- Importación (admin) ---

  urlPlantilla(tipo: TipoImportacion): string {
    return `${this.url}/importar/${tipo}/plantilla`;
  }

  importar(tipo: TipoImportacion, archivo: File): Observable<ResultadoImportacion> {
    return subirCsv(this.http, `${this.url}/importar/${tipo}`, archivo);
  }
}
