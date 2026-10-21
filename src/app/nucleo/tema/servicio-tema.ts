import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const LLAVE_TEMA = 'schooldesk.tema';

/**
 * Tema claro u oscuro de toda la aplicación.
 *
 * Angular Material define sus colores con la función CSS light-dark(), así que
 * basta con cambiar `color-scheme` en <html> para que todo cambie de tema.
 *
 * La primera vez se respeta la preferencia del sistema operativo; si el usuario
 * elige un tema, se guarda en localStorage y se usa en las siguientes visitas.
 */
@Injectable({ providedIn: 'root' })
export class ServicioTema {
  private readonly documento = inject(DOCUMENT);

  readonly tema = signal<Tema>(leerTemaGuardado() ?? temaDelSistema());

  constructor() {
    effect(() => {
      this.documento.documentElement.style.colorScheme =
        this.tema() === 'oscuro' ? 'dark' : 'light';
    });
  }

  alternar(): void {
    const nuevo: Tema = this.tema() === 'oscuro' ? 'claro' : 'oscuro';
    this.tema.set(nuevo);
    localStorage.setItem(LLAVE_TEMA, nuevo);
  }
}

function leerTemaGuardado(): Tema | null {
  const guardado = localStorage.getItem(LLAVE_TEMA);
  return guardado === 'claro' || guardado === 'oscuro' ? guardado : null;
}

function temaDelSistema(): Tema {
  // matchMedia no existe en todos los entornos (por ejemplo, el de las pruebas).
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}
