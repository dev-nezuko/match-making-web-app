import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../_models/user';
import { AvatarComponent } from '../../_shared/avatar.component';
import { AuthService } from '../../_services/auth.service';
import { errorMessage } from '../../_services/error-message';
import { ToastService } from '../../_services/toast.service';
import { UserService } from '../../_services/user.service';

@Component({
  selector: 'app-member-card',
  imports: [RouterLink, AvatarComponent],
  templateUrl: './member-card.component.html',
  styleUrl: './member-card.component.css',
})
export class MemberCardComponent {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly toast = inject(ToastService);

  readonly user = input.required<User>();
  /** Emitted after a like or dislike, so lists can drop or refresh the card. */
  readonly reacted = output<'like' | 'dislike'>();

  like(): void {
    this.users.like(this.auth.userId(), this.user().id).subscribe({
      next: () => {
        this.toast.success(`You liked ${this.user().knownAs}.`);
        this.reacted.emit('like');
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }

  dislike(): void {
    this.users.dislike(this.auth.userId(), this.user().id).subscribe({
      next: () => {
        this.toast.info(`You passed on ${this.user().knownAs}.`);
        this.reacted.emit('dislike');
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
