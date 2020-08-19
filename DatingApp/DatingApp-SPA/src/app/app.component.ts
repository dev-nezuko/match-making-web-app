import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './nav/nav.component';
import { ToastOutletComponent } from './_shared/toast-outlet.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent, ToastOutletComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
