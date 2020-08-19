import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message, MessageContainer } from '../_models/message';
import { PaginatedResult, Pagination } from '../_models/pagination';
import { Photo } from '../_models/photo';
import { ProfileUpdate, User } from '../_models/user';

export interface MemberFilters {
  minAge: number;
  maxAge: number;
  gender: string;
  orderBy: 'lastActive' | 'created';
}

/** The API's relationship lists: who liked/disliked whom, and who I blocked. */
export type MemberList = 'likers' | 'likees' | 'dislikers' | 'dislikees' | 'blockees';

function toPaginated<T>(response: HttpResponse<T>): PaginatedResult<T> {
  const header = response.headers.get('Pagination');
  return {
    result: response.body as T,
    pagination: header ? (JSON.parse(header) as Pagination) : null,
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getUsers(
    page: number,
    pageSize: number,
    options: { filters?: MemberFilters; list?: MemberList } = {},
  ): Observable<PaginatedResult<User[]>> {
    let params = new HttpParams().set('pageNumber', page).set('pageSize', pageSize);
    const { filters, list } = options;
    if (filters) {
      params = params
        .set('minAge', filters.minAge)
        .set('maxAge', filters.maxAge)
        .set('gender', filters.gender)
        .set('orderBy', filters.orderBy);
    }
    if (list) {
      params = params.set(list, true);
    }
    return this.http
      .get<User[]>(this.baseUrl + 'users', { observe: 'response', params })
      .pipe(map(toPaginated));
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}users/${id}`);
  }

  updateUser(id: number, update: ProfileUpdate): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}users/${id}`, update);
  }

  uploadPhoto(userId: number, file: File): Observable<Photo> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<Photo>(`${this.baseUrl}users/${userId}/photos`, form);
  }

  setMainPhoto(userId: number, photoId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}users/${userId}/photos/${photoId}/set`, {});
  }

  deletePhoto(userId: number, photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}users/${userId}/photos/${photoId}`);
  }

  like(userId: number, recipientId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}users/${userId}/like/${recipientId}`, {});
  }

  dislike(userId: number, recipientId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}users/${userId}/dislike/${recipientId}`, {});
  }

  block(userId: number, recipientId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}users/${userId}/block/${recipientId}`, {});
  }

  unblock(userId: number, recipientId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}users/${userId}/unblock/${recipientId}`, {});
  }

  getMessages(
    userId: number,
    page: number,
    pageSize: number,
    container: MessageContainer,
  ): Observable<PaginatedResult<Message[]>> {
    const params = new HttpParams()
      .set('messageContainer', container)
      .set('pageNumber', page)
      .set('pageSize', pageSize);
    return this.http
      .get<Message[]>(`${this.baseUrl}users/${userId}/messages`, { observe: 'response', params })
      .pipe(map(toPaginated));
  }

  getMessageThread(userId: number, recipientId: number): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.baseUrl}users/${userId}/messages/thread/${recipientId}`,
    );
  }

  sendMessage(userId: number, recipientId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}users/${userId}/messages`, {
      recipientId,
      content,
    });
  }

  deleteMessage(userId: number, messageId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}users/${userId}/messages/${messageId}`, {});
  }

  deleteMessageForEveryone(userId: number, messageId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}users/${userId}/messages/${messageId}/both`, {});
  }

  markAsRead(userId: number, messageId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}users/${userId}/messages/${messageId}/read`, {});
  }
}
