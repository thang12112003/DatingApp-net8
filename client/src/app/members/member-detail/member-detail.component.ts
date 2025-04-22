import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MembersService } from '../../_services/members.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Member } from '../../_models/member';
import { TabDirective, TabsetComponent, TabsModule } from 'ngx-bootstrap/tabs';
import { GalleryItem, GalleryModule, ImageItem } from 'ng-gallery';
import { TimeagoModule } from 'ngx-timeago';
import { CommonModule, DatePipe } from '@angular/common';
import { MemberMessagesComponent } from "../member-messages/member-messages.component";
import { MessageService } from '../../_services/message.service';
import { PresenceService } from '../../_services/presence.service';
import { AccountService } from '../../_services/account.service';
import { LikesService } from '../../_services/likes.service';
import { HubConnectionState } from '@microsoft/signalr';
import { computed } from '@angular/core';

@Component({
  selector: 'app-member-detail',
  imports: [TabsModule, GalleryModule, TimeagoModule, DatePipe, MemberMessagesComponent, CommonModule],
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css'],
})
export class MemberDetailComponent implements OnInit, OnDestroy {
  @ViewChild('membertabs', { static: true }) membertabs?: TabsetComponent;
  private accountService = inject(AccountService);
  private likesService = inject(LikesService);
  private presenceService = inject(PresenceService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  member: Member = {} as Member;
  images: GalleryItem[] = [];
  activeTab?: TabDirective;
  hasLiked = computed(() => this.likesService.likeIds().includes(this.member.id));
  isOnline = computed(() => this.presenceService.onlineUsers().includes(this.member.username));

  ngOnInit(): void {
    this.route.data.subscribe({
      next: data => {
        this.member = data['member'];
        this.member && this.member.photos.map(p => {
          this.images.push(new ImageItem({ src: p.url, thumb: p.url }));
        });
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
      const messageTab = this.membertabs.tabs.find(x => x.heading === heading);
      if (messageTab) {
        messageTab.active = true;
      } else {
        console.log('Không tìm thấy tab với heading:', heading);
      }
    } else {
      console.log('membertabs chưa được khởi tạo');
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

  ngOnDestroy(): void {
    this.messageService.stopHubConnection();
  }
}
