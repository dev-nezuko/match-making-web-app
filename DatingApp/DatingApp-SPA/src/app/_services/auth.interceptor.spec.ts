import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { fakeToken } from './testing';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const token = fakeToken();

  beforeEach(() => {
    localStorage.setItem('token', token);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('adds the bearer token to API requests', () => {
    http.get('http://localhost:5050/users').subscribe();

    const req = backend.expectOne('http://localhost:5050/users');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush([]);
  });

  it('never sends the token to another host', () => {
    http.get('https://res.cloudinary.com/demo/image.jpg').subscribe();

    const req = backend.expectOne('https://res.cloudinary.com/demo/image.jpg');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush('');
  });
});
