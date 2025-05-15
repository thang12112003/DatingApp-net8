import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LikesService } from '../_services/likes.service';
import { Member } from '../_models/member';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { FormsModule } from '@angular/forms';
import { MemberCardComponent } from "../members/member-card/member-card.component";
import { PaginationModule } from 'ngx-bootstrap/pagination';

@Component({
  selector: 'app-lists',
  imports: [ButtonsModule, FormsModule, MemberCardComponent, PaginationModule],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.css'
})
export class ListsComponent  implements OnInit , OnDestroy{


  likesService = inject(LikesService);
  predicate = 'liked';
  pageNumer = 1;
  pageSize = 5;

  ngOnInit(): void {
    this.loadLikes();
  }

  getTile() {
    switch (this.predicate) {
      case 'liked': return 'Members you like';
      case 'likedBy': return 'Members who like you';
      default: return '';
    }
  }

  loadLikes() {
    this.likesService.getLikes(this.predicate , this.pageNumer, this.pageSize);
  }

  pageChanged(event: any) {
    if(this.pageNumer !== event.page) {
      this.pageNumer = event.page;
      this.loadLikes();
    }
  }

  ngOnDestroy(): void {
    this.likesService.paginatedResult.set(null);
  }
}
