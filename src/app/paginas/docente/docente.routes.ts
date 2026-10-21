import { Routes } from '@angular/router';

import { Layout, OpcionMenu } from '../../compartido/layout/layout';

const OPCIONES: OpcionMenu[] = [
  { etiqueta: 'Mis materias', icono: 'menu_book', ruta: '/docente/materias' },
];

/** Rutas del docente. Se descargan solo cuando un docente entra (lazy loading). */
export default [
  {
    path: '',
    component: Layout,
    data: { opciones: OPCIONES }, // llega al Layout como input
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'materias' },
      {
        path: 'materias',
        loadComponent: () =>
          import('./mis-materias/mis-materias').then((m) => m.MisMateriasDocente),
      },
      {
        // Una materia con sus pestañas; cada pestaña es una ruta hija con su propia URL.
        path: 'materias/:nrc',
        loadComponent: () => import('./materia/materia').then((m) => m.MateriaDocente),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'ponderaciones' },
          {
            path: 'ponderaciones',
            loadComponent: () =>
              import('./materia/ponderaciones/ponderaciones').then((m) => m.Ponderaciones),
          },
        ],
      },
      {
        path: 'contrasena',
        loadComponent: () =>
          import('../cuenta/cambiar-contrasena').then((m) => m.CambiarContrasena),
      },
    ],
  },
] satisfies Routes;
