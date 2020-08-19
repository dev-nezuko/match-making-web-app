import { TestBed } from '@angular/core/testing';
import { PagerComponent } from './pager.component';

describe('PagerComponent', () => {
  function render(currentPage: number, totalPages: number) {
    const fixture = TestBed.createComponent(PagerComponent);
    fixture.componentRef.setInput('pagination', {
      currentPage,
      totalPages,
      itemsPerPage: 8,
      totalItems: totalPages * 8,
    });
    fixture.detectChanges();
    return fixture;
  }

  it('renders nothing for a single page', () => {
    const el: HTMLElement = render(1, 1).nativeElement;
    expect(el.querySelector('nav')).toBeNull();
  });

  it('marks the current page and emits the chosen one', () => {
    const fixture = render(2, 3);
    const el: HTMLElement = fixture.nativeElement;
    const chosen: number[] = [];
    fixture.componentInstance.pageChange.subscribe((p) => chosen.push(p));

    expect(el.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('2');

    (el.querySelector('[aria-label="Page 3"]') as HTMLButtonElement).click();
    const [previous] = Array.from(el.querySelectorAll<HTMLButtonElement>('button')).filter(
      (b) => b.textContent?.trim() === 'Previous',
    );
    previous.click();

    expect(chosen).toEqual([3, 1]);
  });

  it('disables Next on the last page', () => {
    const el: HTMLElement = render(3, 3).nativeElement;
    const next = Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Next',
    );
    expect(next?.disabled).toBe(true);
  });
});
