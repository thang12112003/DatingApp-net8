import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { MembersService } from '../../_services/members.service';
import { MemberCardComponent } from '../member-card/member-card.component';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { FormsModule } from '@angular/forms';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [MemberCardComponent, PaginationModule, FormsModule, ButtonsModule],
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.css']
})
export class MemberListComponent implements OnInit {
  memberService = inject(MembersService);
  genderList = [
    { value: 'male', display: 'Males' },
    { value: 'female', display: 'Female' }
  ];

  searchTerm = '';
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    if (!this.memberService.paginatedResult()) this.loadMembers();

    // Xử lý debounce cho search
    this.searchSubject.pipe(
      debounceTime(2000),
      distinctUntilChanged()
    ).subscribe(keyword => {
      if (keyword.trim()) {
        this.filterMembersByKnownAs(keyword.trim());
      } else {
        this.loadMembers();
      }
    });
  }

  loadMembers() {
    this.memberService.getMembers();
  }

  resetFilters() {
    this.searchTerm = '';
    this.memberService.resetUserParams();
    this.loadMembers();
  }

  pageChanged(event: any) {
    if (this.memberService.userParams().pageNumber != event.page) {
      this.memberService.userParams().pageNumber = event.page;
      this.loadMembers();
    }
  }

  onSearchInput(event: any) {
    this.searchSubject.next(event.target.value);
  }

  filterMembersByKnownAs(keyword: string) {
    const allMembers = this.memberService.paginatedResult()?.items || [];
    const filtered = allMembers.filter(m => m.knownAs.toLowerCase().startsWith(keyword.toLowerCase()));
    const pagination = this.memberService.paginatedResult()?.pagination;
    this.memberService.paginatedResult.set({
      items: filtered,
      pagination: { ...pagination!, totalItems: filtered.length }
    });
  }
}
