import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { PaginatedResult } from '../_models/pagination';
import { setPaginatedResponse, setPaginationHeader } from './paginationHelper';
import { Message } from '../_models/message';
import { environment } from '../../environments/environment.prod';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { User } from '../_models/user';
import { Group } from '../_models/group';
import { BusyService } from './busy.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  baseUrl = environment.apiUrl;
  hubUrl = environment.hubsUrl;
  private http = inject(HttpClient);
  private busyService = inject(BusyService);
  hubConnection?: HubConnection;
  paginatedResult = signal<PaginatedResult<Message[]> | null>(null);
  messageThread = signal<Message[]>([]);

  createHubConnection(user: User, otherUsername: string) {
    this.busyService.busy();
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'message?user=' + otherUsername, {
        accessTokenFactory: () => user.token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .catch(error => console.error('Error starting hub connection:', error))
      .finally(() => this.busyService.idle());

    this.hubConnection.on('ReceiveMessageThread', messages => {
      this.messageThread.set(messages);
    });

    this.hubConnection.on('NewMessage', message => {
      this.messageThread.update(messages => [...messages, message]);
    });

    this.hubConnection.on('UpdatedMessage', updatedMessage => {
      this.messageThread.update(messages =>
        messages.map(m => m.id === updatedMessage.id ? updatedMessage : m)
      );
    });

    this.hubConnection.on('DeletedMessage', messageId => {
      this.messageThread.update(messages => messages.filter(m => m.id !== messageId));
    });

    this.hubConnection.on('UpdatedGroup', (group: Group) => {
      if (group.connections.some(x => x.username === otherUsername)) {
        this.messageThread.update(messages => {
          messages.forEach(message => {
            if (!message.dateRead) {
              message.dateRead = new Date(Date.now());
            }
          });
          return [...messages];
        });
      }
    });
  }

  stopHubConnection() {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      this.hubConnection.stop().catch(error => console.error('Error stopping hub connection:', error));
    }
  }

  getMessages(pageNumber: number, pageSize: number, container: string) {
    let params = setPaginationHeader(pageNumber, pageSize);
    params = params.append('Container', container);

    this.http.get<Message[]>(this.baseUrl + 'messages', { observe: 'response', params })
      .subscribe({
        next: response => {
          const paginatedResult = setPaginatedResponse(response, this.paginatedResult);
          if (paginatedResult && paginatedResult.items) {
            const isOutbox = container === 'Outbox';
            const userMap = new Map<string, Message>();

            paginatedResult.items.forEach(message => {
              const userKey = isOutbox ? message.recipientUsername : message.senderUsername;
              if (!userMap.has(userKey) || new Date(message.messageSent) > new Date(userMap.get(userKey)!.messageSent)) {
                userMap.set(userKey, message);
              }
            });

            paginatedResult.items = Array.from(userMap.values());

            if (paginatedResult.pagination) {
              paginatedResult.pagination.totalItems = userMap.size;
              paginatedResult.pagination.totalPages = Math.ceil(userMap.size / paginatedResult.pagination.itemsPerPage);
            }
          }
        },
        error: error => console.error('Error fetching messages:', error)
      });
  }

  getMessageThread(username: string) {
    return this.http.get<Message[]>(this.baseUrl + 'messages/thread/' + username);
  }

  async sendMessage(username: string, content: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.warn('Hub connection not established, falling back to HTTP');
      return this.http.post(this.baseUrl + 'messages', { recipientUsername: username, content })
        .toPromise()
        .then(() => {})
        .catch(error => console.error('Error sending message via HTTP:', error));
    }

    try {
      await this.hubConnection.invoke('SendMessage', { recipientUsername: username, content });
    } catch (error) {
      console.error('Error sending message via SignalR:', error);
    }
  }

  async updateMessage(id: number, content: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('UpdateMessage', { content }, id);
      } catch (error) {
        console.error('Error updating message via SignalR:', error);
      }
    } else {
      return this.http.put(this.baseUrl + 'messages/' + id, { content })
        .toPromise()
        .then(() => {})
        .catch(error => console.error('Error updating message via HTTP:', error));
    }
  }

  async deleteMessage(id: number): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('DeleteMessage', id);
      } catch (error) {
        console.error('Error deleting message via SignalR:', error);
      }
    } else {
      return this.http.delete(this.baseUrl + 'messages/' + id)
        .toPromise()
        .then(() => {})
        .catch(error => console.error('Error deleting message via HTTP:', error));
    }
  }
}
