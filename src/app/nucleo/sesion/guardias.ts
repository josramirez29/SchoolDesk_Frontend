import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { INICIO_POR_ROL, Rol } from './roles';
import { ServicioSesion } from './servicio-sesion';

/** Solo deja pasar a quien inició sesión; si no, lo manda al login. */
export const sesionGuard: CanActivateFn = () => {
  const sesion = inject(ServicioSesion);
  return sesion.estaAutenticada() || inject(Router).parseUrl('/login');
};

/**
 * Solo deja pasar a los roles indicados. Uso: canActivate: [rolGuard(Rol.DOCENTE)]
 *
 * Es solo para la experiencia de uso (no mostrar pantallas que no le tocan):
 * la seguridad real está en el backend, que valida el rol en cada petición.
 */
export function rolGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const rol = inject(ServicioSesion).rol();
    const router = inject(Router);
    if (rol === null) {
      return router.parseUrl('/login');
    }
    // Con sesión pero en una sección ajena: a su propia pantalla de inicio.
    return roles.includes(rol) || router.parseUrl(INICIO_POR_ROL[rol]);
  };
}

/** Para el login: quien ya inició sesión va directo a su pantalla de inicio. */
export const invitadoGuard: CanActivateFn = () => {
  const rol = inject(ServicioSesion).rol();
  return rol === null || inject(Router).parseUrl(INICIO_POR_ROL[rol]);
};
