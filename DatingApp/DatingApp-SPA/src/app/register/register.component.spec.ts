import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { RegisterComponent, adult } from './register.component';

describe('RegisterComponent', () => {
  function create() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('starts empty instead of pre-filling a password', () => {
    const form = create().form;
    expect(form.controls.password.value).toBe('');
    expect(form.valid).toBe(false);
  });

  it('needs matching passwords of at least 8 characters', () => {
    const form = create().form;
    form.patchValue({
      username: 'sam',
      knownAs: 'Sam',
      dateOfBirth: '1990-04-02',
      city: 'Leeds',
      country: 'UK',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(form.controls.password.hasError('minlength')).toBe(true);

    form.patchValue({ password: 'long-enough', confirmPassword: 'long-enougH' });
    expect(form.hasError('mismatch')).toBe(true);

    form.patchValue({ confirmPassword: 'long-enough' });
    expect(form.valid).toBe(true);
  });

  it('rejects anyone under 18', () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    expect(adult(new FormControl(lastYear.toISOString().slice(0, 10), { nonNullable: true }))).toEqual({ underage: true });
    expect(adult(new FormControl('1990-01-01', { nonNullable: true }))).toBeNull();
  });
});
