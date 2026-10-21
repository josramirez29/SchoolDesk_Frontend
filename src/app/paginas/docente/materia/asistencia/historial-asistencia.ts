import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { AsistenciaApi } from '../../../../nucleo/api/asistencia.api';
import { SesionResumen } from '../../../../nucleo/api/modelos';

/** Las sesiones anteriores de la materia, de la más reciente a la más antigua. */
@Component({
  selector: 'app-historial-asistencia',
  imports: [DatePipe, MatTableModule],
  template: `
    <h2>Sesiones anteriores</h2>
    @if (sesiones().length === 0) {
      <p class="nota">Todavía no hay sesiones de asistencia en esta materia.</p>
    } @else {
      <table mat-table [dataSource]="sesiones()" class="tabla">
        <ng-container matColumnDef="fecha">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let sesion">
            {{ sesion.iniciada_en | date: 'EEE d MMM y, HH:mm' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="presentes">
          <th mat-header-cell *matHeaderCellDef>Presentes</th>
          <td mat-cell *matCellDef="let sesion">{{ sesion.presentes }}</td>
        </ng-container>
        <ng-container matColumnDef="retardos">
          <th mat-header-cell *matHeaderCellDef>Retardos</th>
          <td mat-cell *matCellDef="let sesion">{{ sesion.retardos }}</td>
        </ng-container>
        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let sesion">
            {{
              sesion.activa
                ? 'En curso'
                : sesion.cerrada_en
                  ? 'Cerrada antes de tiempo'
                  : 'Terminada'
            }}
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
      </table>
    }
  `,
  styles: `
    h2 {
      margin: 32px 0 8px;
      font: var(--mat-sys-title-medium);
    }
    .nota {
      color: var(--mat-sys-on-surface-variant);
    }
    .tabla {
      max-width: 720px;
    }
  `,
})
export class HistorialAsistencia implements OnInit {
  private readonly api = inject(AsistenciaApi);

  readonly nrc = input.required<string>();
  readonly sesiones = signal<SesionResumen[]>([]);
  readonly columnas = ['fecha', 'presentes', 'retardos', 'estado'];

  ngOnInit(): void {
    this.api.listarSesiones(this.nrc()).subscribe((sesiones) => this.sesiones.set(sesiones));
  }
}
