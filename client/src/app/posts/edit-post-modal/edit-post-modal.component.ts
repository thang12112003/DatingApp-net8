import { Component, EventEmitter, Input, Output } from '@angular/core';
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

  constructor(private postService: PostService) {}

  ngOnChanges(): void {
    if (this.post && this.isVisible) {
      this.content = this.post.content;
      this.newFiles = [];
      this.previewUrls = [];
      this.deletePhotoPublicIds = [];
      this.errorMessage = null;
    }
  }


  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      const currentPhotosCount = this.post?.photos?.length || 0;
      const photosAfterDelete = currentPhotosCount - this.deletePhotoPublicIds.length;

      if (photosAfterDelete + newFiles.length > this.maxPhotosPerPost) {
        this.errorMessage = `Tổng số ảnh không được vượt quá ${this.maxPhotosPerPost}.`;
        input.value = '';
        return;
      }

      this.newFiles = newFiles;
      this.previewUrls = newFiles.map(file => URL.createObjectURL(file));
      this.errorMessage = null;
    }
  }


  toggleDeletePhoto(publicId: string): void {
    const index = this.deletePhotoPublicIds.indexOf(publicId);
    if (index > -1) {
      this.deletePhotoPublicIds.splice(index, 1);
    } else {
      this.deletePhotoPublicIds.push(publicId);
    }
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
      this.close.emit();
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
    }
  }
  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  cancel(): void {
    this.close.emit();
  }
}
