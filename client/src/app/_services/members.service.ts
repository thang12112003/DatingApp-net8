import { inject, Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Member } from '../_models/member';
import { environment } from '../../environments/environment';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  private accountService = inject(AccountService);
  private http = inject(HttpClient);

  getMembers() {
    return this.http.get<Member[]>('https://localhost:5001/api/users');
  }

  getMember(username: string) {
    return this.http.get<Member>('https://localhost:5001/api/users/' + username);
  }

}
