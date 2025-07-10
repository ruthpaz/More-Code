import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenAIService } from '../services/openai.service';

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.js';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],

  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  tipoCuestionario: string = 'opcion-multiple';
  visualizarCuestionario: string = 'sinrespuesta-incluida';
  selectedFile: File | null = null;
  userInput = '';
  messages: { sender: 'user' | 'bot', text: string }[] = [];

  constructor(private aiService: OpenAIService) {}

  ngOnInit(): void {
    const cuestionarioGuardado = localStorage.getItem('cuestionarioActual');
    if (cuestionarioGuardado) {
      this.messages.push({ sender: 'bot', text: cuestionarioGuardado });
    }
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const input = this.userInput;
    this.messages.push({ sender: 'user', text: input });
    this.userInput = '';

    this.aiService.sendMessageToGemini(input).subscribe({
      next: (res) => {
        const botText = res?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';
        this.messages.push({ sender: 'bot', text: botText });
      },
      error: () => {
        this.messages.push({ sender: 'bot', text: '❌ Error al conectar con Gemini.' });
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedFile = input.files[0];
  }

  async generarCuestionario() {
    if (!this.selectedFile) {
      alert('Por favor selecciona un archivo PDF.');
      return;
    }

    const file = this.selectedFile;

    if (file.type !== 'application/pdf') {
      alert('Formato no soportado. Usa solo PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const typedArray = new Uint8Array(reader.result as ArrayBuffer);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

      let texto = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        texto += content.items.map((item: any) => item.str).join(' ') + '\n';
      }

      this.enviarTextoAGemini(texto);
    };

    reader.readAsArrayBuffer(file);
  }

  enviarTextoAGemini(texto: string) {
    let prompt = '';

    if (this.tipoCuestionario === 'opcion-multiple') {
      prompt = `Genera un cuestionario de solo preguntas con incisos (A, B, C, D) a partir de los siguientes apuntes:\n\n${texto}`;
    } else if (this.tipoCuestionario === 'verdadero-falso') {
      prompt = `Genera un cuestionario con preguntas de tipo Verdadero o Falso a partir de los siguientes apuntes:\n\n${texto}`;
    } else if (this.tipoCuestionario === 'preguntas-simples') {
      prompt = `Extrae una lista de preguntas simples basadas en los siguientes apuntes, sin incisos ni opciones múltiples:\n\n${texto}`;
    }

    if (this.visualizarCuestionario === 'respuesta-incluida') {
      prompt += '\n\nIncluye las respuestas correctas en el cuestionario.';
    } else if (this.visualizarCuestionario === 'sinrespuesta-incluida') {
      prompt += '\n\nNo incluyas las respuestas correctas en el cuestionario.';
    }

    this.aiService.sendMessageToGemini(prompt).subscribe({
      next: (res) => {
        const cuestionario = res?.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el cuestionario.';

        // ✅ Limpiar mensajes anteriores y agregar solo el nuevo cuestionario
        this.messages = [{ sender: 'bot', text: cuestionario }];

        // ✅ Guardar y mostrar
        localStorage.setItem('cuestionarioActual', cuestionario);
        console.log('📦 Cuestionario guardado en localStorage:', cuestionario);
      },
      error: () => {
        this.messages.push({ sender: 'bot', text: '❌ Error al generar cuestionario con Gemini.' });
      }
    });
  }



  
  imprimirCuestionario() {
    const printContent = document.getElementById('cuestionario');
    const WindowPrt = window.open('', '', 'width=800,height=600');
    if (printContent && WindowPrt) {
      WindowPrt.document.write(`
        <html>
          <head>
            <title>Cuestionario Generado</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      WindowPrt.document.close();
      WindowPrt.focus();
      WindowPrt.print();
      WindowPrt.close();
    }
  }
}
