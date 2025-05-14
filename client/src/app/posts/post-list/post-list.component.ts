import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../_services/post.service';
import { Post } from '../../_models/post';
import { Lightbox, LightboxConfig, LightboxModule } from 'ngx-lightbox';
import { AccountService } from '../../_services/account.service';
import { EditPostModalComponent } from '../edit-post-modal/edit-post-modal.component';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmDialogComponent } from '../../modals/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';
import { BusyService } from '../../_services/busy.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, LightboxModule, EditPostModalComponent, CommentModalComponent],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  posts: Post[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  currentUsername: string | null = null;
  openMenuPostId: number | null = null;
  selectedPost: Post | null = null;
  showEditModal = false;
  showCommentModal = false;
  selectedPostId: number | null = null;
  modalRef?: BsModalRef;

  private postService = inject(PostService);
  private lightbox = inject(Lightbox);
  private accountService = inject(AccountService);
  private modalService = inject(BsModalService);
  private busyService = inject(BusyService);

  constructor() {
    const lightboxConfig = inject(LightboxConfig);
    lightboxConfig.fadeDuration = 0.7;
    lightboxConfig.resizeDuration = 0.5;
    lightboxConfig.wrapAround = true;
    lightboxConfig.showImageNumberLabel = true;
    lightboxConfig.albumLabel = 'Image %1 of %2';
    lightboxConfig.centerVertically = true;
    lightboxConfig.disableScrolling = true;
    lightboxConfig.showZoom = true;
    lightboxConfig.showRotate = false;
  }

  ngOnInit(): void {
    this.currentUsername = this.accountService.currentUser()?.username || null;
    this.loadPosts();
    this.postService.refreshPosts$.subscribe(() => {
      this.loadPosts();
    });
  }

  loadPosts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.postService.getPosts().subscribe({
      next: posts => {
        this.posts = posts;
        this.fetchPostData();
      },
      error: err => {
        this.errorMessage = 'Không thể tải bài viết. Vui lòng thử lại sau.';
        console.error('Failed to load posts:', err);
        this.isLoading = false;
      }
    });
  }

  private fetchPostData(): void {
    if (this.posts.length === 0) {
      this.isLoading = false;
      return;
    }

    const requests = this.posts.map(post =>
      forkJoin({
        likeCount: this.postService.getLikeCount(post.id),
        isLiked: this.postService.isLiked(post.id),
        commentCount: this.postService.getCommentsCount(post.id)
      })
    );

    forkJoin(requests).subscribe({
      next: results => {
        results.forEach((result, index) => {
          this.posts[index].likeCount = result.likeCount;
          this.posts[index].isLiked = result.isLiked;
          this.posts[index].commentCount = result.commentCount;
        });
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = 'Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.';
        console.error('Failed to load post data:', err);
        this.isLoading = false;
      }
    });
  }

  toggleLike(post: Post): void {
    this.postService.toggleLike(post.id).subscribe({
      next: () => {
        post.isLiked = !post.isLiked;
        post.likeCount = post.isLiked
          ? (post.likeCount || 0) + 1
          : (post.likeCount || 0) - 1;
      },
      error: err => {
        this.errorMessage = 'Không thể thực hiện thao tác thích. Vui lòng thử lại.';
        console.error('Toggle like error:', err);
      }
    });
  }

  openCommentModal(postId: number): void {
    this.selectedPostId = postId;
    this.showCommentModal = true;
  }

  closeCommentModal(): void {
    this.showCommentModal = false;
    this.selectedPostId = null;
  }

  handleCommentAdded(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.postService.getCommentsCount(postId).subscribe({
        next: count => {
          post.commentCount = count;
        },
        error: err => {
          console.error('Failed to update comment count:', err);
          this.errorMessage = 'Không thể cập nhật số lượng bình luận.';
        }
      });
    }
  }

  togglePostMenu(postId: number): void {
    this.openMenuPostId = this.openMenuPostId === postId ? null : postId;
  }

  isCurrentUser(username: string): boolean {
    return this.currentUsername === username;
  }

  editPost(post: Post): void {
    this.selectedPost = { ...post };
    this.showEditModal = true;
    this.openMenuPostId = null;
  }

  handlePostUpdated(updatedPost: Post): void {
    const index = this.posts.findIndex(p => p.id === updatedPost.id);
    if (index !== -1) {
      this.posts[index] = {
        ...updatedPost,
        likeCount: this.posts[index].likeCount,
        isLiked: this.posts[index].isLiked,
        commentCount: this.posts[index].commentCount
      };
    }
    this.closeEditModal();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedPost = null;
  }

  deletePost(postId: number): void {
    const initialState = {
      title: 'Xác nhận xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      btnOkText: 'Xóa',
      btnCancelText: 'Hủy'
    };
    this.modalRef = this.modalService.show(ConfirmDialogComponent, { initialState });

    this.modalRef.content.onClose.subscribe((result: boolean) => {
      if (result) {
        this.performDelete(postId);
      }
    });
  }

  private async performDelete(postId: number): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      await this.postService.deletePost(postId).toPromise();
      this.posts = this.posts.filter(p => p.id !== postId);
      console.log(`Deleted post ${postId}`);
    } catch (err: any) {
      if (err.status === 404) {
        this.errorMessage = 'Bài viết không tồn tại hoặc đã bị xóa.';
      } else if (err.status === 403) {
        this.errorMessage = 'Bạn không có quyền xóa bài viết này.';
      } else {
        this.errorMessage = err.error?.message || 'Xóa bài viết thất bại.';
      }
      console.error('Delete post error:', err);
    } finally {
      this.isLoading = false;
      this.openMenuPostId = null;
    }
  }

  openLightbox(post: Post, index: number = 0): void {
    if (!post.photos || post.photos.length === 0) {
      console.warn(`No photos available for post ${post.id}`);
      this.errorMessage = 'Không có ảnh để hiển thị.';
      return;
    }

    const album = post.photos
      .filter(p => p.url && typeof p.url === 'string' && p.url.trim() !== '')
      .map((p, i) => ({
        src: p.url,
        thumb: p.url,
        caption: `Ảnh ${i + 1} của bài viết ${post.id}`
      }));

    if (album.length === 0) {
      console.warn(`No valid photos for post ${post.id}`);
      this.errorMessage = 'Không có ảnh hợp lệ để hiển thị.';
      return;
    }

    console.log(`Opening Lightbox for post ${post.id} with ${album.length} photos, starting at index ${index}`, album);

    if (index >= album.length) {
      console.warn(`Invalid index ${index} for album with ${album.length} photos`);
      index = 0;
    }

    try {
      this.lightbox.open(album, index);
    } catch (err) {
      console.error('Failed to open Lightbox:', err);
      this.errorMessage = 'Không thể mở thư viện ảnh.';
    }
  }
}
