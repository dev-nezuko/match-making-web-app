import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pagination } from '../../_models/pagination';
import { User } from '../../_models/user';
import { AvatarComponent } from '../../_shared/avatar.component';
import { PagerComponent } from '../../_shared/pager.component';
import { AuthService } from '../../_services/auth.service';
import { errorMessage } from '../../_services/error-message';
import { ToastService } from '../../_services/toast.service';
import { UserService } from '../../_services/user.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-member-block',
  imports: [RouterLink, AvatarComponent, PagerComponent],
  templateUrl: './member-block.component.html',
  styleUrl: './member-block.component.css',
})
export class MemberBlockComponent implements OnInit {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly members = signal<User[]>([]);
  protected readonly pagination = signal<Pagination | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load(1);
  }

  load(page = this.pagination()?.currentPage ?? 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.users.getUsers(page, PAGE_SIZE, { list: 'blockees' }).subscribe({
      next: ({ result, pagination }) => {
        this.members.set(result);
        this.pagination.set(pagination);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  unblock(member: User): void {
    this.users.unblock(this.auth.userId(), member.id).subscribe({
      next: () => {
        this.members.update((list) => list.filter((m) => m.id !== member.id));
        this.toast.success(`${member.knownAs} is unblocked.`);
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
