import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, switchMap } from 'rxjs';

import { confirmar } from '../../../compartido/dialogo-confirmacion/dialogo-confirmacion';
import { AuthApi } from '../../../nucleo/api/auth.api';
import { Usuario } from '../../../nucleo/api/modelos';
import { Rol } from '../../../nucleo/sesion/roles';

/** Alta (data = null) o edición (data = el docente) de una cuenta de docente. */
@Component({
  selector: 'app-dialogo-docente',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialogo-docente.html',
  styleUrl: './dialogo-docente.scss',
})
export class DialogoDocente {
  private readonly api = inject(AuthApi);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  private readonly referencia = inject(MatDialogRef<DialogoDocente, boolean>);

  readonly docente = inject<Usuario | null>(MAT_DIALOG_DATA);
  readonly esNuevo = this.docente === null;

  readonly formulario = inject(NonNullableFormBuilder).group({
    usuario: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    activo: [true],
  });

  readonly guardando = signal(false);

  constructor() {
    if (this.docente) {
      this.formulario.patchValue(this.docente);
      this.formulario.controls.usuario.disable(); // el número de empleado no se edita
    }
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { usuario, nombre, apellidos, email, activo } = this.formulario.getRawValue();
    const peticion = this.docente
      ? this.api.editarUsuario(this.docente.usuario, { nombre, apellidos, email, activo })
      : this.api.crearUsuario({ usuario, nombre, apellidos, email, rol: Rol.DOCENTE });

    this.guardando.set(true);
    peticion.subscribe({
      next: () => this.referencia.close(true),
      error: () => this.guardando.set(false), // el aviso del error ya lo muestra el interceptor
    });
  }

  restablecerContrasena(): void {
    const docente = this.docente;
    if (!docente) return;
    confirmar(this.dialogo, {
      titulo: 'Restablecer contraseña',
      mensaje: `La contraseña de ${docente.nombre} volverá a ser su número de empleado.`,
      accion: 'Restablecer',
    })
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.api.editarUsuario(docente.usuario, { restablecer_contrasena: true })),
      )
      .subscribe(() => this.avisos.open('Contraseña restablecida', 'Cerrar', { duration: 4000 }));
  }
}
