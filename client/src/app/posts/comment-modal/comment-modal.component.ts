import { Component, EventEmitter, Input, Output, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../_services/post.service';
import { Comment } from '../../_models/Comment';
import { AccountService } from '../../_services/account.service';

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-modal.component.html',
  styleUrls: ['./comment-modal.component.css']
})
export class CommentModalComponent implements OnInit, AfterViewInit {
  @Input() postId!: number;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() commentAdded = new EventEmitter<void>();

  private postService = inject(PostService);
  private accountService = inject(AccountService);

  content = '';
  errorMessage: string | null = null;
  comments: Comment[] = [];
  editingCommentId: number | null = null;
  editingContent = '';
  currentUsername: string | null = null;

  ngOnInit(): void {
    this.currentUsername = this.accountService.currentUser()?.username || null;
    if (this.isVisible) {
      this.loadComments();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToBottom(), 100);
  }

  scrollToBottom(): void {
    const scrollArea = document.querySelector('.comment-scroll-area');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }

  loadComments(): void {
    this.postService.getComments(this.postId).subscribe({
      next: res => {
        this.comments = res.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: err => {
        this.errorMessage = 'Không thể tải bình luận.';
        console.error('Không thể tải bình luận', err);
      }
    });
  }

  submitComment(): void {
    if (!this.content.trim()) {
      this.errorMessage = 'Nội dung không được để trống.';
      return;
    }

    this.postService.createComment({ postId: this.postId, content: this.content }).subscribe({
      next: () => {
        this.content = '';
        this.errorMessage = null;
        this.loadComments();
        this.commentAdded.emit();
      },
      error: err => {
        this.errorMessage = 'Không thể gửi bình luận.';
        console.error('Không thể gửi bình luận', err);
      }
    });
  }

  startEdit(comment: Comment): void {
    if (comment.username !== this.currentUsername) {
      this.errorMessage = 'Bạn chỉ có thể chỉnh sửa bình luận của mình.';
      return;
    }
    this.editingCommentId = comment.id;
    this.editingContent = comment.content;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editingContent = '';
  }

  saveEdit(commentId: number): void {
    if (!this.editingContent.trim()) {
      this.errorMessage = 'Nội dung không được để trống.';
      return;
    }

    this.postService.updateComment(commentId, this.editingContent).subscribe({
      next: () => {
        this.editingCommentId = null;
        this.editingContent = '';
        this.loadComments();
      },
      error: err => {
        this.errorMessage = 'Không thể cập nhật bình luận.';
        console.error('Lỗi khi cập nhật bình luận', err);
      }
    });
  }

  deleteComment(commentId: number): void {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment?.username !== this.currentUsername) {
      this.errorMessage = 'Bạn chỉ có thể xóa bình luận của mình.';
      return;
    }

    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    this.postService.deleteComment(commentId).subscribe({
      next: () => {
        this.loadComments();
        this.commentAdded.emit();
      },
      error: err => {
        this.errorMessage = 'Không thể xóa bình luận.';
        console.error('Lỗi khi xóa bình luận', err);
      }
    });
  }

  cancel(): void {
    this.close.emit();
  }
}
