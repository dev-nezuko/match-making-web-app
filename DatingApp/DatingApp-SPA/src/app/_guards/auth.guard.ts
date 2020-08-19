import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../_services/auth.service';
import { ToastService } from '../_services/toast.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) {
    return true;
  }
  auth.logout();
  inject(ToastService).info('Log in to see members and messages.');
  return inject(Router).createUrlTree(['/']);
};
