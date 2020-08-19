import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../_shared/avatar.component';
import { AuthService } from '../_services/auth.service';
import { errorMessage } from '../_services/error-message';
import { ToastService } from '../_services/toast.service';

@Component({
  selector: 'app-nav',
  imports: [FormsModule, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css',
})
export class NavComponent {
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly credentials = { username: '', password: '' };
  protected readonly menuOpen = signal(false);
  protected readonly signingIn = signal(false);

  login(): void {
    this.signingIn.set(true);
    this.auth.login(this.credentials).subscribe({
      next: (user) => {
        this.signingIn.set(false);
        this.credentials.password = '';
        this.toast.success(`Welcome back, ${user.knownAs}.`);
        this.router.navigate(['/members']);
      },
      error: (error: unknown) => {
        this.signingIn.set(false);
        this.toast.error(
          error instanceof HttpErrorResponse && error.status === 401
            ? 'Wrong username or password.'
            : errorMessage(error),
        );
      },
    });
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.toast.info('You are logged out.');
    this.router.navigate(['/']);
  }
}
