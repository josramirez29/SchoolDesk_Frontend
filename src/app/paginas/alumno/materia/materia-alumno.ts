import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { AsistenciaApi } from '../../../nucleo/api/asistencia.api';
import { EstadoMiAsistencia, MiAsistencia, MisCalificaciones } from '../../../nucleo/api/modelos';

const CALIFICACION_APROBATORIA = 6;

const TEXTO_DEL_ESTADO: Record<EstadoMiAsistencia, string> = {
  PRESENTE: 'Presente',
  RETARDO: 'Retardo',
  FALTA: 'Falta',
  EN_CURSO: 'En curso',
};

/**
 * Una materia del alumno: sus calificaciones (academico) y su asistencia (asistencia).
 *
 * Las dos partes se piden por separado: si asistencia no responde, el alumno
 * ve sus calificaciones de todas formas (la misma idea que el reporte del docente).
 */
@Component({
  selector: 'app-materia-alumno',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink,
  ],
  templateUrl: './materia-alumno.html',
  styleUrl: './materia-alumno.scss',
})
export class MateriaAlumno implements OnInit {
  private readonly academicoApi = inject(AcademicoApi);
  private readonly asistenciaApi = inject(AsistenciaApi);

  readonly nrc = input.required<string>();

  readonly calificaciones = signal<MisCalificaciones | null>(null);
  readonly asistencia = signal<MiAsistencia | null>(null);
  readonly asistenciaNoDisponible = signal(false);

  ngOnInit(): void {
    this.academicoApi
      .misCalificaciones(this.nrc())
      .subscribe((calificaciones) => this.calificaciones.set(calificaciones));

    this.asistenciaApi.miAsistencia(this.nrc()).subscribe({
      next: (asistencia) => this.asistencia.set(asistencia),
      error: () => this.asistenciaNoDisponible.set(true),
    });
  }

  reprobado(promedio: number | null): boolean {
    return promedio !== null && promedio < CALIFICACION_APROBATORIA;
  }

  textoDelEstado(estado: EstadoMiAsistencia): string {
    return TEXTO_DEL_ESTADO[estado];
  }
}
