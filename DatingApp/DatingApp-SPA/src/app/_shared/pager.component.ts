import { Component, computed, input, output } from '@angular/core';
import { Pagination } from '../_models/pagination';

@Component({
  selector: 'app-pager',
  template: `
    @if (pagination(); as p) {
      @if (p.totalPages > 1) {
        <nav class="pager" aria-label="Pages">
          <button
            type="button"
            class="btn btn--ghost"
            [disabled]="p.currentPage <= 1"
            (click)="pageChange.emit(p.currentPage - 1)"
          >
            Previous
          </button>
          @for (page of pages(); track page) {
            <button
              type="button"
              class="pager__page"
              [class.pager__page--current]="page === p.currentPage"
              [attr.aria-current]="page === p.currentPage ? 'page' : null"
              [attr.aria-label]="'Page ' + page"
              (click)="pageChange.emit(page)"
            >
              {{ page }}
            </button>
          }
          <button
            type="button"
            class="btn btn--ghost"
            [disabled]="p.currentPage >= p.totalPages"
            (click)="pageChange.emit(p.currentPage + 1)"
          >
            Next
          </button>
        </nav>
      }
    }
  `,
  styleUrl: './pager.component.css',
})
export class PagerComponent {
  readonly pagination = input<Pagination | null>(null);
  readonly pageChange = output<number>();

  protected readonly pages = computed(() => {
    const total = this.pagination()?.totalPages ?? 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  });
}
