import { CanDeactivateFn } from '@angular/router';

/** Una pantalla que puede tener cambios sin guardar (p. ej. el concentrado de calificaciones). */
export interface ConCambiosPendientes {
  hayCambios(): boolean;
}

/**
 * Antes de salir de la pantalla, pregunta si se quieren perder los cambios sin guardar.
 * Uso en la ruta: canDeactivate: [sinCambiosPendientesGuard]
 */
export const sinCambiosPendientesGuard: CanDeactivateFn<ConCambiosPendientes> = (pantalla) =>
  !pantalla.hayCambios() || confirm('Tienes cambios sin guardar. ¿Salir de todas formas?');
