import { HttpErrorResponse } from '@angular/common/http';
import { Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';

import { ErrorDeFila, ResultadoImportacion } from '../../../nucleo/api/modelos';
import { ErrorApi, mensajeDeError } from '../../../nucleo/errores/errores';

/**
 * Una importación: descargar la plantilla, elegir el CSV, importarlo y
 * ver el resultado. Las 4 pestañas (docentes, alumnos, materias, inscripciones)
 * usan este mismo componente; solo cambian sus inputs.
 */
@Component({
  selector: 'app-panel-importacion',
  imports: [MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './panel-importacion.html',
  styleUrl: './panel-importacion.scss',
})
export class PanelImportacion {
  readonly descripcion = input.required<string>();
  readonly columnas = input.required<string[]>();
  readonly urlPlantilla = input.required<string>();
  /** Sube el archivo al endpoint que corresponda a esta pestaña. */
  readonly importar = input.required<(archivo: File) => Observable<ResultadoImportacion>>();

  readonly archivo = signal<File | null>(null);
  readonly enviando = signal(false);
  readonly resultado = signal<ResultadoImportacion | null>(null);
  readonly error = signal<string | null>(null);
  readonly filasConError = signal<ErrorDeFila[]>([]);

  elegirArchivo(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    this.archivo.set(campo.files?.[0] ?? null);
    this.limpiarResultado();
    campo.value = ''; // permite volver a elegir el mismo archivo después de corregirlo
  }

  subir(): void {
    const archivo = this.archivo();
    if (!archivo) return;
    this.enviando.set(true);
    this.limpiarResultado();

    this.importar()(archivo).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.enviando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        // Todo o nada: si hubo errores, no se guardó ninguna fila. El backend
        // manda la lista de filas con error para corregirlas todas de una vez.
        const cuerpo = error.error as ErrorApi | null;
        this.error.set(mensajeDeError(error));
        this.filasConError.set((cuerpo?.['filas'] as ErrorDeFila[] | undefined) ?? []);
        this.enviando.set(false);
      },
    });
  }

  private limpiarResultado(): void {
    this.resultado.set(null);
    this.error.set(null);
    this.filasConError.set([]);
  }
}
