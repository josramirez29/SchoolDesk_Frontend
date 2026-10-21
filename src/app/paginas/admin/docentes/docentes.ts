import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { AuthApi } from '../../../nucleo/api/auth.api';
import { Usuario } from '../../../nucleo/api/modelos';
import { Rol } from '../../../nucleo/sesion/roles';
import { DialogoDocente } from './dialogo-docente';

@Component({
  selector: 'app-docentes',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
  templateUrl: './docentes.html',
  styleUrl: './docentes.scss',
})
export class Docentes {
  private readonly api = inject(AuthApi);
  private readonly dialogo = inject(MatDialog);

  readonly docentes = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly columnas = ['usuario', 'apellidos', 'nombre', 'email', 'estado', 'acciones'];

  // Son pocos docentes: se traen todos y se filtran aquí, sin ir al servidor en cada tecla.
  readonly busqueda = new FormControl('', { nonNullable: true });
  private readonly textoBuscado = toSignal(this.busqueda.valueChanges, { initialValue: '' });
  readonly filtrados = computed(() => {
    const texto = this.textoBuscado().trim().toLowerCase();
    return this.docentes().filter((docente) =>
      `${docente.usuario} ${docente.nombre} ${docente.apellidos}`.toLowerCase().includes(texto),
    );
  });

  constructor() {
    this.cargar();
  }

  nuevo(): void {
    this.abrirDialogo(null);
  }

  editar(docente: Usuario): void {
    this.abrirDialogo(docente);
  }

  private cargar(): void {
    this.cargando.set(true);
    this.api.listarUsuarios(Rol.DOCENTE).subscribe({
      next: (docentes) => {
        this.docentes.set(docentes);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private abrirDialogo(docente: Usuario | null): void {
    this.dialogo
      .open(DialogoDocente, { data: docente, width: '480px' })
      .afterClosed()
      .subscribe((guardado) => guardado && this.cargar());
  }
}
