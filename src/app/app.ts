import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ServicioTema } from './nucleo/tema/servicio-tema';

/** Componente raíz: muestra la página de la ruta actual y aplica el tema guardado. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  // Se crea aquí para que el tema se aplique desde el inicio, en cualquier página.
  private readonly tema = inject(ServicioTema);
}
