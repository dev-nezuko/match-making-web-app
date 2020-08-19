import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pagination } from '../../_models/pagination';
import { User } from '../../_models/user';
import { PagerComponent } from '../../_shared/pager.component';
import { AuthService } from '../../_services/auth.service';
import { errorMessage } from '../../_services/error-message';
import { MemberFilters, UserService } from '../../_services/user.service';
import { MemberCardComponent } from '../member-card/member-card.component';

const PAGE_SIZE = 8;

@Component({
  selector: 'app-member-list',
  imports: [FormsModule, MemberCardComponent, PagerComponent],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.css',
})
export class MemberListComponent implements OnInit {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);

  protected readonly members = signal<User[]>([]);
  protected readonly pagination = signal<Pagination | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly genders = [
    { value: 'female', label: 'Women' },
    { value: 'male', label: 'Men' },
  ];
  protected filters: MemberFilters = this.defaultFilters();

  ngOnInit(): void {
    this.load(1);
  }

  load(page = this.pagination()?.currentPage ?? 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.users.getUsers(page, PAGE_SIZE, { filters: this.filters }).subscribe({
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

  applyFilters(): void {
    if (this.filters.minAge > this.filters.maxAge) {
      [this.filters.minAge, this.filters.maxAge] = [this.filters.maxAge, this.filters.minAge];
    }
    this.load(1);
  }

  resetFilters(): void {
    this.filters = this.defaultFilters();
    this.load(1);
  }

  private defaultFilters(): MemberFilters {
    const myGender = this.auth.currentUser()?.gender;
    return {
      gender: myGender === 'female' ? 'male' : 'female',
      minAge: 18,
      maxAge: 99,
      orderBy: 'lastActive',
    };
  }
}
