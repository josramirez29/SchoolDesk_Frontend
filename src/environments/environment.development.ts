// Configuración para desarrollo (ng serve). Reemplaza a environment.ts al compilar.
export const environment = {
  // Todas las peticiones van al gateway, que las reparte entre los servicios.
  urlApi: 'http://localhost:8000/api',
};
