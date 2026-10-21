/**
 * Única definición de roles del frontend.
 *
 * Los valores son EXACTAMENTE los del backend (enum Rol en comun/roles.py), porque
 * viajan en el JWT. En AGM había "DOCENTE", "Docente", "ADMIN", "Administrador"...
 * y eso causaba errores 403; aquí ninguna pantalla escribe un rol como texto.
 */
export enum Rol {
  ADMIN = 'ADMIN',
  DOCENTE = 'DOCENTE',
  ALUMNO = 'ALUMNO',
}

/** Pantalla a la que entra cada rol al iniciar sesión. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  [Rol.ADMIN]: '/admin',
  [Rol.DOCENTE]: '/docente',
  [Rol.ALUMNO]: '/alumno',
};
