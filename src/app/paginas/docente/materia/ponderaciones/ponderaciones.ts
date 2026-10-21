import { Component, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, switchMap } from 'rxjs';

import { confirmar } from '../../../../compartido/dialogo-confirmacion/dialogo-confirmacion';
import { AcademicoApi } from '../../../../nucleo/api/academico.api';
import { Categoria, Tarea } from '../../../../nucleo/api/modelos';

type FilaCategoria = FormGroup<{
  id: FormControl<number | null>;
  nombre: FormControl<string>;
  peso: FormControl<number>;
}>;

/**
 * Ponderaciones de la materia: categorías con peso (suman 100 %) y sus tareas.
 *
 * Las categorías se editan en un formulario y se guardan TODAS juntas (un PUT con
 * la lista completa), porque "suman 100" es una regla del conjunto: editándolas de
 * una en una, la suma sería inválida en algún paso intermedio.
 */
@Component({
  selector: 'app-ponderaciones',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './ponderaciones.html',
  styleUrl: './ponderaciones.scss',
})
export class Ponderaciones implements OnInit {
  private readonly api = inject(AcademicoApi);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly nrc = input.required<string>();

  /** Lo que está guardado en el servidor (de aquí salen las tareas). */
  readonly categorias = signal<Categoria[]>([]);

  readonly filas: FormArray<FilaCategoria> = this.fb.array<FilaCategoria>([]);
  readonly suma = signal(0);
  readonly guardando = signal(false);

  // Renombrar una tarea: cuál se está editando y el texto nuevo.
  readonly tareaEnEdicion = signal<number | null>(null);
  readonly nombreEnEdicion = new FormControl('', { nonNullable: true });

  constructor() {
    // La suma se recalcula con cada cambio del formulario, para mostrarla en vivo.
    this.filas.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recalcularSuma());
  }

  ngOnInit(): void {
    this.api.obtenerCategorias(this.nrc()).subscribe((categorias) => {
      this.categorias.set(categorias);
      this.llenarFormulario(categorias);
    });
  }

  // --- Categorías ---

  agregarCategoria(): void {
    // Propone el peso que falta para llegar a 100.
    const restante = Math.max(0, Math.round((100 - this.suma()) * 100) / 100);
    this.filas.push(this.nuevaFila(null, '', restante));
    this.filas.markAsDirty();
  }

  quitarCategoria(indice: number): void {
    this.filas.removeAt(indice);
    this.filas.markAsDirty();
  }

  puedeGuardar(): boolean {
    return this.filas.dirty && this.filas.valid && this.suma() === 100 && !this.guardando();
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;
    this.guardando.set(true);
    // Si se quitó una categoría que ya tiene calificaciones, el backend responde
    // 409 y no cambia nada; el interceptor muestra el motivo.
    this.api.guardarCategorias(this.nrc(), this.filas.getRawValue()).subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.llenarFormulario(categorias);
        this.guardando.set(false);
        this.avisos.open('Ponderaciones guardadas', 'Cerrar', { duration: 4000 });
      },
      error: () => this.guardando.set(false),
    });
  }

  descartar(): void {
    this.llenarFormulario(this.categorias());
  }

  // --- Tareas (solo en categorías ya guardadas) ---

  crearTarea(categoria: Categoria, campo: HTMLInputElement): void {
    const nombre = campo.value.trim();
    if (!nombre) return;
    this.api.crearTarea(this.nrc(), categoria.id, nombre).subscribe(() => {
      campo.value = '';
      this.recargarTareas();
    });
  }

  empezarARenombrar(tarea: Tarea): void {
    this.tareaEnEdicion.set(tarea.id);
    this.nombreEnEdicion.setValue(tarea.nombre);
  }

  renombrar(tarea: Tarea): void {
    const nombre = this.nombreEnEdicion.value.trim();
    if (!nombre || nombre === tarea.nombre) {
      this.tareaEnEdicion.set(null);
      return;
    }
    this.api.renombrarTarea(this.nrc(), tarea.id, nombre).subscribe(() => {
      this.tareaEnEdicion.set(null);
      this.recargarTareas();
    });
  }

  eliminarTarea(tarea: Tarea): void {
    confirmar(this.dialogo, {
      titulo: 'Eliminar tarea',
      mensaje: `¿Eliminar "${tarea.nombre}"? Solo es posible si todavía no tiene calificaciones.`,
      accion: 'Eliminar',
    })
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.api.eliminarTarea(this.nrc(), tarea.id)),
      )
      .subscribe(() => this.recargarTareas());
  }

  // --- Privadas ---

  /** Actualiza solo las tareas, sin tocar las categorías que el docente esté editando. */
  private recargarTareas(): void {
    this.api
      .obtenerCategorias(this.nrc())
      .subscribe((categorias) => this.categorias.set(categorias));
  }

  private llenarFormulario(categorias: Categoria[]): void {
    this.filas.clear();
    for (const categoria of categorias) {
      this.filas.push(this.nuevaFila(categoria.id, categoria.nombre, categoria.peso));
    }
    this.filas.markAsPristine(); // sin cambios pendientes
    this.recalcularSuma();
  }

  private nuevaFila(id: number | null, nombre: string, peso: number): FilaCategoria {
    return this.fb.group({
      id: this.fb.control<number | null>(id),
      nombre: [nombre, [Validators.required, Validators.maxLength(50)]],
      peso: [peso, [Validators.required, Validators.min(0.01), Validators.max(100)]],
    });
  }

  private recalcularSuma(): void {
    const suma = this.filas.getRawValue().reduce((total, fila) => total + Number(fila.peso), 0);
    // Se redondea a 2 decimales: con números de punto flotante, 33.33 + 33.33 + 33.34
    // puede dar 99.99999999999999 en lugar de 100.
    this.suma.set(Math.round(suma * 100) / 100);
  }
}
