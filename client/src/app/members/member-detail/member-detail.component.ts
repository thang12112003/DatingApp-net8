import { Component, inject, OnInit } from '@angular/core';
import { MembersService } from '../../_services/members.service';
import { ActivatedRoute } from '@angular/router';
import { Member } from '../../_models/member';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { GalleryItem, GalleryModule, ImageItem } from 'ng-gallery';
import { TimeagoModule } from 'ngx-timeago';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-member-detail',
  standalone: true, // Nếu bạn dùng standalone components (Angular 14+), nếu không thì bỏ dòng này
  imports: [TabsModule, GalleryModule, TimeagoModule, DatePipe],
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css'], // Sửa styleUrl thành styleUrls (dạng mảng)
})
export class MemberDetailComponent implements OnInit {
  private memberService = inject(MembersService); // Sửa typo: memberSevice -> memberService
  private route = inject(ActivatedRoute);
  member: Member | undefined; // Giữ kiểu là Member | undefined để tránh lỗi
  images: GalleryItem[] = [];

  ngOnInit(): void {
    this.loadMember();
  }

  loadMember(): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) {
      console.error('No username provided in route');
      return;
    }

    this.memberService.getMember(username).subscribe({
      next: (member) => {
        this.member = member;
        this.loadImages(member);
      },
      error: (err) => {
        console.error('Error loading member:', err);
        // Có thể thêm logic để hiển thị thông báo lỗi cho người dùng
      }
    });
  }

  private loadImages(member: Member): void {
    this.images = member.photos.map(photo =>
      new ImageItem({ src: photo.url, thumb: photo.url })
    );
  }
}
