import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree, provideRouter } from '@angular/router';

import { invitadoGuard, rolGuard, sesionGuard } from './guardias';
import { Rol } from './roles';
import { ServicioSesion } from './servicio-sesion';
import { crearTokenDePrueba } from './tokens-de-prueba';

describe('guardias', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  /** Ejecuta una guardia y devuelve true o la URL a la que redirige. */
  function ejecutar(guardia: CanActivateFn): true | string {
    const resultado = TestBed.runInInjectionContext(() => guardia(null!, null!));
    return resultado instanceof UrlTree ? TestBed.inject(Router).serializeUrl(resultado) : true;
  }

  function iniciarSesionComo(rol: Rol): void {
    TestBed.inject(ServicioSesion).guardar(crearTokenDePrueba(rol));
  }

  it('sesionGuard manda al login a quien no inició sesión', () => {
    expect(ejecutar(sesionGuard)).toBe('/login');
  });

  it('sesionGuard deja pasar a quien inició sesión', () => {
    iniciarSesionComo(Rol.ALUMNO);

    expect(ejecutar(sesionGuard)).toBe(true);
  });

  it('rolGuard deja pasar al rol indicado', () => {
    iniciarSesionComo(Rol.DOCENTE);

    expect(ejecutar(rolGuard(Rol.DOCENTE))).toBe(true);
  });

  it('rolGuard manda a su propia pantalla a un rol ajeno', () => {
    iniciarSesionComo(Rol.ALUMNO);

    expect(ejecutar(rolGuard(Rol.ADMIN))).toBe('/alumno');
  });

  it('invitadoGuard manda a su pantalla de inicio a quien ya inició sesión', () => {
    iniciarSesionComo(Rol.ADMIN);

    expect(ejecutar(invitadoGuard)).toBe('/admin');
  });
});
