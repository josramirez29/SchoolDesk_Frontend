import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { MiQr } from './mi-qr';

describe('MiQr', () => {
  let pantalla: ComponentFixture<MiQr>;
  let servidor: HttpTestingController;
  const URL_QR = `${environment.urlApi}/asistencia/qr`;
  const QR = { token: 'token-1', segundos_de_vida: 30, sesion_id: 7 };

  beforeEach(() => {
    vi.useFakeTimers(); // la prueba controla el paso del tiempo
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    servidor = TestBed.inject(HttpTestingController);
    pantalla = TestBed.createComponent(MiQr);
    pantalla.componentRef.setInput('nrc', '48308');
    pantalla.detectChanges();
    vi.advanceTimersByTime(0); // timer(0, ...) pide el primer QR
  });

  afterEach(() => {
    servidor.verify();
    vi.useRealTimers();
  });

  function responderError(error: string): void {
    servidor
      .expectOne(URL_QR)
      .flush({ error, detalle: '...' }, { status: 409, statusText: 'Conflict' });
  }

  it('muestra el QR y pide uno nuevo cada 25 s', () => {
    const peticion = servidor.expectOne(URL_QR);
    expect(peticion.request.body).toEqual({ nrc: '48308' });
    peticion.flush(QR);
    expect(pantalla.componentInstance.estado().tipo).toBe('mostrando');

    vi.advanceTimersByTime(24_000);
    servidor.expectNone(URL_QR); // todavía no toca renovar

    vi.advanceTimersByTime(1_000);
    servidor.expectOne(URL_QR).flush({ ...QR, token: 'token-2' });
  });

  it('deja de renovar cuando el alumno ya tiene asistencia', () => {
    servidor.expectOne(URL_QR).flush(QR);
    vi.advanceTimersByTime(25_000);
    responderError('YA_REGISTRADO'); // el docente ya lo escaneó

    expect(pantalla.componentInstance.estado().tipo).toBe('registrado');
    vi.advanceTimersByTime(60_000);
    servidor.expectNone(URL_QR); // no se piden más QR
  });

  it('si el docente no ha abierto la asistencia, espera a que el alumno reintente', () => {
    responderError('SIN_SESION_ACTIVA');
    expect(pantalla.componentInstance.estado().tipo).toBe('sin-sesion');

    pantalla.componentInstance.empezar();
    vi.advanceTimersByTime(0);
    servidor.expectOne(URL_QR).flush(QR);
    expect(pantalla.componentInstance.estado().tipo).toBe('mostrando');
  });
});
