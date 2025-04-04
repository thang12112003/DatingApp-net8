import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Member } from '../_models/member';
import { PaginatedResult } from '../_models/panination';
import { setPaginatedResponse, setPaginationHeader } from './paginationHelper';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class LikesService {
  baseUrl = environment.apiUrl;

  private http = inject(HttpClient);
  likeIds = signal<number[]>([]);
  paginatedResult = signal<PaginatedResult<Member[]> | null>(null);

  toogleLike(tartgetId: number) {
    return this.http.post(this.baseUrl +  `likes/${tartgetId}`, {});
  }

  getLikes(predicate: string , pageNumber: number, pageSize: number) {
    let params = setPaginationHeader(pageNumber, pageSize);

    params = params.append('predicate', predicate);

    return this.http.get<Member[]>(this.baseUrl +  `likes`,
      { observe: 'response', params }).subscribe({
        next: response => {
          setPaginatedResponse(response, this.paginatedResult);},
      });
  }

  getLikesIds() {
    return this.http.get<number[]>(this.baseUrl +  `likes/list`).subscribe( {
        next: (ids) => {
          console.log('Fetching likes list...');

          this.likeIds.set(ids);
        }
    });
  }
}
