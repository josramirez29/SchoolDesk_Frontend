import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthApi } from '../../nucleo/api/auth.api';
import { mensajeDeError } from '../../nucleo/errores/errores';

/** Validador del formulario completo: la confirmación debe ser igual a la nueva. */
function confirmacionIgual(grupo: AbstractControl): ValidationErrors | null {
  const { nueva, confirmacion } = grupo.value;
  return nueva === confirmacion ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-cambiar-contrasena',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './cambiar-contrasena.html',
  styleUrl: './cambiar-contrasena.scss',
})
export class CambiarContrasena {
  private readonly authApi = inject(AuthApi);
  private readonly avisos = inject(MatSnackBar);

  readonly formulario = inject(NonNullableFormBuilder).group(
    {
      actual: ['', Validators.required],
      // Mínimo 8, igual que el backend; él además rechaza usar tu matrícula.
      nueva: ['', [Validators.required, Validators.minLength(8)]],
      confirmacion: ['', Validators.required],
    },
    { validators: confirmacionIgual },
  );

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  cambiar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { actual, nueva } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);

    this.authApi.cambiarContrasena(actual, nueva).subscribe({
      next: () => {
        this.avisos.open('Contraseña actualizada', 'Cerrar', { duration: 4000 });
        this.formulario.reset();
        this.enviando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        // P. ej. "La contraseña actual no es correcta" (422, no 401: no cierra la sesión).
        this.error.set(mensajeDeError(error));
        this.enviando.set(false);
      },
    });
  }
}
