import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { Post } from '../_models/post';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private baseUrl = environment.apiUrl;
  private likeUrl = `${this.baseUrl}postLikes`;
  private commentUrl = `${this.baseUrl}comments`;

  constructor(private http: HttpClient) {}

  private refreshPostsSource = new Subject<void>();
  refreshPosts$ = this.refreshPostsSource.asObservable();

  triggerRefreshPosts() {
    this.refreshPostsSource.next();
  }

  createPost(postData: FormData): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}posts`, postData);
  }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}posts`);
  }

  getMyPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}posts/my-posts`);
  }

  getUserPosts(username: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}posts/user/${username}`);
  }

  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.baseUrl}posts/${id}`);
  }

  updatePost(id: number, postData: FormData): Observable<Post> {
    return this.http.put<Post>(`${this.baseUrl}posts/${id}`, postData);
  }

  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}posts/${id}`);
  }

  toggleLike(postId: number): Observable<void> {
    return this.http.post<void>(`${this.likeUrl}/${postId}`, {});
  }

  getLikeCount(postId: number): Observable<number> {
    return this.http.get<number>(`${this.likeUrl}/${postId}/count`);
  }

  isLiked(postId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.likeUrl}/${postId}/is-liked`);
  }

  createComment(comment: { postId: number; content: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}comments`, comment);
  }

  getComments(postId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}comments/post/${postId}`);
  }

  updateComment(id: number, content: string): Observable<any> {
    return this.http.put(`${this.baseUrl}comments/${id}`, { content });
  }

  deleteComment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}comments/${id}`);
  }

  getCommentsCount(postId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}comments/${postId}/count`);
  }
}
