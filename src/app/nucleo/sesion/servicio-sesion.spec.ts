import { TestBed } from '@angular/core/testing';

import { Rol } from './roles';
import { ServicioSesion, decodificarToken } from './servicio-sesion';
import { crearTokenDePrueba } from './tokens-de-prueba';

describe('decodificarToken', () => {
  it('lee usuario, nombre (con acentos), rol y expiración', () => {
    const usuario = decodificarToken(crearTokenDePrueba(Rol.DOCENTE));

    expect(usuario?.usuario).toBe('100521347');
    expect(usuario?.nombre).toBe('Laura Méndez Ortega');
    expect(usuario?.rol).toBe(Rol.DOCENTE);
    expect(usuario?.expira.getTime()).toBeGreaterThan(Date.now());
  });

  it('rechaza un rol que no existe, como "Docente"', () => {
    expect(decodificarToken(crearTokenDePrueba('Docente'))).toBeNull();
  });

  it('rechaza algo que no es un JWT', () => {
    expect(decodificarToken('esto-no-es-un-token')).toBeNull();
  });
});

describe('ServicioSesion', () => {
  beforeEach(() => localStorage.clear());

  function crearServicio(): ServicioSesion {
    return TestBed.inject(ServicioSesion);
  }

  it('sin token guardado, no hay sesión', () => {
    const sesion = crearServicio();

    expect(sesion.estaAutenticada()).toBe(false);
    expect(sesion.rol()).toBeNull();
  });

  it('guardar expone el usuario y sobrevive a recargar la página', () => {
    crearServicio().guardar(crearTokenDePrueba(Rol.ALUMNO, { usuario: '202231045' }));

    // Simula una recarga: un servicio nuevo que lee de localStorage.
    TestBed.resetTestingModule();
    const despuesDeRecargar = crearServicio();

    expect(despuesDeRecargar.rol()).toBe(Rol.ALUMNO);
    expect(despuesDeRecargar.usuario()?.usuario).toBe('202231045');
  });

  it('un token guardado que ya expiró se descarta al arrancar', () => {
    localStorage.setItem(
      'schooldesk.token',
      crearTokenDePrueba(Rol.ADMIN, { minutosParaExpirar: -1 }),
    );

    const sesion = crearServicio();

    expect(sesion.estaAutenticada()).toBe(false);
    expect(localStorage.getItem('schooldesk.token')).toBeNull();
  });

  it('cerrar borra el token', () => {
    const sesion = crearServicio();
    sesion.guardar(crearTokenDePrueba());

    sesion.cerrar();

    expect(sesion.estaAutenticada()).toBe(false);
    expect(localStorage.getItem('schooldesk.token')).toBeNull();
  });
});
