import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  merge,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { Alumno } from '../../../nucleo/api/modelos';
import { DialogoAlumno } from './dialogo-alumno';

@Component({
  selector: 'app-alumnos',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
  templateUrl: './alumnos.html',
  styleUrl: './alumnos.scss',
})
export class Alumnos {
  private readonly api = inject(AcademicoApi);
  private readonly dialogo = inject(MatDialog);
  private readonly recargar = new Subject<void>();

  readonly busqueda = new FormControl('', { nonNullable: true });
  readonly alumnos = signal<Alumno[]>([]);
  readonly cargando = signal(true);
  readonly columnas = ['matricula', 'apellidos', 'nombre', 'acciones'];

  constructor() {
    const busquedaEscrita = this.busqueda.valueChanges.pipe(
      debounceTime(300), // espera a que termine de escribir
      distinctUntilChanged(),
    );
    merge(busquedaEscrita, this.recargar)
      .pipe(
        startWith(null), // carga la lista al entrar
        tap(() => this.cargando.set(true)),
        // switchMap cancela la búsqueda anterior si llega una nueva: así una
        // respuesta lenta de "ana" nunca pisa los resultados de "anab".
        switchMap(() =>
          this.api.buscarAlumnos(this.busqueda.value.trim()).pipe(catchError(() => of([]))),
        ),
        takeUntilDestroyed(), // deja de escuchar al salir de la pantalla
      )
      .subscribe((alumnos) => {
        this.alumnos.set(alumnos);
        this.cargando.set(false);
      });
  }

  nuevo(): void {
    this.abrirDialogo(null);
  }

  editar(alumno: Alumno): void {
    this.abrirDialogo(alumno.matricula);
  }

  private abrirDialogo(matricula: string | null): void {
    this.dialogo
      .open(DialogoAlumno, { data: matricula, width: '520px' })
      .afterClosed()
      .subscribe((guardado) => guardado && this.recargar.next());
  }
}
