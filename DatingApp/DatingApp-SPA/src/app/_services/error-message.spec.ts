import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('uses a plain-text body from the API', () => {
    const error = new HttpErrorResponse({ status: 400, error: 'Username already exists' });
    expect(errorMessage(error)).toBe('Username already exists');
  });

  it('joins validation errors from a problem-details body', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { title: 'One or more validation errors occurred.', errors: { Password: ['Too short.'], City: ['Required.'] } },
    });
    expect(errorMessage(error)).toBe('Too short. Required.');
  });

  it('prefers the Application-Error header', () => {
    const error = new HttpErrorResponse({
      status: 500,
      headers: new HttpHeaders({ 'Application-Error': 'Database is locked' }),
    });
    expect(errorMessage(error)).toBe('Database is locked');
  });

  it('explains an unreachable server', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toBe('The server could not be reached.');
  });

  it('falls back for anything that is not an HTTP error', () => {
    expect(errorMessage(new Error('boom'))).toBe('Something went wrong.');
  });
});
