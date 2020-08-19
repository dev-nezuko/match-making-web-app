import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { fakeToken } from '../_services/testing';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function run() {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  afterEach(() => localStorage.clear());

  it('lets a logged-in member through', () => {
    localStorage.setItem('token', fakeToken());
    expect(run()).toBe(true);
  });

  it('sends everyone else to the home page', () => {
    localStorage.setItem('token', fakeToken({ exp: 1 }));
    const result = run();
    expect(result instanceof UrlTree && result.toString()).toBe('/');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
