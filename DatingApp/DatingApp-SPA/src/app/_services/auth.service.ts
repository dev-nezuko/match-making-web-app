import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Registration, User } from '../_models/user';
import { decodeToken, isExpired } from './jwt';

interface LoginResponse {
  token: string;
  user: User;
}

function readStoredUser(): User | null {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + 'auth/';
  private readonly tokenValue = signal<string | null>(localStorage.getItem('token'));

  readonly currentUser = signal<User | null>(readStoredUser());
  readonly claims = computed(() => {
    const token = this.tokenValue();
    return token ? decodeToken(token) : null;
  });
  readonly userId = computed(() => Number(this.claims()?.nameid ?? 0));
  readonly photoUrl = computed(() => this.currentUser()?.photoUrl ?? null);
  readonly displayName = computed(
    () => this.currentUser()?.knownAs ?? this.claims()?.unique_name ?? '',
  );

  get token(): string | null {
    return this.tokenValue();
  }

  isLoggedIn(): boolean {
    return !isExpired(this.claims());
  }

  login(credentials: { username: string; password: string }): Observable<User> {
    return this.http.post<LoginResponse>(this.baseUrl + 'login', credentials).pipe(
      map(({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.tokenValue.set(token);
        this.currentUser.set(user);
        return user;
      }),
    );
  }

  register(registration: Registration): Observable<User> {
    return this.http.post<User>(this.baseUrl + 'register', registration);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenValue.set(null);
    this.currentUser.set(null);
  }

  changeMainPhoto(photoUrl: string): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }
    const updated = { ...user, photoUrl };
    this.currentUser.set(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  }
}
