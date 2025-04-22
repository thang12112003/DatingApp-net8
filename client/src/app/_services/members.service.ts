import { inject, Injectable, Signal, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Member } from '../_models/member';
import { environment } from '../../environments/environment.prod';
import { AccountService } from './account.service';
import { of, tap } from 'rxjs';
import { Photo } from '../_models/photo';
import { PaginatedResult } from '../_models/pagination';
import { UserParams } from '../_models/UserParams';
import { setPaginatedResponse, setPaginationHeader } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  private accountService = inject(AccountService);
  private http = inject(HttpClient);

  paginatedResult = signal<PaginatedResult<Member[]> | null>(null);
  memberCache = new Map();
  user = this.accountService.currentUser();
  userParams = signal<UserParams>(new UserParams(this.user));
  memberDetailCache = new Map<string, Member>();

  resetUserParams() {
    this.userParams.set(new UserParams(this.user));
  }

  getMembers() {
    const key = Object.values(this.userParams()).join('-');
    const response = this.memberCache.get(key);

    if (response) {
      return setPaginatedResponse(response, this.paginatedResult);
    }

    let params = setPaginationHeader(
      this.userParams().pageNumber,
      this.userParams().pageSize
    );

    params = params.append('minAge', this.userParams().minAge.toString());
    params = params.append('maxAge', this.userParams().maxAge.toString());
    params = params.append('gender', this.userParams().gender);
    params = params.append('orderBy', this.userParams().orderBy);

    if (this.userParams().searchTerm) {
      params = params.append('searchTerm', this.userParams().searchTerm);
    }

    return this.http.get<Member[]>(this.baseUrl + 'users', { observe: 'response', params }).subscribe({
      next: response => {
        setPaginatedResponse(response, this.paginatedResult);
        this.memberCache.set(key, response);
      },
      error: error => {
        console.error('Error fetching members:', error);
        this.paginatedResult.set(null); // reset if error
      }
    });
  }

  getMember(username: string) {
    const cachedMember = this.memberDetailCache.get(username);
    if (cachedMember) {
      console.log('Returning cached member detail:', cachedMember);
      return of(cachedMember);
    }

    return this.http.get<Member>(this.baseUrl + `users/${username}`).pipe(
      tap(member => {
        this.memberDetailCache.set(username, member);
      })
    );
  }

  updateMember(member: any) {
    return this.http.put(this.baseUrl + 'users/', member);
  }

  setMainPhoto(photo: Photo) {
    return this.http.put(this.baseUrl + 'users/set-main-photo/' + photo.id, {});
  }

  deletePhoto(photo: Photo) {
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photo.id);
  }
}
