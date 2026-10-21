import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  accion: string; // texto del botón, p. ej. "Desactivar"
}

/** Diálogo de "¿Estás seguro?" para acciones importantes. Devuelve true si se confirmó. */
@Component({
  selector: 'app-dialogo-confirmacion',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content>{{ datos.mensaje }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button [mat-dialog-close]="true">{{ datos.accion }}</button>
    </mat-dialog-actions>
  `,
})
export class DialogoConfirmacion {
  readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}

/** Atajo: abre el diálogo y avisa si se confirmó (cerrarlo con Esc cuenta como "no"). */
export function confirmar(dialogo: MatDialog, datos: DatosConfirmacion): Observable<boolean> {
  return dialogo
    .open<DialogoConfirmacion, DatosConfirmacion, boolean>(DialogoConfirmacion, { data: datos })
    .afterClosed()
    .pipe(map((confirmado) => confirmado === true));
}
