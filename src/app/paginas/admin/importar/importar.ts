import { Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { AuthApi } from '../../../nucleo/api/auth.api';
import { PanelImportacion } from './panel-importacion';

/**
 * Importación masiva por CSV, una pestaña por tipo de archivo.
 *
 * Cada importación es independiente (p. ej. al inicio de semestre solo se suben las
 * inscripciones). Lo único que importa es que exista lo que cada archivo necesita:
 * las materias necesitan a sus docentes; las inscripciones, alumnos y materias.
 */
@Component({
  selector: 'app-importar',
  imports: [MatTabsModule, PanelImportacion],
  templateUrl: './importar.html',
  styleUrl: './importar.scss',
})
export class Importar {
  private readonly authApi = inject(AuthApi);
  private readonly academicoApi = inject(AcademicoApi);

  readonly docentes = {
    descripcion:
      'Las cuentas de los docentes. Cada uno entra con su número de empleado como contraseña inicial.',
    columnas: ['num_empleado', 'nombre', 'apellidos', 'email'],
    urlPlantilla: this.authApi.urlPlantillaDocentes,
    importar: (archivo: File) => this.authApi.importarDocentes(archivo),
  };

  readonly alumnos = {
    descripcion:
      'Los alumnos y sus cuentas. Cada uno entra con su matrícula como contraseña inicial.',
    columnas: ['matricula', 'nombre', 'apellidos', 'email'],
    urlPlantilla: this.academicoApi.urlPlantilla('alumnos'),
    importar: (archivo: File) => this.academicoApi.importar('alumnos', archivo),
  };

  readonly materias = {
    descripcion: 'Las materias del periodo. El docente titular ya debe estar importado.',
    columnas: ['nrc', 'clave', 'nombre', 'seccion', 'num_empleado_docente'],
    urlPlantilla: this.academicoApi.urlPlantilla('materias'),
    importar: (archivo: File) => this.academicoApi.importar('materias', archivo),
  };

  readonly inscripciones = {
    descripcion: 'Qué alumno va en qué materia. Los alumnos y las materias ya deben existir.',
    columnas: ['nrc', 'matricula'],
    urlPlantilla: this.academicoApi.urlPlantilla('inscripciones'),
    importar: (archivo: File) => this.academicoApi.importar('inscripciones', archivo),
  };
}
