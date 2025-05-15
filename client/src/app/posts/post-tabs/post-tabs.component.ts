import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Post } from '../../_models/post';

@Component({
  selector: 'app-post-tabs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './post-tabs.component.html',
  styleUrls: ['./post-tabs.component.css']
})
export class PostTabsComponent {
  @Input() posts: Post[] = [];
  @Input() currentUsername: string | null = null;
  @Input() openMenuPostId: number | null = null;
  @Output() toggleLike = new EventEmitter<Post>();
  @Output() openCommentModal = new EventEmitter<number>();
  @Output() togglePostMenu = new EventEmitter<number>();
  @Output() editPost = new EventEmitter<Post>();
  @Output() deletePost = new EventEmitter<number>();
  @Output() openLightbox = new EventEmitter<{ post: Post, index: number }>();

  isCurrentUser(username: string): boolean {
    return this.currentUsername === username;
  }
}
