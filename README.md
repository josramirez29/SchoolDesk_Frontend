# SchoolDesk - Frontend

Interfaz web de SchoolDesk, el sistema escolar para administrar alumnos,
materias, calificaciones y asistencia con QR dinámico. Está hecha en Angular 22
con Angular Material y tiene una sección para cada rol: administración, docente
y alumno.

Backend: https://github.com/josramirez29/SchoolDesk_Backend


## Qué puede hacer cada rol

Administración:

- Alumnos y docentes: buscar, crear y editar.
- Materias: crear, editar, eliminar e inscribir o dar de baja alumnos.
- Importar alumnos, docentes, materias e inscripciones desde CSV. Cada tipo
  tiene su plantilla para descargar, y si un archivo tiene errores se muestra
  qué fila falló y por qué.

Docente:

- Ponderaciones: categorías con su peso (deben sumar 100 %) y las tareas de
  cada categoría.
- Calificaciones: un concentrado editable con todos los alumnos y tareas; los
  promedios se recalculan al guardar.
- Asistencia: abre una sesión de 10 minutos y escanea con la cámara el QR de
  cada alumno. Hasta el minuto 5 cuenta como presente y después como retardo.
- Reporte: calificaciones y asistencia de la materia en una sola tabla, que se
  puede ordenar y descargar en CSV.

Alumno:

- Sus materias con el promedio actual.
- El detalle de cada materia: calificaciones por categoría y su asistencia.
- Su QR de asistencia, pensado para el celular.

Todos los usuarios pueden cambiar su contraseña y elegir tema claro u oscuro.


## Cómo correrlo

Requisitos: Node.js 22.22 o 24, y el backend levantado (ver su README).

```bash
npm install
npm start
```

La aplicación queda en http://localhost:4200 y habla con el gateway del backend
en http://localhost:8000. Esa dirección está en src/environments.

Los usuarios de ejemplo están en el README del backend.

Otros comandos:

```bash
npm test
npm run build
npx prettier --write src
```

El primero corre las pruebas, el segundo compila para producción (queda en
dist/) y el tercero da formato al código.


## Cómo está organizado

```
src/app/
  nucleo/        Lo que usa toda la aplicación y no tiene pantalla
    api/         Una clase por servicio del backend (auth, academico, asistencia) y los modelos
    sesion/      Sesión con el JWT, guardias de rutas e interceptores
    errores/     Formato de errores del backend y aviso automático
    tema/        Tema claro u oscuro
  compartido/    Piezas reutilizables: el marco con el menú, diálogo de confirmación,
                 botón de tema, descarga de CSV y estilos comunes
  paginas/       Una carpeta por pantalla
    login/, cuenta/
    admin/       alumnos, docentes, materias e importar
    docente/     mis materias y la materia con sus pestañas
    alumno/      mis materias, la materia y el QR
```

Las pantallas no llaman a HttpClient directamente: usan las clases de nucleo/api.
Así cada URL del backend está escrita en un solo lugar.


## Decisiones principales

Rutas por rol con carga diferida: cada rol tiene su archivo de rutas
(admin.routes.ts, docente.routes.ts, alumno.routes.ts) que se descarga solo
cuando alguien con ese rol entra. Un alumno nunca descarga el código del admin.
Los 3 roles comparten el mismo marco (menú lateral y barra); cada uno le pasa
sus opciones de menú desde su ruta.

Sesión con signals: el token se guarda en localStorage para que la sesión
sobreviva a recargar la página. El frontend solo lee el token (nombre, rol y
expiración) para decidir qué mostrar; no lo valida, eso lo hace el backend, que
tiene la clave.

Guardias e interceptores:

- sesionGuard: sin sesión, manda al login.
- rolGuard: si el rol no corresponde, manda a la sección del rol del usuario.
- invitadoGuard: con sesión, el login redirige a la sección del rol.
- tokenInterceptor: agrega el JWT a cada petición.
- erroresInterceptor: muestra el mensaje del backend en un aviso, en un solo
  lugar. Las pantallas que muestran el error a su manera lo desactivan con
  SIN_AVISO_DE_ERROR.
- sesionExpiradaInterceptor: ante un 401, cierra la sesión y manda al login
  con el aviso "Tu sesión expiró".

Componentes standalone, signals e inputs de ruta: no hay NgModules. Los
parámetros de la URL (por ejemplo el NRC) llegan como input() gracias a
withComponentInputBinding. La aplicación funciona sin zone.js: la vista se
actualiza cuando cambia un signal.

Si un servicio del backend no responde, la pantalla sigue funcionando con lo
que sí llegó. Por ejemplo, si servicio-asistencia está apagado, el alumno ve
sus calificaciones y solo la sección de asistencia muestra un aviso.

QR de asistencia: el alumno pide un token cada 25 segundos (el backend le da
30 de vida) y lo muestra como QR. El token es de un solo uso: si alguien le
toma foto y lo comparte, deja de servir en cuanto se escanea o expira. Cuando
el docente lo escanea, la siguiente petición responde que ya tiene asistencia
y la pantalla deja de renovar. El QR siempre es negro sobre blanco, aunque el
tema sea oscuro, para que la cámara lo lea bien.

Tema: Angular Material define sus colores con la función CSS light-dark(), así
que basta con cambiar color-scheme en la etiqueta html para cambiar toda la
aplicación de tema. La primera vez se usa la preferencia del sistema operativo
y después la que elija el usuario.


## Pruebas

Son 25 pruebas con Vitest:

- servicio-sesion: 7 (leer el token, expiración, cerrar sesión)
- interceptores: 7 (agregar el token, avisos de error, 401)
- guardias: 5 (sin sesión, rol equivocado, invitado)
- mi-qr: 3 (renovación cada 25 s, dejar de renovar, reintentar)
- servicio-tema: 2
- app: 1

Las peticiones HTTP se responden con un servidor falso (HttpTestingController)
y el paso del tiempo se controla con temporizadores falsos, así las pruebas del
QR no tienen que esperar 25 segundos reales.
