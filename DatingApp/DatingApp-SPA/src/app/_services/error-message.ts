import { HttpErrorResponse } from '@angular/common/http';

interface ProblemDetails {
  title?: string;
  errors?: Record<string, string[]>;
}

/** Turns whatever the API sent back into one sentence for the user. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong.';
  }
  const applicationError = error.headers?.get('Application-Error');
  if (applicationError) {
    return applicationError;
  }
  const body: unknown = error.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object') {
    const problem = body as ProblemDetails;
    if (problem.errors) {
      return Object.values(problem.errors).flat().join(' ');
    }
    if (problem.title) {
      return problem.title;
    }
  }
  switch (error.status) {
    case 0:
      return 'The server could not be reached.';
    case 401:
      return 'That is not allowed with your account.';
    case 404:
      return 'That could not be found.';
    default:
      return error.statusText || 'Something went wrong.';
  }
}
