import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { invitadoGuard, rolGuard, sesionGuard } from './nucleo/sesion/guardias';
import { INICIO_POR_ROL, Rol } from './nucleo/sesion/roles';
import { ServicioSesion } from './nucleo/sesion/servicio-sesion';

/**
 * Rutas principales. Cada sección (admin, docente, alumno) se descarga solo
 * cuando se entra a ella (lazy loading): un alumno nunca descarga las
 * pantallas del admin.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./paginas/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [sesionGuard, rolGuard(Rol.ADMIN)],
    loadChildren: () => import('./paginas/admin/admin.routes'),
  },
  {
    path: 'docente',
    canActivate: [sesionGuard, rolGuard(Rol.DOCENTE)],
    loadChildren: () => import('./paginas/docente/docente.routes'),
  },
  {
    path: 'alumno',
    canActivate: [sesionGuard, rolGuard(Rol.ALUMNO)],
    loadChildren: () => import('./paginas/alumno/alumno.routes'),
  },
  {
    // La raíz manda a cada quien a su sección (o al login si no hay sesión).
    path: '',
    pathMatch: 'full',
    redirectTo: () => {
      const rol = inject(ServicioSesion).rol();
      return rol ? INICIO_POR_ROL[rol] : '/login';
    },
  },
  { path: '**', redirectTo: '' }, // cualquier ruta desconocida
];
