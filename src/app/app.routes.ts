import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { CodigoComponent } from './codigo/codigo.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'cuestionario', component: ChatComponent },
  { path: 'about', component: AboutComponent },
  { path: 'codigo', component: CodigoComponent },
];
