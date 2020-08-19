import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../_models/user';
import { AvatarComponent } from '../../_shared/avatar.component';
import { AuthService } from '../../_services/auth.service';
import { errorMessage } from '../../_services/error-message';
import { ToastService } from '../../_services/toast.service';
import { UserService } from '../../_services/user.service';
import { MemberMessagesComponent } from '../member-messages/member-messages.component';

export type ProfileTab = 'about' | 'interests' | 'photos' | 'messages';
const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'interests', label: 'Interests' },
  { id: 'photos', label: 'Photos' },
  { id: 'messages', label: 'Messages' },
];

@Component({
  selector: 'app-member-detail',
  imports: [DatePipe, AvatarComponent, MemberMessagesComponent],
  templateUrl: './member-detail.component.html',
  styleUrl: './member-detail.component.css',
})
export class MemberDetailComponent {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Route parameter :id. */
  readonly id = input.required<string>();
  /** Optional ?tab= query parameter, e.g. from a "Message" link. */
  readonly tab = input<string | undefined>();

  protected readonly tabs = TABS;
  protected readonly member = signal<User | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly activeTab = signal<ProfileTab>('about');

  constructor() {
    effect(() => this.load(Number(this.id())));
    effect(() => {
      const requested = TABS.find((t) => t.id === this.tab());
      this.activeTab.set(requested?.id ?? 'about');
    });
  }

  load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.users.getUser(id).subscribe({
      next: (user) => {
        this.member.set(user);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  reload(): void {
    this.load(Number(this.id()));
  }

  selectTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  /** Arrow keys move between tabs, as the ARIA tabs pattern expects. */
  onTabKey(event: KeyboardEvent, index: number): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) {
      return;
    }
    const next = TABS[(index + step + TABS.length) % TABS.length];
    this.selectTab(next.id);
    document.getElementById('tab-' + next.id)?.focus();
  }

  block(): void {
    const member = this.member();
    if (!member || !confirm(`Block ${member.knownAs}? You will no longer see each other.`)) {
      return;
    }
    this.users.block(this.auth.userId(), member.id).subscribe({
      next: () => {
        this.toast.info(`${member.knownAs} is blocked.`);
        this.router.navigate(['/members']);
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
