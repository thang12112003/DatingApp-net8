import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MembersService } from '../../_services/members.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Member } from '../../_models/member';
import { TabDirective, TabsetComponent, TabsModule } from 'ngx-bootstrap/tabs';
import { GalleryItem, GalleryModule, ImageItem } from 'ng-gallery';
import { TimeagoModule } from 'ngx-timeago';
import { CommonModule, DatePipe } from '@angular/common';
import { MemberMessagesComponent } from '../member-messages/member-messages.component';
import { MessageService } from '../../_services/message.service';
import { PresenceService } from '../../_services/presence.service';
import { AccountService } from '../../_services/account.service';
import { LikesService } from '../../_services/likes.service';
import { HubConnectionState } from '@microsoft/signalr';
import { computed } from '@angular/core';
import { PostService } from '../../_services/post.service';
import { Post } from '../../_models/post';
import { Lightbox, LightboxConfig, LightboxModule } from 'ngx-lightbox';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ConfirmDialogComponent } from '../../modals/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';
import { BusyService } from '../../_services/busy.service';
import { PostTabsComponent } from '../../posts/post-tabs/post-tabs.component';
import { EditPostModalComponent } from '../../posts/edit-post-modal/edit-post-modal.component';
import { CommentModalComponent } from '../../posts/comment-modal/comment-modal.component';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [
    TabsModule,
    GalleryModule,
    TimeagoModule,
    DatePipe,
    MemberMessagesComponent,
    CommonModule,
    PostTabsComponent,
    LightboxModule,
    EditPostModalComponent,
    CommentModalComponent
  ],
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css']
})
export class MemberDetailComponent implements OnInit, OnDestroy {
  @ViewChild('membertabs', { static: true }) membertabs?: TabsetComponent;
  private accountService = inject(AccountService);
  private likesService = inject(LikesService);
  private presenceService = inject(PresenceService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);
  private lightbox = inject(Lightbox);
  private modalService = inject(BsModalService);
  private busyService = inject(BusyService);
  member: Member = {} as Member;
  images: GalleryItem[] = [];
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
  activeTab?: TabDirective;
  hasLiked = computed(() => this.likesService.likeIds().includes(this.member.id));
  isOnline = computed(() => this.presenceService.onlineUsers().includes(this.member.username));

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
    this.route.data.subscribe({
      next: data => {
        this.member = data['member'];
        this.member && this.member.photos.map(p => {
          this.images.push(new ImageItem({ src: p.url, thumb: p.url }));
        });
        this.loadUserPosts();
      }
    });

    this.route.paramMap.subscribe({
      next: _ => this.onRouteParamsChange()
    });

    this.route.queryParams.subscribe({
      next: params => {
        params['tab'] && this.selectTab(params['tab']);
      }
    });

    this.postService.refreshPosts$.subscribe(() => {
      this.loadUserPosts();
    });
  }

  loadUserPosts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.postService.getUserPosts(this.member.username).subscribe({
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

  toggleLike() {
    this.likesService.toogleLike(this.member.id).subscribe({
      next: _ => {
        if (this.hasLiked()) {
          this.likesService.likeIds.update(ids => ids.filter(x => x !== this.member.id));
        } else {
          this.likesService.likeIds.update(ids => [...ids, this.member.id]);
        }
      }
    });
  }

  selectTab(heading: string) {
    if (this.membertabs) {
      const tab = this.membertabs.tabs.find(x => x.heading === heading);
      if (tab) {
        tab.active = true;
      } else {
        console.log('Tab not found with heading:', heading);
      }
    } else {
      console.log('membertabs not initialized');
    }
  }

  onRouteParamsChange() {
    const user = this.accountService.currentUser();
    if (!user) return;
    if (this.messageService.hubConnection?.state === HubConnectionState.Connected && this.activeTab?.heading === 'Messages') {
      this.messageService.hubConnection.stop().then(() => {
        this.messageService.createHubConnection(user, this.member.username);
      });
    }
  }

  onTabActivated(data: TabDirective) {
    this.activeTab = data;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.activeTab.heading },
      queryParamsHandling: 'merge'
    });
    if (this.activeTab.heading === 'Messages' && this.member) {
      const user = this.accountService.currentUser();
      if (!user) return;
      this.messageService.createHubConnection(user, this.member.username);
    } else {
      this.messageService.stopHubConnection();
    }
  }

  togglePostLike(post: Post): void {
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

  ngOnDestroy(): void {
    this.messageService.stopHubConnection();
  }
}
