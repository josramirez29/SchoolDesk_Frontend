import { Routes } from '@angular/router';

import { Layout, OpcionMenu } from '../../compartido/layout/layout';

const OPCIONES: OpcionMenu[] = [
  { etiqueta: 'Mis materias', icono: 'menu_book', ruta: '/alumno/materias' },
];

/** Rutas del alumno. Se descargan solo cuando un alumno entra (lazy loading). */
export default [
  {
    path: '',
    component: Layout,
    data: { opciones: OPCIONES }, // llega al Layout como input
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'materias' },
      {
        path: 'materias',
        loadComponent: () => import('./mis-materias/mis-materias').then((m) => m.MisMateriasAlumno),
      },
      {
        path: 'materias/:nrc',
        loadComponent: () => import('./materia/materia-alumno').then((m) => m.MateriaAlumno),
      },
      {
        path: 'contrasena',
        loadComponent: () =>
          import('../cuenta/cambiar-contrasena').then((m) => m.CambiarContrasena),
      },
    ],
  },
] satisfies Routes;
