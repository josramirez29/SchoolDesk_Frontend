/**
 * Formato de los datos que devuelve y recibe la API.
 *
 * Cada interfaz refleja un esquema de Pydantic del backend, con los mismos nombres
 * de campos. Si el backend cambia un esquema, aquí se cambia la interfaz y el
 * compilador señala cada pantalla afectada.
 */

import { Rol } from '../sesion/roles';

// --- servicio-auth ---

export interface Usuario {
  usuario: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface RespuestaLogin {
  token_acceso: string;
  tipo_token: string;
  usuario: Usuario;
}

/** Para crear una cuenta de ADMIN o DOCENTE (las de alumno se crean desde academico). */
export interface UsuarioNuevo {
  usuario: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: Rol;
}

/** Edición parcial: solo se cambian los campos que se manden. */
export interface UsuarioEdicion {
  nombre?: string;
  apellidos?: string;
  email?: string;
  activo?: boolean;
  restablecer_contrasena?: boolean;
}

// --- servicio-academico ---

export interface Alumno {
  matricula: string;
  nombre: string;
  apellidos: string;
}

export interface AlumnoNuevo extends Alumno {
  email: string; // no se guarda en academico: se manda a auth para crear la cuenta
}

export interface MateriaResumen {
  nrc: string;
  clave: string;
  nombre: string;
  seccion: string;
  nombre_docente: string;
}

export interface AlumnoDetalle extends Alumno {
  materias: MateriaResumen[];
}

export interface Materia extends MateriaResumen {
  num_empleado_docente: string;
}

export interface MateriaNueva {
  nrc: string;
  clave: string;
  nombre: string;
  seccion: string;
  num_empleado_docente: string;
}

/** Edición parcial. El NRC no se edita: es el identificador que usan los demás servicios. */
export type MateriaEdicion = Partial<Omit<MateriaNueva, 'nrc'>>;
