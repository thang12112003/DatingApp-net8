import { AfterViewInit, Component, ViewChild, inject, input, effect, ChangeDetectorRef } from '@angular/core';
import { MessageService } from '../../_services/message.service';
import { TimeagoModule } from 'ngx-timeago';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../_services/account.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmDialogComponent } from '../../modals/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-member-messages',
  standalone: true,
  imports: [TimeagoModule, FormsModule, CommonModule],
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css']
})
export class MemberMessagesComponent implements AfterViewInit {
  @ViewChild('messageForm') messageForm?: NgForm;
  @ViewChild('scrollMe') scrollContainer?: any;
  messageService = inject(MessageService);
  accountService = inject(AccountService);
  modalService = inject(BsModalService);
  cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef
  username = input.required<string>();
  currentUsername: string;
  messageContent = '';
  loading = false;
  editingMessageId: number | null = null;
  editContent = '';
  showMenuId: number | null = null;
  openMenuId: number | null = null;
  hasScrolled = false;

  constructor() {
    this.currentUsername = this.accountService.currentUser()?.username || '';

    // Theo dõi thay đổi trong messageThread (nếu dùng Signals)
    effect(() => {
      const messages = this.messageService.messageThread();
      if (messages.length > 0) {
        this.scrollToBottom();
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  sendMessage() {
    this.loading = true;
    this.messageService.sendMessage(this.username(), this.messageContent).then(() => {
      this.messageForm?.reset();
      this.scrollToBottom(); // Cuộn xuống sau khi gửi
    }).finally(() => {
      this.loading = false;
    });
  }

  showMenu(messageId: number, senderUsername: string) {
    if (senderUsername === this.currentUsername) {
      this.showMenuId = messageId;
    }
  }

  hideMenu() {
    this.showMenuId = null;
    this.openMenuId = null;
  }

  toggleMenu(messageId: number) {
    this.openMenuId = this.openMenuId === messageId ? null : messageId;
  }

  editMessage(message: any) {
    this.editingMessageId = message.id;
    this.editContent = message.content;
    this.openMenuId = null;
  }

  saveEdit(messageId: number) {
    if (this.editContent.trim()) {
      this.messageService.updateMessage(messageId, this.editContent).then(() => {
        this.editingMessageId = null;
        this.editContent = '';
        this.scrollToBottom(); // Cuộn xuống sau khi chỉnh sửa
      });
    }
  }

  cancelEdit() {
    this.editingMessageId = null;
    this.editContent = '';
  }

  deleteMessage(messageId: number) {
    const modalRef: BsModalRef = this.modalService.show(ConfirmDialogComponent, {
      initialState: {
        title: 'Xác nhận xóa',
        message: 'Bạn có chắc muốn xóa tin nhắn này?',
        btnOkText: 'Xóa',
        btnCancelText: 'Hủy'
      }
    });

    modalRef.content!.onClose.subscribe((result: boolean) => {
      if (result) {
        this.messageService.deleteMessage(messageId).then(() => {
          this.openMenuId = null;
          this.scrollToBottom(); // Cuộn xuống sau khi xóa
        });
      }
    });
  }

  private scrollToBottom() {
    if (this.scrollContainer) {
      setTimeout(() => {
        try {
          this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
          this.cdr.detectChanges(); // Đảm bảo DOM đã cập nhật
        } catch (err) {
          console.error('scrollToBottom error:', err);
        }
      }, 0); // Delay nhỏ để đảm bảo DOM render xong
    }
  }
}
