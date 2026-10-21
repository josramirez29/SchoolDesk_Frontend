import { DecimalPipe } from '@angular/common';
import { Component, OnInit, effect, inject, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { descargarCsv } from '../../../../compartido/descargar-csv';
import { AcademicoApi } from '../../../../nucleo/api/academico.api';
import { FilaReporte, ReporteMateria } from '../../../../nucleo/api/modelos';

const CALIFICACION_APROBATORIA = 6;
const ASISTENCIA_MINIMA = 80; // porcentaje a partir del cual se resalta en rojo

/**
 * Reporte de la materia: calificaciones (academico) y asistencia (asistencia).
 *
 * Si servicio-asistencia no responde, el reporte sale igual con las
 * calificaciones y un aviso: es la degradación elegante del backend.
 */
@Component({
  selector: 'app-reporte',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './reporte.html',
  styleUrl: './reporte.scss',
})
export class Reporte implements OnInit {
  private readonly api = inject(AcademicoApi);

  readonly nrc = input.required<string>();
  readonly reporte = signal<ReporteMateria | null>(null);
  readonly columnas = ['alumno', 'promedio', 'presentes', 'retardos', 'faltas', 'porcentaje'];

  // MatTableDataSource permite ordenar la tabla con MatSort sin volver al servidor.
  readonly filas = new MatTableDataSource<FilaReporte>([]);
  private readonly ordenamiento = viewChild(MatSort);

  constructor() {
    // La tabla (y su MatSort) aparece hasta que llegan los datos; el effect conecta el
    // ordenamiento en cuanto el viewChild tiene valor.
    effect(() => {
      const ordenamiento = this.ordenamiento();
      if (ordenamiento) this.filas.sort = ordenamiento;
    });

    // Las columnas con datos anidados o nulos necesitan decir cómo se ordenan.
    this.filas.sortingDataAccessor = (fila, columna) => {
      switch (columna) {
        case 'alumno':
          return `${fila.apellidos} ${fila.nombre}`;
        case 'promedio':
          return fila.promedio ?? -1; // sin calificaciones va al final
        default:
          return (
            fila.asistencia?.[columna as 'presentes' | 'retardos' | 'faltas' | 'porcentaje'] ?? -1
          );
      }
    };
  }

  ngOnInit(): void {
    this.api.obtenerReporte(this.nrc()).subscribe((reporte) => {
      this.reporte.set(reporte);
      this.filas.data = reporte.alumnos;
    });
  }

  reprobado(promedio: number | null): boolean {
    return promedio !== null && promedio < CALIFICACION_APROBATORIA;
  }

  asistenciaBaja(porcentaje: number | null | undefined): boolean {
    return porcentaje !== null && porcentaje !== undefined && porcentaje < ASISTENCIA_MINIMA;
  }

  descargar(): void {
    const reporte = this.reporte();
    if (!reporte) return;
    descargarCsv(`reporte-${reporte.materia.nrc}.csv`, [
      [
        'Matrícula',
        'Apellidos',
        'Nombre',
        'Promedio',
        'Presentes',
        'Retardos',
        'Faltas',
        '% asistencia',
      ],
      // Se exporta en el orden en que se ve la tabla.
      ...this.filas
        .sortData(this.filas.data, this.filas.sort ?? new MatSort())
        .map((fila) => [
          fila.matricula,
          fila.apellidos,
          fila.nombre,
          fila.promedio,
          fila.asistencia?.presentes,
          fila.asistencia?.retardos,
          fila.asistencia?.faltas,
          fila.asistencia?.porcentaje,
        ]),
    ]);
  }
}
