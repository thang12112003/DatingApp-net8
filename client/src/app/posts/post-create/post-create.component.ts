import { Component, inject } from '@angular/core';
import { PostService } from '../../_services/post.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

declare const bootstrap: any;

@Component({
  selector: 'app-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class PostCreateComponent {
  postContent = '';
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  dragging = false;
  MAX_FILES = 10;


  private postService = inject(PostService);
  private toastr = inject(ToastrService);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const totalFiles = this.selectedFiles.length + files.length;

      if (totalFiles > this.MAX_FILES) {
        this.toastr.warning(`Bạn chỉ được chọn tối đa ${this.MAX_FILES} ảnh!`);
        return;
      }

      this.selectedFiles.push(...files);
      this.previewUrls.push(...files.map(file => URL.createObjectURL(file)));
    }
  }


  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      const totalFiles = this.selectedFiles.length + files.length;

      if (totalFiles > this.MAX_FILES) {
        this.toastr.warning(`Bạn chỉ được chọn tối đa ${this.MAX_FILES} ảnh!`);
        return;
      }

      this.selectedFiles.push(...files);
      this.previewUrls.push(...files.map(file => URL.createObjectURL(file)));
    }
  }


  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  resetForm() {
    this.postContent = '';
    this.selectedFiles = [];
    this.previewUrls = [];
  }

  createPost() {
    const formData = new FormData();
    formData.append('content', this.postContent);
    this.selectedFiles.forEach(file => formData.append('files', file));

    this.postService.createPost(formData).subscribe({
      next: () => {
        this.resetForm();
        const modal = bootstrap.Modal.getOrCreateInstance('#postModal');
        modal.hide();
        this.toastr.success('Đăng bài thành công!');
        this.postService.triggerRefreshPosts();
      },
      error: err => {
        console.error(err);
        this.toastr.error('Lỗi đăng bài!');
      }
    });
  }
}
