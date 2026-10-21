import { TestBed } from '@angular/core/testing';

import { ServicioTema } from './servicio-tema';

describe('ServicioTema', () => {
  beforeEach(() => localStorage.clear());

  function crearServicio(): ServicioTema {
    const servicio = TestBed.inject(ServicioTema);
    TestBed.tick(); // ejecuta el effect que aplica el tema al documento
    return servicio;
  }

  it('alternar cambia el color-scheme del documento y lo recuerda', () => {
    localStorage.setItem('schooldesk.tema', 'claro');
    const servicio = crearServicio();
    expect(document.documentElement.style.colorScheme).toBe('light');

    servicio.alternar();
    TestBed.tick();

    expect(servicio.tema()).toBe('oscuro');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('schooldesk.tema')).toBe('oscuro');
  });

  it('usa el tema guardado de una visita anterior', () => {
    localStorage.setItem('schooldesk.tema', 'oscuro');
    expect(crearServicio().tema()).toBe('oscuro');
  });
});
