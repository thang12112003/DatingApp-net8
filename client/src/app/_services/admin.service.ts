import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { User } from '../_models/user';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getUserWithRoles(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl + 'admin/users-with-roles');
  }

  updateUserRoles(username: string, roles: string[]): Observable<string[]> {
    return this.http.post<string[]>(this.baseUrl + 'admin/edit-roles/' + username + '?roles=' + roles, {});
  }

  lockUser(username: string): Observable<string> {
    return this.http.post(this.baseUrl + 'admin/lock-user/' + username, {}, { responseType: 'text' }).pipe(
      map(response => response as string)
    );
  }

  unlockUser(username: string): Observable<string> {
    return this.http.post(this.baseUrl + 'admin/unlock-user/' + username, {}, { responseType: 'text' }).pipe(
      map(response => response as string)
    );
  }
}
