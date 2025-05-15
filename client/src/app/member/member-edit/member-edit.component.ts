import { Component, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { Member } from '../../_models/member';
import { AccountService } from '../../_services/account.service';
import { MembersService } from '../../_services/members.service';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TimeagoModule } from 'ngx-timeago';
import { CommonModule, DatePipe } from '@angular/common';
import { Post } from '../../_models/post';
import { PostService } from '../../_services/post.service';
import { Lightbox, LightboxConfig, LightboxModule } from 'ngx-lightbox';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ConfirmDialogComponent } from '../../modals/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';
import { BusyService } from '../../_services/busy.service';
import { PhotoEditorComponent } from '../../members/photo-editor/photo-editor.component';
import { PostTabsComponent } from '../../posts/post-tabs/post-tabs.component';
import { EditPostModalComponent } from '../../posts/edit-post-modal/edit-post-modal.component';
import { CommentModalComponent } from '../../posts/comment-modal/comment-modal.component';

@Component({
  selector: 'app-member-edit',
  standalone: true,
  imports: [
    TabsModule,
    FormsModule,
    PhotoEditorComponent,
    TimeagoModule,
    DatePipe,
    PostTabsComponent,
    LightboxModule,
    EditPostModalComponent,
    CommentModalComponent,
    CommonModule
  ],
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.css']
})
export class MemberEditComponent implements OnInit {
  @ViewChild('editForm') editForm?: NgForm;
  @HostListener('window:beforeunload', ['$event']) unloadNotification($event: any) {
    if (this.editForm?.dirty) {
      $event.returnValue = true;
    }
  }
  member?: Member;
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

  private accountService = inject(AccountService);
  private memberService = inject(MembersService);
  private toastr = inject(ToastrService);
  private postService = inject(PostService);
  private lightbox = inject(Lightbox);
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
    this.loadMembers();
    this.loadMyPosts();
    this.postService.refreshPosts$.subscribe(() => {
      this.loadMyPosts();
    });
  }

  loadMembers() {
    const user = this.accountService.currentUser();
    if (!user) return;
    this.memberService.getMember(user.username).subscribe({
      next: member => this.member = member
    });
  }

  loadMyPosts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.postService.getMyPosts().subscribe({
      next: posts => {
        this.posts = posts;
        this.fetchPostData();
      },
      error: err => {
        this.errorMessage = 'Failed to load posts. Please try again later.';
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
        this.errorMessage = 'Failed to load post data. Please try again later.';
        console.error('Failed to load post data:', err);
        this.isLoading = false;
      }
    });
  }

  updateMember() {
    if (!this.editForm?.value) return;
    this.memberService.updateMember(this.editForm.value).subscribe({
      next: _ => {
        this.toastr.success('Profile updated successfully');
        this.editForm?.reset(this.member);
      },
      error: err => {
        this.toastr.error('Update failed');
        console.error(err);
      }
    });
  }

  onMemberChange(event: Member) {
    this.member = event;
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
        this.errorMessage = 'Failed to perform like action. Please try again.';
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
          this.errorMessage = 'Failed to update comment count.';
        }
      });
    }
  }

  togglePostMenu(postId: number): void {
    this.openMenuPostId = this.openMenuPostId === postId ? null : postId;
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
      title: 'Confirm Delete Post',
      message: 'Are you sure you want to delete this post?',
      btnOkText: 'Delete',
      btnCancelText: 'Cancel'
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
        this.errorMessage = 'Post does not exist or has already been deleted.';
      } else if (err.status === 403) {
        this.errorMessage = 'You do not have permission to delete this post.';
      } else {
        this.errorMessage = err.error?.message || 'Failed to delete post.';
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
      this.errorMessage = 'No images to display.';
      return;
    }

    const album = post.photos
      .filter(p => p.url && typeof p.url === 'string' && p.url.trim() !== '')
      .map((p, i) => ({
        src: p.url,
        thumb: p.url,
        caption: `Image ${i + 1} of post ${post.id}`
      }));

    if (album.length === 0) {
      console.warn(`No valid photos for post ${post.id}`);
      this.errorMessage = 'No valid images to display.';
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
      this.errorMessage = 'Failed to open image gallery.';
    }
  }
}
