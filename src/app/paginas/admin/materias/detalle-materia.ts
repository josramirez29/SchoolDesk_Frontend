import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, filter, of, switchMap } from 'rxjs';

import { confirmar } from '../../../compartido/dialogo-confirmacion/dialogo-confirmacion';
import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { Alumno, Materia } from '../../../nucleo/api/modelos';
import { DialogoMateria } from './dialogo-materia';

/** Detalle de una materia (/admin/materias/:nrc): sus datos y sus alumnos inscritos. */
@Component({
  selector: 'app-detalle-materia',
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './detalle-materia.html',
  styleUrl: './detalle-materia.scss',
})
export class DetalleMateria implements OnInit {
  private readonly api = inject(AcademicoApi);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  private readonly router = inject(Router);

  /** Llega de la ruta /admin/materias/:nrc (withComponentInputBinding). */
  readonly nrc = input.required<string>();

  readonly materia = signal<Materia | null>(null);
  readonly inscritos = signal<Alumno[]>([]);
  readonly columnas = ['matricula', 'apellidos', 'nombre', 'acciones'];

  // --- Inscribir: se escribe parte del nombre y se elige de las sugerencias ---
  readonly buscador = new FormControl<string | Alumno>('', { nonNullable: true });
  private readonly sugerenciasDelServidor = signal<Alumno[]>([]);
  /** Las sugerencias no incluyen a quien ya está inscrito. */
  readonly sugerencias = computed(() => {
    const yaInscritos = new Set(this.inscritos().map((alumno) => alumno.matricula));
    return this.sugerenciasDelServidor().filter((alumno) => !yaInscritos.has(alumno.matricula));
  });

  constructor() {
    this.buscador.valueChanges
      .pipe(
        debounceTime(300),
        // Solo se busca cuando hay texto escrito (al elegir una opción llega el Alumno).
        filter((valor): valor is string => typeof valor === 'string'),
        switchMap((texto) =>
          texto.trim().length < 2
            ? of([])
            : this.api.buscarAlumnos(texto.trim()).pipe(catchError(() => of([]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((alumnos) => this.sugerenciasDelServidor.set(alumnos));
  }

  ngOnInit(): void {
    // Los inputs de la ruta ya tienen valor en ngOnInit (en el constructor todavía no).
    this.api.obtenerMateria(this.nrc()).subscribe((materia) => this.materia.set(materia));
    this.cargarInscritos();
  }

  /** Cómo se ve un alumno en el campo de búsqueda después de elegirlo. */
  mostrarAlumno(alumno: Alumno | string | null): string {
    return alumno && typeof alumno !== 'string' ? `${alumno.nombre} ${alumno.apellidos}` : '';
  }

  inscribir(alumno: Alumno): void {
    this.api.inscribir(this.nrc(), alumno.matricula).subscribe(() => {
      this.avisos.open(`${alumno.nombre} ${alumno.apellidos} quedó inscrito`, 'Cerrar', {
        duration: 4000,
      });
      this.buscador.setValue('');
      this.cargarInscritos();
    });
  }

  darDeBaja(alumno: Alumno): void {
    confirmar(this.dialogo, {
      titulo: 'Dar de baja de la materia',
      mensaje: `¿Quitar a ${alumno.nombre} ${alumno.apellidos} de esta materia?`,
      accion: 'Dar de baja',
    })
      .pipe(
        filter((confirmado) => confirmado),
        // Si ya tiene calificaciones, el backend responde 409 y el interceptor lo avisa.
        switchMap(() => this.api.darDeBaja(this.nrc(), alumno.matricula)),
      )
      .subscribe(() => this.cargarInscritos());
  }

  editar(): void {
    this.dialogo
      .open(DialogoMateria, { data: this.materia(), width: '480px' })
      .afterClosed()
      .pipe(
        filter((guardada) => guardada === true),
        switchMap(() => this.api.obtenerMateria(this.nrc())),
      )
      .subscribe((materia) => this.materia.set(materia));
  }

  eliminar(): void {
    const materia = this.materia();
    if (!materia) return;
    confirmar(this.dialogo, {
      titulo: 'Eliminar materia',
      mensaje: `Se eliminará ${materia.nombre} (NRC ${materia.nrc}). Solo es posible si no tiene alumnos inscritos.`,
      accion: 'Eliminar',
    })
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.api.eliminarMateria(materia.nrc)),
      )
      .subscribe(() => this.router.navigate(['/admin/materias']));
  }

  private cargarInscritos(): void {
    this.api.listarInscritos(this.nrc()).subscribe((alumnos) => this.inscritos.set(alumnos));
  }
}
