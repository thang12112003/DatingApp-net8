import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../_services/post.service';
import { Post } from '../../_models/post';

@Component({
  selector: 'app-edit-post-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-post-modal.component.html',
  styleUrls: ['./edit-post-modal.component.css']
})
export class EditPostModalComponent {
  @Input() post: Post | null = null;
  @Input() isVisible: boolean = false;
  @Output() postUpdated = new EventEmitter<Post>();
  @Output() close = new EventEmitter<void>();

  previewUrls: string[] = [];
  content: string = '';
  newFiles: File[] = [];
  deletePhotoPublicIds: string[] = [];
  maxPhotosPerPost = 5;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(private postService: PostService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    if (this.post && this.isVisible) {
      this.content = this.post.content;
      this.newFiles = [];
      this.previewUrls = this.post.photos?.map(p => p.url) || [];
      this.deletePhotoPublicIds = [];
      this.errorMessage = null;
      this.cdr.detectChanges();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      const currentPhotosCount = this.post?.photos?.length || 0;
      const photosAfterDelete = currentPhotosCount - this.deletePhotoPublicIds.length;

      if (photosAfterDelete + newFiles.length > this.maxPhotosPerPost) {
        this.errorMessage = `Total number of photos cannot exceed ${this.maxPhotosPerPost}.`;
        input.value = '';
        return;
      }

      this.newFiles = newFiles;
      this.previewUrls = [
        ...(this.post?.photos?.filter(p => !this.deletePhotoPublicIds.includes(p.publicId)).map(p => p.url) || []),
        ...newFiles.map(file => URL.createObjectURL(file))
      ];
      this.errorMessage = null;
      this.cdr.detectChanges();
    }
  }

  toggleDeletePhoto(publicId: string): void {
    const index = this.deletePhotoPublicIds.indexOf(publicId);
    if (index > -1) {
      this.deletePhotoPublicIds.splice(index, 1);
    } else {
      this.deletePhotoPublicIds.push(publicId);
    }
    // Cập nhật previewUrls để phản ánh ảnh bị đánh dấu xóa
    this.previewUrls = [
        ...(this.post?.photos?.filter(p => !this.deletePhotoPublicIds.includes(p.publicId)).map(p => p.url) || []),
        ...this.newFiles.map(file => URL.createObjectURL(file))
    ];
    this.cdr.detectChanges();
  }

  async saveChanges(): Promise<void> {
    if (!this.post) return;

    console.log('Updating post with ID:', this.post.id);
    this.isLoading = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('content', this.content);

    if (this.newFiles.length > 0) {
      for (const file of this.newFiles) {
        formData.append('newFiles', file);
      }
    }

    if (this.deletePhotoPublicIds.length > 0) {
      formData.append('deletePhotoPublicIds', this.deletePhotoPublicIds.join(','));
    }

    console.log('FormData:', {
      content: this.content,
      newFiles: this.newFiles.map(f => f.name),
      deletePhotoPublicIds: this.deletePhotoPublicIds
    });

    try {
      const response = await this.postService.updatePost(this.post.id, formData).toPromise();
      this.postUpdated.emit(response);
      this.closeModal();
    } catch (err: any) {
      if (err.status === 404) {
        this.errorMessage = 'Post not found. It may have been deleted.';
      } else if (err.status === 403) {
        this.errorMessage = 'You are not authorized to edit this post.';
      } else {
        this.errorMessage = err.error?.message || 'Failed to update post.';
      }
      console.error('Update post error:', err);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeModal(): void {
    this.close.emit();
    // Thu hồi các URL blob để tránh rò rỉ bộ nhớ
    this.previewUrls
      .filter(url => url.startsWith('blob:'))
      .forEach(url => URL.revokeObjectURL(url));
    this.previewUrls = [];
    this.newFiles = [];
    this.deletePhotoPublicIds = [];
    this.content = '';
    this.errorMessage = null;
    this.isLoading = false;
  }

  trackByFn(index: number, item: string): number {
    return index;
  }
}
