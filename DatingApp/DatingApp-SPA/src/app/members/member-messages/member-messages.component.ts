import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../_models/message';
import { AvatarComponent } from '../../_shared/avatar.component';
import { AuthService } from '../../_services/auth.service';
import { errorMessage } from '../../_services/error-message';
import { ToastService } from '../../_services/toast.service';
import { UserService } from '../../_services/user.service';

@Component({
  selector: 'app-member-messages',
  imports: [DatePipe, FormsModule, AvatarComponent],
  templateUrl: './member-messages.component.html',
  styleUrl: './member-messages.component.css',
})
export class MemberMessagesComponent implements OnInit {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly recipientId = input.required<number>();
  readonly recipientName = input.required<string>();

  /** Newest first, as the API returns them. */
  private readonly thread = signal<Message[]>([]);
  protected readonly messages = computed(() => [...this.thread()].reverse());
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected draft = '';
  protected readonly me = this.auth.userId;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const me = this.me();
    this.loading.set(true);
    this.error.set(null);
    this.users.getMessageThread(me, this.recipientId()).subscribe({
      next: (messages) => {
        this.thread.set(messages);
        this.loading.set(false);
        messages
          .filter((m) => !m.isRead && m.recipientId === me)
          .forEach((m) => this.users.markAsRead(me, m.id).subscribe());
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  send(): void {
    const content = this.draft.trim();
    if (!content) {
      return;
    }
    this.sending.set(true);
    this.users.sendMessage(this.me(), this.recipientId(), content).subscribe({
      next: (message) => {
        this.thread.update((list) => [message, ...list]);
        this.draft = '';
        this.sending.set(false);
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.toast.error(errorMessage(error));
      },
    });
  }
}
