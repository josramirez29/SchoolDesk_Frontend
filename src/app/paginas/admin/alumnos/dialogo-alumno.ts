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
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, forkJoin, switchMap } from 'rxjs';

import { confirmar } from '../../../compartido/dialogo-confirmacion/dialogo-confirmacion';
import { AcademicoApi } from '../../../nucleo/api/academico.api';
import { AuthApi } from '../../../nucleo/api/auth.api';
import { MateriaResumen, Usuario } from '../../../nucleo/api/modelos';

/**
 * Alta (data = null) o edición (data = matrícula) de un alumno.
 *
 * Un alumno vive en dos servicios: su registro académico (academico) y su cuenta
 * de acceso (auth). Al editar se cargan ambos; la baja es desactivar la cuenta,
 * así se conserva su historial de calificaciones y asistencia.
 */
@Component({
  selector: 'app-dialogo-alumno',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialogo-alumno.html',
  styleUrl: './dialogo-alumno.scss',
})
export class DialogoAlumno {
  private readonly academicoApi = inject(AcademicoApi);
  private readonly authApi = inject(AuthApi);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  private readonly referencia = inject(MatDialogRef<DialogoAlumno, boolean>);

  /** null = alumno nuevo; si trae matrícula, se edita ese alumno. */
  readonly matricula = inject<string | null>(MAT_DIALOG_DATA);
  readonly esNuevo = this.matricula === null;

  readonly formulario = inject(NonNullableFormBuilder).group({
    matricula: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly materias = signal<MateriaResumen[]>([]);
  readonly cuenta = signal<Usuario | null>(null);
  readonly guardando = signal(false);

  constructor() {
    if (this.matricula !== null) {
      // La matrícula no se edita (es el identificador en los 3 servicios) y el
      // email se administra en auth, así que en edición solo quedan los nombres.
      this.formulario.controls.matricula.disable();
      this.formulario.controls.email.disable();
      this.cargar(this.matricula);
    }
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const datos = this.formulario.getRawValue();
    const peticion =
      this.matricula === null
        ? this.academicoApi.crearAlumno(datos)
        : this.academicoApi.editarAlumno(this.matricula, {
            nombre: datos.nombre,
            apellidos: datos.apellidos,
          });

    this.guardando.set(true);
    peticion.subscribe({
      next: () => this.referencia.close(true),
      error: () => this.guardando.set(false), // el aviso del error ya lo muestra el interceptor
    });
  }

  cambiarEstadoDeCuenta(): void {
    const cuenta = this.cuenta();
    if (!cuenta) return;
    const activar = !cuenta.activo;
    confirmar(this.dialogo, {
      titulo: activar ? 'Reactivar cuenta' : 'Desactivar cuenta',
      mensaje: activar
        ? `${cuenta.nombre} podrá volver a iniciar sesión.`
        : `${cuenta.nombre} ya no podrá iniciar sesión. Sus calificaciones y asistencias se conservan.`,
      accion: activar ? 'Reactivar' : 'Desactivar',
    })
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.authApi.editarUsuario(cuenta.usuario, { activo: activar })),
      )
      .subscribe((actualizada) => this.cuenta.set(actualizada));
  }

  restablecerContrasena(): void {
    const cuenta = this.cuenta();
    if (!cuenta) return;
    confirmar(this.dialogo, {
      titulo: 'Restablecer contraseña',
      mensaje: `La contraseña de ${cuenta.nombre} volverá a ser su matrícula.`,
      accion: 'Restablecer',
    })
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() =>
          this.authApi.editarUsuario(cuenta.usuario, { restablecer_contrasena: true }),
        ),
      )
      .subscribe(() => this.avisos.open('Contraseña restablecida', 'Cerrar', { duration: 4000 }));
  }

  private cargar(matricula: string): void {
    // Los dos servicios se consultan al mismo tiempo (forkJoin espera a ambos).
    forkJoin({
      alumno: this.academicoApi.obtenerAlumno(matricula),
      cuenta: this.authApi.obtenerUsuario(matricula),
    }).subscribe(({ alumno, cuenta }) => {
      this.formulario.patchValue({ ...alumno, email: cuenta.email });
      this.materias.set(alumno.materias);
      this.cuenta.set(cuenta);
    });
  }
}
