import { inject, Injectable, signal } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Member } from '../_models/member';
import { environment } from '../../environments/environment';
import { AccountService } from './account.service';
import { of, tap } from 'rxjs';
import { Photo } from '../_models/photo';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  private accountService = inject(AccountService);
  private http = inject(HttpClient);
  members = signal<Member[]>([]);

  getMembers() {
    return this.http.get<Member[]>('https://localhost:5001/api/users').subscribe({
      next: members => this.members.set(members)
    });
  }

  getMember(username: string) {
    const member = this.members().find(x => x.username === username)
    if(member !== undefined) return of(member);
    return this.http.get<Member>('https://localhost:5001/api/users/' + username);
  }

  updateMember(member: any) {
    return this.http.put('https://localhost:5001/api/users/', member).pipe(
      tap(()=>{
        this.members.update(members => members.map(m => m.username === member.username
          ? member : m))
      })
    );
  }
  setMainPhoto(photo: Photo) {
    return this.http.put('https://localhost:5001/api/users/set-main-photo/' + photo.id, {}).pipe(
      tap(() => {
        this.members.update(members => members.map(m =>{
          if(m.photos.includes(photo)) {
            m.photoUrl = photo.url
          }
          return m;
        }))
      })
    )
  }

  deletePhoto(photo: Photo) {
    return this.http.delete('https://localhost:5001/api/users/delete-photo/' + photo.id).pipe(
      tap(() => {
        this.members.update(members => members.map(m => {
          if(m.photos.includes(photo)){
            m.photos = m.photos.filter(p => p.id !== photo.id)
          }
          return m;
        }))
      })
    )
  }
}
