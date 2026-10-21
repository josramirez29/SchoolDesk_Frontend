import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ServicioTema } from '../../nucleo/tema/servicio-tema';

/** Botón que cambia entre tema claro y oscuro (se usa en la barra y en el login). */
@Component({
  selector: 'app-boton-tema',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      (click)="servicioTema.alternar()"
      [attr.aria-label]="texto()"
      [matTooltip]="texto()"
    >
      <mat-icon>{{ servicioTema.tema() === 'oscuro' ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
})
export class BotonTema {
  readonly servicioTema = inject(ServicioTema);

  readonly texto = computed(() =>
    this.servicioTema.tema() === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
  );
}
