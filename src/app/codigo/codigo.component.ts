import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HighlightModule, provideHighlightOptions } from 'ngx-highlightjs';
import { OpenAIService } from '../services/openai.service';

@Component({
  selector: 'app-codigo',
  standalone: true,
  imports: [CommonModule, FormsModule, HighlightModule],
  providers: [
    provideHighlightOptions({
      languages: {
        java: () => import('highlight.js/lib/languages/java'),
      },
    }),
  ],
  templateUrl: './codigo.component.html',
  styleUrls: ['./codigo.component.css'],
})
export class CodigoComponent {
  javaCode: string = '';
  isValidCode: boolean = true;
  validationMessage: string = '';
  messages: { sender: 'user' | 'bot'; text: string }[] = [];
  responseFromAI: string = '';
  codigoExtraido: string = '';
  explicacionIA: string = '';
  cargando: boolean = false;


  constructor(private aiService: OpenAIService) {}

  validarCodigo(): boolean {
    const functionPattern =
      /(?:public|private|protected|static)?\s*\w+\s+\w+\s*\([^\)]*\)\s*\{[^\}]*\}/;
    if (!functionPattern.test(this.javaCode)) {
      this.validationMessage =
        'El código debe contener al menos una función válida en el formato adecuado.';
      return false;
    }
    this.validationMessage = '';
    return true;
  }

  verificarCodigoConIA(codigo: string) {
  const prompt = `Verifica si el siguiente código Java es correcto. Si está incorrecto, proporciona la corrección:\n\n${codigo}`;
  this.cargando = true;

  this.aiService.sendMessageToGemini(prompt).subscribe({
    next: (res) => {
      this.cargando = false;
      const aiResponse =
        res?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'No se pudo verificar el código.';
      this.responseFromAI = aiResponse;
      this.codigoExtraido = this.extraerBloqueCodigo(aiResponse);
      this.explicacionIA = this.extraerExplicacion(aiResponse);
      this.messages.push({ sender: 'bot', text: aiResponse });

      // ✅ Sonido al responder
      new Audio('./assets/songs/correct.mp3').play();
    },
    error: () => {
      this.cargando = false;
      this.responseFromAI = '❌ Error al conectar con la IA para verificar el código.';
      this.codigoExtraido = '';
      this.explicacionIA = '';
      this.messages.push({ sender: 'bot', text: this.responseFromAI });
    },
  });
}


  contieneCodigoJava(texto: string): boolean {
    return /class\s+\w+|public\s+static\s+void/.test(texto);
  }

  copiarCodigo() {
    navigator.clipboard.writeText(this.codigoExtraido).then(() => {
      alert('📋 Código copiado al portapapeles.');
    });
  }

  esCodigoValido(respuesta: string): boolean {
    return (
      respuesta.toLowerCase().includes('correcto') ||
      respuesta.toLowerCase().includes('no necesita corrección')
    );
  }

  extraerBloqueCodigo(respuesta: string): string {
    const match = respuesta.match(/```java\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : '';
  }

  extraerExplicacion(respuesta: string): string {
    return respuesta.replace(/```java[\s\S]*?```/, '').trim();
  }

  enviarCodigo() {
    if (this.javaCode.trim()) {
      if (this.validarCodigo()) {
        this.messages.push({ sender: 'user', text: this.javaCode });
        this.verificarCodigoConIA(this.javaCode);
      } else {
        alert(this.validationMessage);
      }
    } else {
      alert('Por favor ingresa algún código Java.');
    }
  }
}
