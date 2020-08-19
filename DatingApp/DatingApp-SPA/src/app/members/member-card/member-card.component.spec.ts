import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { User } from '../../_models/user';
import { fakeToken } from '../../_services/testing';
import { ToastService } from '../../_services/toast.service';
import { MemberCardComponent } from './member-card.component';

const roy: User = {
  id: 12,
  username: 'roy',
  knownAs: 'Roy',
  age: 33,
  gender: 'male',
  created: '2024-01-01',
  lastActive: '2024-02-01',
  photoUrl: null,
  city: 'Davenport',
  country: 'Tuvalu',
};

describe('MemberCardComponent', () => {
  beforeEach(() => {
    localStorage.setItem('token', fakeToken({ nameid: '7' }));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => localStorage.clear());

  function render() {
    const fixture = TestBed.createComponent(MemberCardComponent);
    fixture.componentRef.setInput('user', roy);
    fixture.detectChanges();
    return fixture;
  }

  it('shows name, age, city and a profile link', () => {
    const el: HTMLElement = render().nativeElement;

    expect(el.querySelector('h3')?.textContent).toContain('Roy, 33');
    expect(el.textContent).toContain('Davenport');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/members/12');
  });

  it('likes the member as the logged-in user and says so', () => {
    const fixture = render();
    const http = TestBed.inject(HttpTestingController);
    const toast = TestBed.inject(ToastService);
    const reactions: string[] = [];
    fixture.componentInstance.reacted.subscribe((r) => reactions.push(r));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[aria-label="Like Roy"]')!.click();
    http.expectOne('http://localhost:5050/users/7/like/12').flush(null);

    expect(reactions).toEqual(['like']);
    expect(toast.toasts()[0]?.text).toBe('You liked Roy.');
    http.verify();
  });

  it('reports an API refusal instead of claiming success', () => {
    const fixture = render();
    const http = TestBed.inject(HttpTestingController);
    const toast = TestBed.inject(ToastService);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[aria-label="Like Roy"]')!.click();
    http
      .expectOne('http://localhost:5050/users/7/like/12')
      .flush('You already like this user', { status: 400, statusText: 'Bad Request' });

    expect(toast.toasts()[0]).toMatchObject({ kind: 'error', text: 'You already like this user' });
  });
});
