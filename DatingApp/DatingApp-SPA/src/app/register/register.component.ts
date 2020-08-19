import { Component, inject, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../_services/auth.service';
import { errorMessage } from '../_services/error-message';
import { ToastService } from '../_services/toast.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirmPassword')?.value
    ? null
    : { mismatch: true };
}

/** Members must be 18; the API's age filter starts there too. */
export function adult(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const born = new Date(control.value);
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  return born <= eighteenYearsAgo ? null : { underage: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly cancelRegister = output();
  protected readonly submitting = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      gender: ['female', Validators.required],
      username: ['', [Validators.required, Validators.maxLength(32)]],
      knownAs: ['', Validators.required],
      dateOfBirth: ['', [Validators.required, adult]],
      city: ['', Validators.required],
      country: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }

  register(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { gender, username, knownAs, dateOfBirth, city, country, password } =
      this.form.getRawValue();
    const registration = { gender, username, knownAs, dateOfBirth, city, country, password };
    this.submitting.set(true);
    this.auth
      .register(registration)
      .pipe(
        switchMap(() =>
          this.auth.login({ username: registration.username, password: registration.password }),
        ),
      )
      .subscribe({
        next: (user) => {
          this.toast.success(`Welcome, ${user.knownAs}. Your account is ready.`);
          this.router.navigate(['/members']);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.toast.error(errorMessage(error));
        },
      });
  }
}
