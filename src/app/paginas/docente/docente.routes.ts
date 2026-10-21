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
      // Provisional: cada pantalla de esta sección se agrega en su propio commit.
      { path: '', pathMatch: 'full', redirectTo: 'contrasena' },
      {
        path: 'contrasena',
        loadComponent: () =>
          import('../cuenta/cambiar-contrasena').then((m) => m.CambiarContrasena),
      },
    ],
  },
] satisfies Routes;
