import { Component, inject } from '@angular/core';
import { ToastService } from '../_services/toast.service';

@Component({
  selector: 'app-toast-outlet',
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.kind" role="status">
          <span>{{ toast.text }}</span>
          <button
            type="button"
            class="toast__close"
            aria-label="Dismiss"
            (click)="toastService.dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-outlet.component.css',
})
export class ToastOutletComponent {
  protected readonly toastService = inject(ToastService);
}
