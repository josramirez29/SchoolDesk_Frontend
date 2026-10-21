import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { Materia } from '../../../nucleo/api/modelos';

/** Las materias que imparte el docente (el backend ya devuelve solo las suyas). */
@Component({
  selector: 'app-mis-materias-docente',
  imports: [MatCardModule, MatIconModule, MatProgressBarModule, RouterLink],
  templateUrl: './mis-materias.html',
  styleUrl: './mis-materias.scss',
})
export class MisMateriasDocente {
  readonly materias = signal<Materia[]>([]);
  readonly cargando = signal(true);

  constructor() {
    inject(AcademicoApi)
      .listarMaterias()
      .subscribe({
        next: (materias) => {
          this.materias.set(materias);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}
