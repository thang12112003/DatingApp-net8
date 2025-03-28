import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MembersService } from '../../_services/members.service';
import { ActivatedRoute } from '@angular/router';
import { Member } from '../../_models/member';
import { TabDirective, TabsetComponent, TabsModule } from 'ngx-bootstrap/tabs';
import { GalleryItem, GalleryModule, ImageItem } from 'ng-gallery';
import { TimeagoModule } from 'ngx-timeago';
import { DatePipe } from '@angular/common';
import { MemberMessagesComponent } from "../member-messages/member-messages.component";
import { Message } from '../../_models/message';
import { MessageService } from '../../_services/message.service';

@Component({
  selector: 'app-member-detail',
  imports: [TabsModule, GalleryModule, TimeagoModule, DatePipe, MemberMessagesComponent],
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css'],
})
export class MemberDetailComponent implements OnInit {
  @ViewChild('membertabs', {static: true}) membertabs?: TabsetComponent;
  private memberService = inject(MembersService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  member: Member = {} as Member;
  images: GalleryItem[] = [];
  activeTab?: TabDirective;
  messages: Message[] = [];

  ngOnInit(): void {
    this.route.data.subscribe({
      next: data => {
        this.member = data['member'];
        this.member && this.member.photos.map(p =>{
          this.images.push(new ImageItem({src: p.url, thumb: p.url}))
        })
      }
    })

    this.route.queryParams.subscribe({
      next: params => {
        params['tab'] && this.selectTab(params['tab'])
      }
    })
  }

  onUpdateMessages(event: Message) {
    this.messages.push(event);
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

  ontabActivated(data: TabDirective) {
    this.activeTab = data;
    if (this.activeTab.heading === 'Messages' && this.messages.length === 0 && this.member) {
      this.messageService.getMessageThread(this.member.username).subscribe({
        next: messages => this.messages = messages
      });
    }
  }

  // loadMember(): void {
  //   const username = this.route.snapshot.paramMap.get('username');
  //   if (!username) {
  //     console.error('No username provided in route');
  //     return;
  //   }

  //   this.memberService.getMember(username).subscribe({
  //     next: (member) => {
  //       this.member = member;
  //       this.loadImages(member);
  //     },
  //     error: (err) => {
  //       console.error('Error loading member:', err);
  //     }
  //   });
  // }

  // private loadImages(member: Member): void {
  //   this.images = member.photos.map(photo =>
  //     new ImageItem({ src: photo.url, thumb: photo.url })
  //   );
  // }
}
