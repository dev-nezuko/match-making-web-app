import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PaginatedResult } from '../../../../DatingApp.API/Models/pagination';
import { Observable } from 'rxjs';
import { User } from '../_models/user';
import { identifierModuleUrl } from '@angular/compiler';
import { Message } from '../_models/message';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(
    page?,
    itemsPerPage?,
    userParams?,
    likesParam?,
    blockParam?
  ): Observable<PaginatedResult<User[]>> {
    const paginatedResult: PaginatedResult<User[]> = new PaginatedResult<
      User[]
    >();

    let params = new HttpParams();
    console.log('user service got ' + blockParam);

    if (page != null && itemsPerPage != null) {
      params = params.append('pageNumber', page);
      params = params.append('pageSize', itemsPerPage);
    }

    if (userParams != null) {
      params = params.append('minAge', userParams.minAge);
      params = params.append('maxAge', userParams.maxAge);
      params = params.append('gender', userParams.gender);
      params = params.append('orderBy', userParams.orderBy);
    }
    if (likesParam === 'Likers') {
      params = params.append('Likers', 'true');
    }

    if (likesParam === 'Likees') {
      console.log('user service is working likes');
      params = params.append('Likees', 'true');
    }
    if (likesParam === 'Dislikers') {
      params = params.append('Dislikers', 'true');
    }

    if (likesParam === 'Dislikees') {
      params = params.append('Dislikees', 'true');
    }

    if (blockParam === 'blockees') {
      console.log('user service is working');
      params = params.append('blockees', 'true');
    }

    return this.http
      .get<User[]>(this.baseUrl + 'users', { observe: 'response', params })
      .pipe(
        map((response) => {
          paginatedResult.result = response.body;
          if (response.headers.get('Pagination') != null) {
            paginatedResult.pagination = JSON.parse(
              response.headers.get('Pagination')
            );
          }
          return paginatedResult;
        })
      );
  }

  getUser(id): Observable<User> {
    return this.http.get<User>(this.baseUrl + 'users/' + id);
  }

  updateUser(id: number, user: User) {
    return this.http.put(this.baseUrl + 'users/' + id, user);
  }

  setMainPhoto(userId: number, id: number) {
    return this.http.post(
      this.baseUrl + 'users/' + userId + '/photos/' + id + '/set',
      {}
    );
  }

  deletePhoto(userId: number, id: number) {
    return this.http.delete(this.baseUrl + 'users/' + userId + '/photos/' + id);
  }

  sendLike(id: number, recepientId: number) {
    return this.http.post(
      this.baseUrl + 'users/' + id + '/like/' + recepientId,
      {}
    );
  }

  unblock(id: number, recepientId: number) {
    return this.http.post(
      this.baseUrl + 'users/' + id + '/unblock/' + recepientId,
      {}
    );
  }
  sendDislike(id: number, recepientId: number) {
    return this.http.post(
      this.baseUrl + 'users/' + id + '/dislike/' + recepientId,
      {}
    );
  }

  getMessages(id: number, page?, itemsPerPage?, messageContainer?) {
    const paginatedResult: PaginatedResult<Message[]> = new PaginatedResult<
      Message[]
    >();

    let params = new HttpParams();

    params = params.append('MessageContainer', messageContainer);

    if (page != null && itemsPerPage != null) {
      params = params.append('pageNumber', page);
      params = params.append('pageSize', itemsPerPage);
    }

    return this.http
      .get<Message[]>(this.baseUrl + 'users/' + id + '/messages', {
        observe: 'response',
        params,
      })
      .pipe(
        map((response) => {
          paginatedResult.result = response.body;
          if (response.headers.get('Pagination') !== null) {
            paginatedResult.pagination = JSON.parse(
              response.headers.get('Pagination')
            );
          }

          return paginatedResult;
        })
      );
  }

  getMessageThread(id: number, recipientId: number) {
    return this.http.get<Message[]>(
      this.baseUrl + 'users/' + id + '/messages/thread/' + recipientId
    );
  }

  sendMessage(id: number, message: Message) {
    return this.http.post(this.baseUrl + 'users/' + id + '/messages', message);
  }

  deleteMessage(id: number, userId: number) {
    return this.http.post(
      this.baseUrl + 'users/' + userId + '/messages/' + id,
      {}
    );
  }

  deleteMessages(id: number, userId: number) {
    return this.http.post(
      this.baseUrl + 'users/' + userId + '/messages/' + id + '/both',
      {}
    );
  }

  blockUser(id: number, recepientId: number) {
    return this.http.post(
      this.baseUrl + 'users/' + id + '/block/' + recepientId,
      {}
    );
  }

  markAsRead(userId: number, messageId: number) {
    this.http
      .post(
        this.baseUrl + 'users/' + userId + '/messages/' + messageId + '/read',
        {}
      )
      .subscribe();
  }
}
