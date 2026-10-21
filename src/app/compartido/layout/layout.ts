import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { Rol } from '../../nucleo/sesion/roles';
import { ServicioSesion } from '../../nucleo/sesion/servicio-sesion';
import { ServicioTema } from '../../nucleo/tema/servicio-tema';
import { BotonTema } from '../boton-tema/boton-tema';

/** Una opción del menú lateral. */
export interface OpcionMenu {
  etiqueta: string;
  icono: string; // nombre de un ícono de Material Symbols
  ruta: string;
}

const NOMBRE_DEL_ROL: Record<Rol, string> = {
  [Rol.ADMIN]: 'Administración',
  [Rol.DOCENTE]: 'Docente',
  [Rol.ALUMNO]: 'Alumno',
};

/**
 * Marco común de las pantallas: barra superior, menú lateral y el contenido.
 *
 * Los 3 roles usan este mismo componente; cada uno pasa sus opciones de menú en
 * el `data` de su ruta, que llega aquí como input gracias a withComponentInputBinding.
 */
@Component({
  selector: 'app-layout',
  imports: [
    BotonTema,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly sesion = inject(ServicioSesion);
  private readonly router = inject(Router);

  readonly opciones = input.required<OpcionMenu[]>();

  readonly usuario = this.sesion.usuario;
  readonly logo = inject(ServicioTema).logo;
  readonly nombreDelRol = computed(() => {
    const rol = this.sesion.rol();
    return rol ? NOMBRE_DEL_ROL[rol] : '';
  });

  /** En celular el menú se abre encima del contenido; en pantallas grandes queda fijo. */
  readonly esCelular = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.Handset)
      .pipe(map((resultado) => resultado.matches)),
    { initialValue: false },
  );

  cerrarSesion(): void {
    this.sesion.cerrar();
    this.router.navigate(['/login']);
  }
}
