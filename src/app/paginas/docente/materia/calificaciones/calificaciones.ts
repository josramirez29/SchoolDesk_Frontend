import { DecimalPipe } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { ConCambiosPendientes } from '../../../../compartido/cambios-pendientes';
import { AcademicoApi } from '../../../../nucleo/api/academico.api';
import { CalificacionEntrada, Concentrado, FilaConcentrado } from '../../../../nucleo/api/modelos';

const CALIFICACION_APROBATORIA = 6;

/**
 * Concentrado de calificaciones: una fila por alumno y una columna por tarea.
 *
 * Solo se guardan las celdas que cambiaron, todas en una sola petición. Los
 * promedios NO se calculan aquí: los calcula el backend (calculo.py, con Decimal),
 * y el frontend solo los muestra. Así hay una sola implementación de la regla.
 */
@Component({
  selector: 'app-calificaciones',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatProgressBarModule, RouterLink],
  templateUrl: './calificaciones.html',
  styleUrl: './calificaciones.scss',
})
export class Calificaciones implements OnInit, ConCambiosPendientes {
  private readonly api = inject(AcademicoApi);
  private readonly avisos = inject(MatSnackBar);

  readonly nrc = input.required<string>();

  readonly concentrado = signal<Concentrado | null>(null);
  readonly guardando = signal(false);

  /** Celdas cambiadas y válidas: "matrícula:tarea" → puntos (null = sin calificar). */
  private readonly cambios = signal(new Map<string, number | null>());
  /** Celdas con un valor que no es 0–100: "matrícula:tarea" → lo que se escribió. */
  private readonly invalidas = signal(new Map<string, string>());

  readonly totalCambios = computed(() => this.cambios().size);
  readonly hayInvalidas = computed(() => this.invalidas().size > 0);
  readonly puedeGuardar = computed(
    () => this.totalCambios() > 0 && !this.hayInvalidas() && !this.guardando(),
  );

  ngOnInit(): void {
    this.api
      .obtenerConcentrado(this.nrc())
      .subscribe((concentrado) => this.concentrado.set(concentrado));
  }

  hayCambios(): boolean {
    return this.cambios().size > 0 || this.invalidas().size > 0;
  }

  /** Avisa también si se recarga o se cierra la pestaña del navegador con cambios. */
  @HostListener('window:beforeunload', ['$event'])
  avisarAntesDeCerrar(evento: BeforeUnloadEvent): void {
    if (this.hayCambios()) {
      evento.preventDefault();
    }
  }

  // --- Celdas ---

  /** Lo que se muestra en la celda: lo escrito si es inválido, el cambio pendiente o lo guardado. */
  valorDeCelda(fila: FilaConcentrado, tareaId: number): string {
    const llave = this.llave(fila.matricula, tareaId);
    if (this.invalidas().has(llave)) return this.invalidas().get(llave)!;
    const puntos = this.cambios().has(llave) ? this.cambios().get(llave) : fila.puntos[tareaId];
    return puntos === null || puntos === undefined ? '' : String(puntos);
  }

  estaCambiada(fila: FilaConcentrado, tareaId: number): boolean {
    return this.cambios().has(this.llave(fila.matricula, tareaId));
  }

  esInvalida(fila: FilaConcentrado, tareaId: number): boolean {
    return this.invalidas().has(this.llave(fila.matricula, tareaId));
  }

  alEscribir(fila: FilaConcentrado, tareaId: number, texto: string): void {
    const llave = this.llave(fila.matricula, tareaId);
    const cambios = new Map(this.cambios());
    const invalidas = new Map(this.invalidas());
    invalidas.delete(llave);

    // Vacío = sin calificar. Si no, debe ser un número de 0 a 100 (igual valida el backend).
    const puntos = texto.trim() === '' ? null : Number(texto);
    if (puntos !== null && (Number.isNaN(puntos) || puntos < 0 || puntos > 100)) {
      invalidas.set(llave, texto);
      cambios.delete(llave);
    } else if (puntos === (fila.puntos[tareaId] ?? null)) {
      cambios.delete(llave); // volvió a su valor guardado: ya no es un cambio
    } else {
      cambios.set(llave, puntos);
    }

    // Se crean Map nuevos (en vez de modificar el actual) para que el signal avise del cambio.
    this.cambios.set(cambios);
    this.invalidas.set(invalidas);
  }

  // --- Acciones ---

  guardar(): void {
    if (!this.puedeGuardar()) return;
    const entradas: CalificacionEntrada[] = [...this.cambios()].map(([llave, puntos]) => {
      const [matricula, tarea] = llave.split(':');
      return { matricula, tarea_id: Number(tarea), puntos };
    });

    this.guardando.set(true);
    this.api.capturarCalificaciones(this.nrc(), entradas).subscribe({
      next: (concentrado) => {
        // El backend devuelve el concentrado con los promedios ya recalculados.
        this.concentrado.set(concentrado);
        this.cambios.set(new Map());
        this.guardando.set(false);
        this.avisos.open(`${entradas.length} calificación(es) guardada(s)`, 'Cerrar', {
          duration: 4000,
        });
      },
      error: () => this.guardando.set(false), // el aviso del error ya lo muestra el interceptor
    });
  }

  descartar(): void {
    this.cambios.set(new Map());
    this.invalidas.set(new Map());
  }

  reprobado(promedio: number | null): boolean {
    return promedio !== null && promedio < CALIFICACION_APROBATORIA;
  }

  private llave(matricula: string, tareaId: number): string {
    return `${matricula}:${tareaId}`;
  }
}
