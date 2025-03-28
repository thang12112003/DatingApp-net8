import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Member } from '../_models/member';
import { PaginatedResult } from '../_models/panination';
import { setPaginatedResponse, setPaginationHeader } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class LikesService {

  private http = inject(HttpClient);
  likeIds = signal<number[]>([]);
  paginatedResult = signal<PaginatedResult<Member[]> | null>(null);

  toogleLike(tartgetId: number) {
    return this.http.post(`https://localhost:5001/api/likes/${tartgetId}`, {});
  }

  getLikes(predicate: string , pageNumber: number, pageSize: number) {
    let params = setPaginationHeader(pageNumber, pageSize);

    params = params.append('predicate', predicate);

    return this.http.get<Member[]>(`https://localhost:5001/api/likes`,
      { observe: 'response', params }).subscribe({
        next: response => {
          setPaginatedResponse(response, this.paginatedResult);},
      });
  }

  getLikesIds() {
    return this.http.get<number[]>(`https://localhost:5001/api/likes/list`).subscribe( {
        next: (ids) => {
          console.log('Fetching likes list...');

          this.likeIds.set(ids);
        }
    });
  }
}
