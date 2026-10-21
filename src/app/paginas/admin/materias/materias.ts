import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { Materia } from '../../../nucleo/api/modelos';
import { DialogoMateria } from './dialogo-materia';

@Component({
  selector: 'app-materias',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
  templateUrl: './materias.html',
  styleUrl: './materias.scss',
})
export class Materias {
  private readonly api = inject(AcademicoApi);
  private readonly dialogo = inject(MatDialog);
  private readonly router = inject(Router);

  readonly materias = signal<Materia[]>([]);
  readonly cargando = signal(true);
  readonly columnas = ['nrc', 'clave', 'nombre', 'seccion', 'docente'];

  readonly busqueda = new FormControl('', { nonNullable: true });
  private readonly textoBuscado = toSignal(this.busqueda.valueChanges, { initialValue: '' });
  readonly filtradas = computed(() => {
    const texto = this.textoBuscado().trim().toLowerCase();
    return this.materias().filter((materia) =>
      `${materia.nrc} ${materia.clave} ${materia.nombre} ${materia.nombre_docente}`
        .toLowerCase()
        .includes(texto),
    );
  });

  constructor() {
    this.cargar();
  }

  abrir(materia: Materia): void {
    this.router.navigate(['/admin/materias', materia.nrc]);
  }

  nueva(): void {
    this.dialogo
      .open(DialogoMateria, { data: null, width: '480px' })
      .afterClosed()
      .subscribe((guardada) => guardada && this.cargar());
  }

  private cargar(): void {
    this.cargando.set(true);
    this.api.listarMaterias().subscribe({
      next: (materias) => {
        this.materias.set(materias);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
