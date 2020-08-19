import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pagination } from '../_models/pagination';
import { User } from '../_models/user';
import { PagerComponent } from '../_shared/pager.component';
import { errorMessage } from '../_services/error-message';
import { MemberList, UserService } from '../_services/user.service';
import { MemberCardComponent } from '../members/member-card/member-card.component';

const PAGE_SIZE = 8;

export const LIKE_LISTS: { id: Exclude<MemberList, 'blockees'>; label: string; empty: string }[] = [
  { id: 'likers', label: 'Liked me', empty: 'Nobody has liked you yet.' },
  { id: 'likees', label: 'I liked', empty: 'You have not liked anyone yet.' },
  { id: 'dislikers', label: 'Passed on me', empty: 'Nobody has passed on you.' },
  { id: 'dislikees', label: 'I passed on', empty: 'You have not passed on anyone.' },
];

@Component({
  selector: 'app-lists',
  imports: [FormsModule, MemberCardComponent, PagerComponent],
  templateUrl: './lists.component.html',
})
export class ListsComponent implements OnInit {
  private readonly users = inject(UserService);

  protected readonly lists = LIKE_LISTS;
  protected readonly list = signal<(typeof LIKE_LISTS)[number]['id']>('likers');
  protected readonly current = computed(() => LIKE_LISTS.find((l) => l.id === this.list())!);
  protected readonly members = signal<User[]>([]);
  protected readonly pagination = signal<Pagination | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load(1);
  }

  show(list: (typeof LIKE_LISTS)[number]['id']): void {
    this.list.set(list);
    this.load(1);
  }

  load(page = this.pagination()?.currentPage ?? 1): void {
    this.loading.set(true);
    this.error.set(null);
    // Gender is left to the API's default (the opposite of yours), as on Matches.
    this.users.getUsers(page, PAGE_SIZE, { list: this.list() }).subscribe({
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
}
