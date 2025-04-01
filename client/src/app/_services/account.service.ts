import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { User } from '../_models/user';
import { map, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  baseUrl = "https://localhost:5001/api/";
  private currentUserSource = new ReplaySubject<User>(1);
  currentUser = signal<User | null>(null);
  roles = computed(() => {
    const user = this.currentUser();
    if (user && user.token) {
      const role = JSON.parse(atob(user.token.split('.')[1])).role
      return Array.isArray(role) ? role : [role];
    }
    return [];
  })

  constructor() {
    this.loadCurrentUser(); // Load user khi service được khởi tạo
  }

  login(model:any){
    return this.http.post<User>(this.baseUrl + 'account/login', model).pipe(
      map( user => {
        if(user){
          localStorage.setItem('user' , JSON.stringify(user));
          this.currentUser.set(user);
        }
      })
    )
  }
    register(model: any) {
    return this.http.post<User>(this.baseUrl + 'account/register', model).pipe(
      map((user: User) => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSource.next(user);
          this.currentUser.set(user); // Update currentUser signal after registration
        }
      })
    )
  }

  setCurrentUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSource.next(user);
  }

  logout(){
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  loadCurrentUser() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user: User = JSON.parse(userJson);
      this.currentUser.set(user);
    }
  }
}
