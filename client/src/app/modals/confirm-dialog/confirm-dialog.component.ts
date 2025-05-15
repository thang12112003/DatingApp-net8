import { Component, inject, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  bsModalRef = inject(BsModalRef);
  title = '';
  message = '';
  btnOkText = '';
  btnCancelText = '';
  onClose = new Subject<boolean>(); // Thêm Subject để phát tín hiệu

  confirm() {
    this.onClose.next(true); // Phát tín hiệu xác nhận
    this.bsModalRef.hide();
  }

  decline() {
    this.onClose.next(false); // Phát tín hiệu hủy
    this.bsModalRef.hide();
  }
}
