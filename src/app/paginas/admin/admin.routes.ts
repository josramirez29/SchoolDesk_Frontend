import { Routes } from '@angular/router';

import { Layout, OpcionMenu } from '../../compartido/layout/layout';

const OPCIONES: OpcionMenu[] = [
  { etiqueta: 'Alumnos', icono: 'school', ruta: '/admin/alumnos' },
  { etiqueta: 'Docentes', icono: 'co_present', ruta: '/admin/docentes' },
  { etiqueta: 'Materias', icono: 'menu_book', ruta: '/admin/materias' },
  { etiqueta: 'Importar', icono: 'upload_file', ruta: '/admin/importar' },
];

/** Rutas del admin. Se descargan solo cuando un admin entra (lazy loading). */
export default [
  {
    path: '',
    component: Layout,
    data: { opciones: OPCIONES }, // llega al Layout como input
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'alumnos' },
      {
        path: 'alumnos',
        loadComponent: () => import('./alumnos/alumnos').then((m) => m.Alumnos),
      },
      {
        path: 'docentes',
        loadComponent: () => import('./docentes/docentes').then((m) => m.Docentes),
      },
      {
        path: 'materias',
        loadComponent: () => import('./materias/materias').then((m) => m.Materias),
      },
      {
        path: 'materias/:nrc',
        loadComponent: () => import('./materias/detalle-materia').then((m) => m.DetalleMateria),
      },
      {
        path: 'contrasena',
        loadComponent: () =>
          import('../cuenta/cambiar-contrasena').then((m) => m.CambiarContrasena),
      },
    ],
  },
] satisfies Routes;
