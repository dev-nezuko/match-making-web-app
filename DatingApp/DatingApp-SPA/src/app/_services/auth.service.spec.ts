import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { User } from '../_models/user';
import { AuthService } from './auth.service';
import { fakeToken } from './testing';

const lola = { id: 7, knownAs: 'Lola', photoUrl: '/avatars/lola.svg' } as User;

describe('AuthService', () => {
  let http: HttpTestingController;

  function create(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('stores the token and user after logging in', () => {
    const auth = create();
    const token = fakeToken({ nameid: '7' });

    auth.login({ username: 'lola', password: 'password' }).subscribe();
    const req = http.expectOne('http://localhost:5050/auth/login');
    expect(req.request.body).toEqual({ username: 'lola', password: 'password' });
    req.flush({ token, user: lola });

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.userId()).toBe(7);
    expect(auth.photoUrl()).toBe('/avatars/lola.svg');
    expect(localStorage.getItem('token')).toBe(token);
  });

  it('restores a session from storage and drops it on logout', () => {
    localStorage.setItem('token', fakeToken());
    localStorage.setItem('user', JSON.stringify(lola));
    const auth = create();

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.displayName()).toBe('Lola');

    auth.logout();

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('does not count an expired token as logged in', () => {
    localStorage.setItem('token', fakeToken({ exp: 1 }));

    expect(create().isLoggedIn()).toBe(false);
  });

  it('updates the stored user when the main photo changes', () => {
    localStorage.setItem('token', fakeToken());
    localStorage.setItem('user', JSON.stringify(lola));
    const auth = create();

    auth.changeMainPhoto('https://example.test/new.jpg');

    expect(auth.photoUrl()).toBe('https://example.test/new.jpg');
    expect(JSON.parse(localStorage.getItem('user')!).photoUrl).toBe('https://example.test/new.jpg');
  });
});
