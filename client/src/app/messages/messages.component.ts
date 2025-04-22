import { Component, inject, OnInit } from '@angular/core';
import { MessageService } from '../_services/message.service';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { FormsModule } from '@angular/forms';
import { TimeagoModule } from 'ngx-timeago';
import { Message } from '../_models/message';
import { RouterLink } from '@angular/router';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [ButtonsModule, FormsModule, TimeagoModule, RouterLink, PaginationModule, CommonModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  messageService = inject(MessageService);
  container = 'Inbox';
  pageNumber = 1;
  pageSize = 5;

  get isOutbox() {
    return this.container === 'Outbox';
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages() {
    this.messageService.getMessages(this.pageNumber, this.pageSize, this.container);
  }

  // deleteMessage(id: number) {
  //   this.messageService.deleteMessage(id).subscribe({
  //     next: () => {
  //       this.messageService.paginatedResult.update(prev => {
  //         if (prev && prev.items) {
  //           prev.items = prev.items.filter(m => m.id !== id);
  //           if (prev.pagination) {
  //             prev.pagination.totalItems = prev.items.length;
  //             prev.pagination.totalPages = Math.ceil(prev.items.length / prev.pagination.itemsPerPage);
  //           }
  //           return prev;
  //         }
  //         return prev;
  //       });
  //     }
  //   });
  // }

  getRoute(message: Message) {
    if (this.isOutbox) return `/members/${message.recipientUsername}`;
    else return `/members/${message.senderUsername}`;
  }

  pageChanged(event: any) {
    if (this.pageNumber !== event.page) {
      this.pageNumber = event.page;
      this.loadMessages();
    }
  }
}
