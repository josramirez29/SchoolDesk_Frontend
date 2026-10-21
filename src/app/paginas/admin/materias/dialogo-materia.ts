import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { AuthApi } from '../../../nucleo/api/auth.api';
import { Materia } from '../../../nucleo/api/modelos';
import { Rol } from '../../../nucleo/sesion/roles';

/** Alta (data = null) o edición (data = la materia) de una materia. */
@Component({
  selector: 'app-dialogo-materia',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialogo-materia.html',
  styleUrl: './dialogo-materia.scss',
})
export class DialogoMateria {
  private readonly api = inject(AcademicoApi);
  private readonly referencia = inject(MatDialogRef<DialogoMateria, boolean>);

  readonly materia = inject<Materia | null>(MAT_DIALOG_DATA);
  readonly esNueva = this.materia === null;

  readonly formulario = inject(NonNullableFormBuilder).group({
    nrc: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    clave: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    seccion: ['001', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    num_empleado_docente: ['', Validators.required],
  });

  /** Solo se puede asignar a un docente con cuenta activa (igual valida el backend). */
  private readonly docentes = toSignal(inject(AuthApi).listarUsuarios(Rol.DOCENTE), {
    initialValue: [],
  });
  readonly docentesActivos = computed(() => this.docentes().filter((docente) => docente.activo));

  readonly guardando = signal(false);

  constructor() {
    if (this.materia) {
      this.formulario.patchValue(this.materia);
      this.formulario.controls.nrc.disable(); // el NRC no se edita
    }
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { nrc, ...cambios } = this.formulario.getRawValue();
    const peticion = this.materia
      ? this.api.editarMateria(this.materia.nrc, cambios)
      : this.api.crearMateria({ nrc, ...cambios });

    this.guardando.set(true);
    peticion.subscribe({
      next: () => this.referencia.close(true),
      error: () => this.guardando.set(false), // el aviso del error ya lo muestra el interceptor
    });
  }
}
