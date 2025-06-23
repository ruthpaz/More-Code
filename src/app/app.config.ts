import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { routes } from './app.routes'; // 👈 importa tus rutas

export const appConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes), // 👈 usa tus rutas reales aquí
    importProvidersFrom(FormsModule, CommonModule) // para ngModel y ngClass
  ]
};
