import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { SIN_AVISO_DE_ERROR, erroresInterceptor } from '../errores/errores';
import { sesionExpiradaInterceptor, tokenInterceptor } from './interceptores';
import { Rol } from './roles';
import { ServicioSesion } from './servicio-sesion';
import { crearTokenDePrueba } from './tokens-de-prueba';

describe('interceptores', () => {
  let http: HttpClient;
  let servidor: HttpTestingController;
  let sesion: ServicioSesion;
  const avisos = { open: vi.fn() };
  const URL_MATERIAS = `${environment.urlApi}/academico/materias`;

  beforeEach(() => {
    localStorage.clear();
    avisos.open.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // Mismo orden que en app.config.ts.
        provideHttpClient(
          withInterceptors([tokenInterceptor, erroresInterceptor, sesionExpiradaInterceptor]),
        ),
        provideHttpClientTesting(), // un "servidor" falso que controla la prueba
        { provide: MatSnackBar, useValue: avisos },
      ],
    });
    http = TestBed.inject(HttpClient);
    servidor = TestBed.inject(HttpTestingController);
    sesion = TestBed.inject(ServicioSesion);
  });

  afterEach(() => servidor.verify()); // no quedó ninguna petición sin responder

  function responderError(url: string, status: number, cuerpo: object = {}): void {
    servidor.expectOne(url).flush(cuerpo, { status, statusText: 'Error' });
  }

  // --- tokenInterceptor ---

  it('agrega el token a las peticiones a nuestra API', () => {
    const token = crearTokenDePrueba(Rol.DOCENTE);
    sesion.guardar(token);

    http.get(URL_MATERIAS).subscribe();

    const peticion = servidor.expectOne(URL_MATERIAS);
    expect(peticion.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    peticion.flush([]);
  });

  it('no manda el token a otros dominios', () => {
    sesion.guardar(crearTokenDePrueba());

    http.get('https://otro-sitio.example/datos').subscribe();

    const peticion = servidor.expectOne('https://otro-sitio.example/datos');
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush({});
  });

  // --- sesionExpiradaInterceptor ---

  it('un 401 con sesión activa cierra la sesión y manda al login', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    sesion.guardar(crearTokenDePrueba());

    http.get(URL_MATERIAS).subscribe({ error: () => {} });
    responderError(URL_MATERIAS, 401, { error: 'TOKEN_EXPIRADO', detalle: 'La sesión expiró' });

    expect(sesion.estaAutenticada()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { motivo: 'expirada' } });
    expect(avisos.open).not.toHaveBeenCalled(); // el 401 no se muestra como aviso
  });

  it('un 401 sin sesión (login fallido) no redirige', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate');

    http.post(`${environment.urlApi}/auth/login`, {}).subscribe({ error: () => {} });
    responderError(`${environment.urlApi}/auth/login`, 401);

    expect(navegar).not.toHaveBeenCalled();
  });

  // --- erroresInterceptor ---

  it('muestra el detalle de un error del backend', () => {
    http.post(URL_MATERIAS, {}).subscribe({ error: () => {} });
    responderError(URL_MATERIAS, 409, {
      error: 'MATERIA_DUPLICADA',
      detalle: 'Ya existe la materia',
    });

    expect(avisos.open).toHaveBeenCalledWith('Ya existe la materia', 'Cerrar', { duration: 6000 });
  });

  it('explica cuando no hay conexión con el servidor', () => {
    http.get(URL_MATERIAS).subscribe({ error: () => {} });
    servidor.expectOne(URL_MATERIAS).error(new ProgressEvent('error')); // status 0

    expect(avisos.open.mock.calls[0][0]).toContain('No hay conexión');
  });

  it('no avisa si la petición pidió SIN_AVISO_DE_ERROR', () => {
    const context = new HttpContext().set(SIN_AVISO_DE_ERROR, true);

    http.post(URL_MATERIAS, {}, { context }).subscribe({ error: () => {} });
    responderError(URL_MATERIAS, 422, { error: 'ARCHIVO_CON_ERRORES', detalle: '3 filas' });

    expect(avisos.open).not.toHaveBeenCalled();
  });
});
