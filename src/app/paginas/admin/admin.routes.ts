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
