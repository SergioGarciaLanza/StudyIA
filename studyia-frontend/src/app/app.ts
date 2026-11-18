
import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, QuizQuestion } from './services/api.service';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  private apiService = inject(ApiService);

  mensajeConexion = signal('Conectando...');
  conectado = signal(false);

  contenido = signal('');
  mensajeAccion = signal('');

  resumen = signal('');
  cargandoResumen = signal(false);

  preguntas = signal<QuizQuestion[]>([]);
  respuestasSeleccionadas = signal<number[]>([]);
  testCorregido = signal(false);
  cargandoTest = signal(false);

  ngOnInit(): void {
    this.apiService.checkBackend().subscribe({
      next: (response) => {
        this.mensajeConexion.set(
          response.application + ' - ' + response.status
        );
        this.conectado.set(true);
      },
      error: () => {
        this.mensajeConexion.set('Backend desconectado');
        this.conectado.set(false);
      }
    });
  }

  actualizarTexto(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.contenido.set(textarea.value);
    this.mensajeAccion.set('');
  }

  generarResumen(): void {
    if (!this.contenido().trim() || this.cargandoResumen()) {
      return;
    }

    this.cargandoResumen.set(true);
    this.resumen.set('');
    this.mensajeAccion.set('Generando resumen con inteligencia artificial...');

    this.apiService.generateSummary(this.contenido()).subscribe({
      next: (response) => {
        this.resumen.set(response.summary);
        this.mensajeAccion.set('¡Resumen generado correctamente!');
        this.cargandoResumen.set(false);
      },
      error: (error) => {
        console.error('Error al generar resumen:', error);
        this.mensajeAccion.set(
          error.error?.detail || 'No se ha podido generar el resumen. Inténtalo de nuevo.'
        );
        this.cargandoResumen.set(false);
      }
    });
  }

  generarTest(): void {
    if (!this.contenido().trim() || this.cargandoTest()) {
      return;
    }

    this.cargandoTest.set(true);
    this.preguntas.set([]);
    this.respuestasSeleccionadas.set([]);
    this.testCorregido.set(false);
    this.mensajeAccion.set('Generando preguntas tipo test...');

    this.apiService.generateQuiz(this.contenido()).subscribe({
      next: (response) => {
        this.preguntas.set(response.questions);
        this.respuestasSeleccionadas.set(
          response.questions.map(() => -1)
        );
        this.mensajeAccion.set('¡Test generado correctamente!');
        this.cargandoTest.set(false);
      },
      error: (error) => {
        console.error('Error al generar test:', error);
        this.mensajeAccion.set(
          error.error?.detail || 'No se ha podido generar el test.'
        );
        this.cargandoTest.set(false);
      }
    });
  }

  descargarResumenPDF(): void {
    const contenido = this.resumen();

    if (!contenido) {
      return;
    }

    const pdf = new jsPDF();
    const margen = 20;
    const anchoTexto = 170;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Resumen de estudio - StudyIA', margen, 20);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const lineas = pdf.splitTextToSize(contenido, anchoTexto);

    let posicionY = 35;
    const alturaLinea = 6;
    const alturaPagina = pdf.internal.pageSize.getHeight();

    for (const linea of lineas) {
      if (posicionY + alturaLinea > alturaPagina - margen) {
        pdf.addPage();
        posicionY = margen;
      }

      pdf.text(linea, margen, posicionY);
      posicionY += alturaLinea;
    }

    pdf.save('resumen-studyia.pdf');
  }

  descargarTestPDF(): void {
    const preguntas = this.preguntas();

    if (!preguntas.length || !this.testCorregido()) {
      return;
    }

    const pdf = new jsPDF();
    const margen = 20;
    const anchoTexto = 170;
    const alturaPagina = pdf.internal.pageSize.getHeight();

    let posicionY = 20;

    const comprobarEspacio = (altura: number): void => {
      if (posicionY + altura > alturaPagina - margen) {
        pdf.addPage();
        posicionY = margen;
      }
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Test de estudio - StudyIA', margen, posicionY);

    posicionY += 12;

    pdf.setFontSize(13);
    pdf.text(
      `Resultado: ${this.obtenerPuntuacion()} / ${preguntas.length}`,
      margen,
      posicionY
    );

    posicionY += 15;

    preguntas.forEach((pregunta, indice) => {
      comprobarEspacio(35);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);

      const textoPregunta = pdf.splitTextToSize(
        `${indice + 1}. ${pregunta.question}`,
        anchoTexto
      );

      pdf.text(textoPregunta, margen, posicionY);
      posicionY += textoPregunta.length * 6 + 3;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      pregunta.options.forEach((opcion, indiceOpcion) => {
        const respuesta = this.respuestasSeleccionadas()[indice] === indiceOpcion;
        const correcta = pregunta.correct_answer === indiceOpcion;

        let etiqueta = '';

        if (respuesta) etiqueta += ' [Tu respuesta]';
        if (correcta) etiqueta += ' [Correcta]';

        const lineas = pdf.splitTextToSize(
          `- ${opcion}${etiqueta}`,
          anchoTexto
        );

        comprobarEspacio(lineas.length * 5 + 2);
        pdf.text(lineas, margen + 4, posicionY);
        posicionY += lineas.length * 5 + 2;
      });

      posicionY += 3;
      comprobarEspacio(25);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Explicacion:', margen + 4, posicionY);
      posicionY += 6;

      pdf.setFont('helvetica', 'normal');

      const explicacion = pdf.splitTextToSize(
        pregunta.explanation,
        anchoTexto - 4
      );

      comprobarEspacio(explicacion.length * 5);
      pdf.text(explicacion, margen + 4, posicionY);
      posicionY += explicacion.length * 5 + 10;
    });

    pdf.save('test-corregido-studyia.pdf');
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const extension = file.name.toLowerCase().split('.').pop();

    if (extension !== 'pdf' && extension !== 'txt') {
      this.mensajeAccion.set('Solo se permiten archivos PDF y TXT.');
      input.value = '';
      return;
    }

    this.mensajeAccion.set('Procesando documento...');
    this.resumen.set('');
    this.preguntas.set([]);

    this.apiService.uploadDocument(file).subscribe({
      next: (response) => {
        this.contenido.set(response.text);
        this.mensajeAccion.set(
          `Documento "${response.filename}" cargado correctamente.`
        );
        input.value = '';
      },
      error: (error) => {
        console.error('Error al cargar documento:', error);
        this.mensajeAccion.set(
          error.error?.detail || 'No se ha podido procesar el documento.'
        );
        input.value = '';
      }
    });
  }

  seleccionarRespuesta(indicePregunta: number, indiceOpcion: number): void {
    if (this.testCorregido()) {
      return;
    }

    this.respuestasSeleccionadas.update(respuestas =>
      respuestas.map((respuesta, indice) =>
        indice === indicePregunta ? indiceOpcion : respuesta
      )
    );
  }

  corregirTest(): void {
    if (
      this.respuestasSeleccionadas().some(respuesta => respuesta === -1)
    ) {
      this.mensajeAccion.set('Responde todas las preguntas antes de corregir.');
      return;
    }

    this.testCorregido.set(true);
    this.mensajeAccion.set('¡Test corregido!');
  }

  obtenerPuntuacion(): number {
    return this.preguntas().filter(
      (pregunta, indice) =>
        pregunta.correct_answer === this.respuestasSeleccionadas()[indice]
    ).length;
  }
}
