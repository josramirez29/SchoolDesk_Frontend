import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { MiMateria } from '../../../nucleo/api/modelos';

const CALIFICACION_APROBATORIA = 6;

/** Las materias del alumno con su promedio actual. Pensada primero para el celular. */
@Component({
  selector: 'app-mis-materias-alumno',
  imports: [DecimalPipe, MatCardModule, MatProgressBarModule, RouterLink],
  templateUrl: './mis-materias.html',
  styleUrl: './mis-materias.scss',
})
export class MisMateriasAlumno {
  readonly materias = signal<MiMateria[]>([]);
  readonly cargando = signal(true);

  constructor() {
    inject(AcademicoApi)
      .misMaterias()
      .subscribe({
        next: (materias) => {
          this.materias.set(materias);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  reprobado(promedio: number | null): boolean {
    return promedio !== null && promedio < CALIFICACION_APROBATORIA;
  }
}
