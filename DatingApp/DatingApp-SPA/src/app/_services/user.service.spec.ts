import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PaginatedResult } from '../_models/pagination';
import { User } from '../_models/user';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends filters as query parameters and reads the Pagination header', () => {
    let page: PaginatedResult<User[]> | undefined;
    service
      .getUsers(2, 8, { filters: { minAge: 25, maxAge: 40, gender: 'male', orderBy: 'created' } })
      .subscribe((result) => (page = result));

    const req = http.expectOne((r) => r.url === 'http://localhost:5050/users');
    expect(req.request.params.toString()).toBe(
      'pageNumber=2&pageSize=8&minAge=25&maxAge=40&gender=male&orderBy=created',
    );
    req.flush([{ id: 1 }], {
      headers: { Pagination: '{"currentPage":2,"itemsPerPage":8,"totalItems":9,"totalPages":2}' },
    });

    expect(page?.result.length).toBe(1);
    expect(page?.pagination?.totalItems).toBe(9);
  });

  it('asks for a relationship list with a single flag', () => {
    service.getUsers(1, 8, { list: 'blockees' }).subscribe();

    const req = http.expectOne((r) => r.url === 'http://localhost:5050/users');
    expect(req.request.params.get('blockees')).toBe('true');
    req.flush([]);
  });

  it('copes with a response that has no Pagination header', () => {
    let page: PaginatedResult<User[]> | undefined;
    service.getUsers(1, 8).subscribe((result) => (page = result));

    http.expectOne((r) => r.url === 'http://localhost:5050/users').flush([]);

    expect(page?.pagination).toBeNull();
  });

  it('posts a message to the sender’s thread', () => {
    service.sendMessage(7, 12, 'Hello').subscribe();

    const req = http.expectOne('http://localhost:5050/users/7/messages');
    expect(req.request.body).toEqual({ recipientId: 12, content: 'Hello' });
    req.flush({});
  });
});
