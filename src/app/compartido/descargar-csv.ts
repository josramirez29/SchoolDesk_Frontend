type Celda = string | number | null | undefined;

/**
 * Genera un CSV en el navegador y lo descarga, sin pasar por el servidor.
 *
 * Lleva BOM al inicio (igual que las plantillas del backend) para que Excel
 * muestre bien los acentos al abrirlo.
 */
export function descargarCsv(nombreArchivo: string, filas: Celda[][]): void {
  const texto = filas.map((fila) => fila.map(escapar).join(',')).join('\r\n');
  const archivo = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' });

  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(enlace.href); // libera la memoria del archivo
}

/** Una celda con coma, comillas o salto de línea va entre comillas (regla del formato CSV). */
function escapar(celda: Celda): string {
  const texto = celda === null || celda === undefined ? '' : String(celda);
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}
