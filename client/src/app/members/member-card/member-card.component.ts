import { Component, computed, inject, input } from '@angular/core';
import { Member } from '../../_models/member';
import { RouterLink } from '@angular/router';
import { LikesService } from '../../_services/likes.service';
import { PresenceService } from '../../_services/presence.service';

@Component({
  selector: 'app-member-card',
  imports: [RouterLink],
  templateUrl: './member-card.component.html',
  styleUrl: './member-card.component.css'
})
export class MemberCardComponent {
  private likesService = inject(LikesService);
  private presenceService = inject(PresenceService);
  member = input.required<Member>();
  hasLiked = computed(() => this.likesService.likeIds().includes(this.member().id));
  isOnline = computed(() => this.presenceService.onlineUsers().includes(this.member().username));

  toogleLike() {
    this.likesService.toogleLike(this.member().id).subscribe({
      next: _ => {
        if (this.hasLiked()) {
          this.likesService.likeIds.update(ids => ids.filter(x => x !== this.member().id));
        } else {
          this.likesService.likeIds.update(ids => [...ids, this.member().id]);
        }
      }
    });
  }
}
