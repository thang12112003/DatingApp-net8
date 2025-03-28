import { inject, Injectable, Signal, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import { Member } from '../_models/member';
import { environment } from '../../environments/environment';
import { AccountService } from './account.service';
import { of, tap } from 'rxjs';
import { Photo } from '../_models/photo';
import { PaginatedResult } from '../_models/panination';
import { UserParams } from '../_models/UserParams';
import { setPaginatedResponse, setPaginationHeader } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private accountService = inject(AccountService);
  private http = inject(HttpClient);
  // members = signal<Member[]>([]);
  paginatedResult = signal<PaginatedResult<Member[]> | null>(null);
  memberCache = new Map();
  user = this.accountService.currentUser();
  userParams = signal<UserParams>(new UserParams(this.user));
  memberDetailCache = new Map<string, Member>(); // Cache cho chi tiết user

  resetUserParams() {
    this.userParams.set(new UserParams(this.user));
  }

  getMembers() {
    const response = this.memberCache.get(Object.values(this.userParams()).join('-'));

    if(response) return setPaginatedResponse(response, this.paginatedResult);

    let params = setPaginationHeader(this.userParams().pageNumber, this.userParams().pageSize);
    params = params.append('minAge', this.userParams().minAge.toString());
    params = params.append('maxAge', this.userParams().maxAge.toString());
    params = params.append('gender', this.userParams().gender);
    params = params.append('orderBy', this.userParams().orderBy);

    return this.http.get<Member[]>('https://localhost:5001/api/users', { observe: 'response', params }).subscribe({
      next: response => {
        setPaginatedResponse(response , this.paginatedResult);
        this.memberCache.set(Object.values(this.userParams()).
          join('-'), response);
      },
      error: error => {
        console.error('Error fetching members:', error);
        this.paginatedResult.set(null); // Reset nếu có lỗi
      }
    });
  }


  getMember(username: string) {
    const cachedMember = this.memberDetailCache.get(username);
    if (cachedMember) {
      console.log('Returning cached member detail:', cachedMember);
      return of(cachedMember);
    }

    return this.http.get<Member>(`https://localhost:5001/api/users/${username}`).pipe(
      tap(member => {
        this.memberDetailCache.set(username, member);
      })
    );
  }

  updateMember(member: any) {
    return this.http.put('https://localhost:5001/api/users/', member).pipe(
      // tap(()=>{
      //   this.members.update(members => members.map(m => m.username === member.username
      //     ? member : m))
      // })
    );
  }
  setMainPhoto(photo: Photo) {
    return this.http.put('https://localhost:5001/api/users/set-main-photo/' + photo.id, {}).pipe(
      // tap(() => {
      //   this.members.update(members => members.map(m =>{
      //     if(m.photos.includes(photo)) {
      //       m.photoUrl = photo.url
      //     }
      //     return m;
      //   }))
      // })
    )
  }

  deletePhoto(photo: Photo) {
    return this.http.delete('https://localhost:5001/api/users/delete-photo/' + photo.id).pipe(
      // tap(() => {
      //   this.members.update(members => members.map(m => {
      //     if(m.photos.includes(photo)){
      //       m.photos = m.photos.filter(p => p.id !== photo.id)
      //     }
      //     return m;
      //   }))
      // })
    )
  }
}
