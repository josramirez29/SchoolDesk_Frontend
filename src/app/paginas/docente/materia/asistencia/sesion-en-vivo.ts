import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Subscription, filter, interval, switchMap, takeWhile, timer } from 'rxjs';

import { confirmar } from '../../../../compartido/dialogo-confirmacion/dialogo-confirmacion';
import { AsistenciaApi } from '../../../../nucleo/api/asistencia.api';
import { RegistroAsistencia, SesionDetalle } from '../../../../nucleo/api/modelos';
import { HistorialAsistencia } from './historial-asistencia';
import { ErrorApi, mensajeDeError } from '../../../../nucleo/errores/errores';

const SEGUNDOS_ENTRE_CONSULTAS = 3;

/** Resultado del último escaneo, para mostrárselo al docente. */
interface UltimaLectura {
  correcta: boolean;
  mensaje: string;
}

/**
 * Sesión de asistencia en vivo: el docente la abre, escanea los QR de los alumnos
 * y ve la lista de registrados, que se actualiza cada 3 segundos (polling).
 */
@Component({
  selector: 'app-sesion-en-vivo',
  imports: [DatePipe, HistorialAsistencia, MatButtonModule, MatIconModule, ZXingScannerModule],
  templateUrl: './sesion-en-vivo.html',
  styleUrl: './sesion-en-vivo.scss',
})
export class SesionEnVivo implements OnInit {
  private readonly api = inject(AsistenciaApi);
  private readonly dialogo = inject(MatDialog);
  private readonly destruccion = inject(DestroyRef);

  readonly nrc = input.required<string>();

  readonly formatos = [BarcodeFormat.QR_CODE]; // solo QR: lee más rápido
  readonly sesion = signal<SesionDetalle | null>(null);
  readonly cargando = signal(true);
  readonly abriendo = signal(false);
  readonly ultimaLectura = signal<UltimaLectura | null>(null);
  readonly sinCamara = signal(false);

  /** Momento (en el reloj de ESTA computadora) en que termina la sesión. */
  private readonly terminaEn = signal(0);
  private readonly ahora = signal(Date.now());
  readonly segundosRestantes = computed(() =>
    Math.max(0, Math.ceil((this.terminaEn() - this.ahora()) / 1000)),
  );
  readonly activa = computed(() => this.sesion()?.activa === true && this.segundosRestantes() > 0);

  /** Tokens ya enviados: la cámara lee ~10 veces por segundo el mismo QR. */
  private readonly tokensEnviados = new Set<string>();
  private consultaPeriodica: Subscription | null = null;

  constructor() {
    // Reloj de la cuenta regresiva: avanza cada segundo mientras la pantalla esté abierta.
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.ahora.set(Date.now()));
  }

  ngOnInit(): void {
    // Si el docente recarga la página, retoma la sesión que ya estaba abierta.
    this.api.listarSesiones(this.nrc()).subscribe({
      next: (sesiones) => {
        const abierta = sesiones.find((sesion) => sesion.activa);
        if (abierta) {
          this.seguir(abierta.id);
        } else {
          this.cargando.set(false);
        }
      },
      error: () => this.cargando.set(false),
    });
  }

  iniciar(): void {
    this.abriendo.set(true);
    this.api.abrirSesion(this.nrc()).subscribe({
      next: (sesion) => {
        this.abriendo.set(false);
        this.mostrar(sesion);
        this.seguir(sesion.id);
      },
      error: (error: HttpErrorResponse) => {
        this.abriendo.set(false);
        // Ya había una sesión abierta (p. ej. desde otra pestaña): se retoma esa.
        const cuerpo = error.error as ErrorApi | null;
        if (cuerpo?.error === 'SESION_ACTIVA') {
          this.seguir(cuerpo['sesion_id'] as number);
        } else {
          this.ultimaLectura.set({ correcta: false, mensaje: mensajeDeError(error) });
        }
      },
    });
  }

  alLeerQr(token: string): void {
    const sesion = this.sesion();
    if (!sesion || !this.activa() || this.tokensEnviados.has(token)) {
      return; // lectura repetida del mismo QR: se ignora
    }
    this.tokensEnviados.add(token);

    this.api.escanear(sesion.id, token).subscribe({
      next: (registro) => {
        this.ultimaLectura.set({ correcta: true, mensaje: this.describir(registro) });
        this.actualizar(sesion.id);
      },
      // P. ej. "El QR expiró o ya se usó" o "Ana ya tiene asistencia en esta sesión".
      error: (error: HttpErrorResponse) =>
        this.ultimaLectura.set({ correcta: false, mensaje: mensajeDeError(error) }),
    });
  }

  /** Por si la cámara no funciona: pegar el código del QR a mano. */
  ingresarManualmente(campo: HTMLInputElement): void {
    const token = campo.value.trim();
    if (token) {
      this.alLeerQr(token);
      campo.value = '';
    }
  }

  cerrar(): void {
    const sesion = this.sesion();
    if (!sesion) return;
    confirmar(this.dialogo, {
      titulo: 'Cerrar sesión de asistencia',
      mensaje: 'Los alumnos que todavía no se registran quedarán con falta.',
      accion: 'Cerrar sesión',
    })
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.api.cerrarSesion(sesion.id)),
      )
      .subscribe((cerrada) => this.mostrar(cerrada));
  }

  nuevaSesion(): void {
    this.sesion.set(null);
    this.ultimaLectura.set(null);
    this.tokensEnviados.clear();
  }

  formatoReloj(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    return `${minutos}:${String(segundos % 60).padStart(2, '0')}`;
  }

  // --- Privadas ---

  /** Consulta la sesión cada 3 s y deja de hacerlo cuando termina o se sale de la pantalla. */
  private seguir(sesionId: number): void {
    this.consultaPeriodica?.unsubscribe();
    this.consultaPeriodica = timer(0, SEGUNDOS_ENTRE_CONSULTAS * 1000)
      .pipe(
        // switchMap: si una respuesta tarda más de 3 s, se descarta al pedir la siguiente.
        switchMap(() => this.api.obtenerSesion(sesionId)),
        takeWhile((sesion) => sesion.activa, true), // true: incluye la última (ya cerrada)
        takeUntilDestroyed(this.destruccion),
      )
      .subscribe((sesion) => {
        this.mostrar(sesion);
        this.cargando.set(false);
      });
  }

  private actualizar(sesionId: number): void {
    this.api.obtenerSesion(sesionId).subscribe((sesion) => this.mostrar(sesion));
  }

  private mostrar(sesion: SesionDetalle): void {
    this.sesion.set(sesion);
    // La cuenta regresiva parte de lo que dice el SERVIDOR (segundos_restantes), no del
    // reloj de esta computadora: si su hora está desfasada, la cuenta sigue siendo correcta.
    this.terminaEn.set(Date.now() + sesion.segundos_restantes * 1000);
    this.ahora.set(Date.now());
  }

  private describir(registro: RegistroAsistencia): string {
    const estado = registro.estado === 'PRESENTE' ? 'presente' : 'con retardo';
    return `${registro.nombre_alumno}: ${estado}`;
  }
}
