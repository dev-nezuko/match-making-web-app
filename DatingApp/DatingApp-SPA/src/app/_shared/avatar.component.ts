import { Component, computed, input, signal } from '@angular/core';

/** A member's photo, or their initials when there is none or it fails to load. */
@Component({
  selector: 'app-avatar',
  template: `
    @if (url() && !failed()) {
      <img
        [class]="'avatar avatar--' + size()"
        [src]="url()"
        [alt]="decorative() ? '' : name()"
        loading="lazy"
        (error)="failed.set(true)"
      />
    } @else {
      <span
        [class]="'avatar avatar--initials avatar--' + size()"
        [attr.role]="decorative() ? null : 'img'"
        [attr.aria-label]="decorative() ? null : name()"
        [attr.aria-hidden]="decorative() ? 'true' : null"
        >{{ initials() }}</span
      >
    }
  `,
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  readonly url = input<string | null | undefined>(null);
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg' | 'fill'>('md');
  /** Set when the name is already shown next to the picture. */
  readonly decorative = input(false);

  protected readonly failed = signal(false);
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
  );
}
