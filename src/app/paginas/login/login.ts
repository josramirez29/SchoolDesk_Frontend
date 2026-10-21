import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { BotonTema } from '../../compartido/boton-tema/boton-tema';
import { AuthApi } from '../../nucleo/api/auth.api';
import { mensajeDeError } from '../../nucleo/errores/errores';
import { INICIO_POR_ROL } from '../../nucleo/sesion/roles';
import { ServicioSesion } from '../../nucleo/sesion/servicio-sesion';

@Component({
  selector: 'app-login',
  imports: [
    BotonTema,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authApi = inject(AuthApi);
  private readonly sesion = inject(ServicioSesion);
  private readonly router = inject(Router);

  /** Llega de la URL (/login?motivo=expirada) cuando el interceptor cerró la sesión. */
  readonly motivo = input<string>();

  readonly formulario = inject(NonNullableFormBuilder).group({
    // Matrícula o número de empleado: 9 dígitos, igual que valida el backend.
    usuario: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    contrasena: ['', Validators.required],
  });

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarContrasena = signal(false);

  iniciarSesion(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // muestra los mensajes de cada campo
      return;
    }
    const { usuario, contrasena } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);

    this.authApi.login(usuario, contrasena).subscribe({
      next: (respuesta) => {
        this.sesion.guardar(respuesta.token_acceso);
        this.router.navigateByUrl(INICIO_POR_ROL[respuesta.usuario.rol]);
      },
      error: (error: HttpErrorResponse) => {
        // "Usuario o contraseña incorrectos", "Tu cuenta está desactivada"...
        this.error.set(mensajeDeError(error));
        this.enviando.set(false);
      },
    });
  }
}
