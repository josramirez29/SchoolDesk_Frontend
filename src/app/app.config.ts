import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsMx from '@angular/common/locales/es-MX';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { erroresInterceptor } from './nucleo/errores/errores';
import { sesionExpiradaInterceptor, tokenInterceptor } from './nucleo/sesion/interceptores';

// Fechas y números con formato de México (p. ej. "20 oct 2026", "8.5").
registerLocaleData(localeEsMx);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parámetros de la ruta (p. ej. :nrc) llegan
    // a los componentes como inputs, sin inyectar ActivatedRoute.
    // paramsInheritanceStrategy "always": las rutas hijas (las pestañas de una
    // materia) también reciben el :nrc de la ruta padre.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    // Orden: el token se agrega a la ida; a la vuelta, primero se revisa si la
    // sesión expiró (401) y después se muestra cualquier otro error.
    provideHttpClient(
      withInterceptors([tokenInterceptor, erroresInterceptor, sesionExpiradaInterceptor]),
    ),
    { provide: LOCALE_ID, useValue: 'es-MX' },
  ],
};
