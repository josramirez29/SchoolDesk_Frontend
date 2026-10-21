import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { Subscription, interval, map, switchMap, timer } from 'rxjs';

import { AsistenciaApi } from '../../../nucleo/api/asistencia.api';
import { QrGenerado } from '../../../nucleo/api/modelos';
import { ErrorApi, mensajeDeError } from '../../../nucleo/errores/errores';

/**
 * Cada cuánto se pide un QR nuevo. El backend le da 30 s de vida a cada token;
 * se renueva 5 s antes para que el docente nunca escanee uno recién expirado.
 */
const MS_RENOVACION = 25_000;

type EstadoQr =
  | { tipo: 'cargando' }
  | { tipo: 'mostrando'; qr: QrGenerado; renuevaEn: number }
  | { tipo: 'registrado' } // ya tiene asistencia: no hace falta otro QR
  | { tipo: 'sin-sesion' } // el docente todavía no abre la asistencia
  | { tipo: 'error'; mensaje: string };

/**
 * QR de asistencia del alumno, pensado para mostrarse en el celular.
 *
 * El QR es un token de un solo uso que vive en Redis: si alguien le toma foto
 * y lo comparte, deja de servir en cuanto se escanea o en 30 s.
 * Cuando el docente lo escanea, el siguiente QR que se pide responde YA_REGISTRADO
 * y la pantalla deja de renovar.
 */
@Component({
  selector: 'app-mi-qr',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, QRCodeComponent, RouterLink],
  templateUrl: './mi-qr.html',
  styleUrl: './mi-qr.scss',
})
export class MiQr implements OnInit {
  private readonly asistenciaApi = inject(AsistenciaApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly nrc = input.required<string>();

  readonly estado = signal<EstadoQr>({ tipo: 'cargando' });

  /** Un "reloj" que avanza cada segundo, solo para la cuenta regresiva. */
  private readonly ahora = toSignal(interval(1000).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  readonly segundosParaRenovar = computed(() => {
    const estado = this.estado();
    if (estado.tipo !== 'mostrando') {
      return 0;
    }
    return Math.max(0, Math.ceil((estado.renuevaEn - this.ahora()) / 1000));
  });

  private renovacion?: Subscription;

  ngOnInit(): void {
    this.empezar();
  }

  /** Pide un QR ahora y otro cada 25 s. Cualquier error detiene la renovación. */
  empezar(): void {
    this.renovacion?.unsubscribe();
    this.estado.set({ tipo: 'cargando' });

    this.renovacion = timer(0, MS_RENOVACION)
      .pipe(
        switchMap(() => this.asistenciaApi.generarQr(this.nrc())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (qr) =>
          this.estado.set({ tipo: 'mostrando', qr, renuevaEn: Date.now() + MS_RENOVACION }),
        error: (error: HttpErrorResponse) => this.estado.set(estadoDelError(error)),
      });
  }
}

function estadoDelError(error: HttpErrorResponse): EstadoQr {
  const codigo = (error.error as Partial<ErrorApi> | null)?.error;
  if (codigo === 'YA_REGISTRADO') {
    return { tipo: 'registrado' };
  }
  if (codigo === 'SIN_SESION_ACTIVA') {
    return { tipo: 'sin-sesion' };
  }
  return { tipo: 'error', mensaje: mensajeDeError(error) };
}
