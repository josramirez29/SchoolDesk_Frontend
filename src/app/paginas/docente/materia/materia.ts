import { Component, OnInit, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { Materia } from '../../../nucleo/api/modelos';

/** Una pestaña de la materia. Cada una es una ruta hija con su propia URL. */
interface Pestana {
  etiqueta: string;
  ruta: string;
}

/**
 * Marco de una materia del docente (/docente/materias/:nrc): el encabezado y las
 * pestañas. Las pestañas son rutas hijas, así que al recargar la página el
 * docente sigue en la misma pestaña y el botón "atrás" del navegador funciona.
 */
@Component({
  selector: 'app-materia-docente',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './materia.html',
  styleUrl: './materia.scss',
})
export class MateriaDocente implements OnInit {
  private readonly api = inject(AcademicoApi);

  readonly nrc = input.required<string>();
  readonly materia = signal<Materia | null>(null);

  readonly pestanas: Pestana[] = [
    { etiqueta: 'Ponderaciones', ruta: 'ponderaciones' },
    { etiqueta: 'Calificaciones', ruta: 'calificaciones' },
  ];

  ngOnInit(): void {
    this.api.obtenerMateria(this.nrc()).subscribe((materia) => this.materia.set(materia));
  }
}
