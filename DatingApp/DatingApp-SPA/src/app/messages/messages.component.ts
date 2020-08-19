import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Message, MessageContainer } from '../_models/message';
import { Pagination } from '../_models/pagination';
import { AvatarComponent } from '../_shared/avatar.component';
import { PagerComponent } from '../_shared/pager.component';
import { AuthService } from '../_services/auth.service';
import { errorMessage } from '../_services/error-message';
import { ToastService } from '../_services/toast.service';
import { UserService } from '../_services/user.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-messages',
  imports: [DatePipe, RouterLink, AvatarComponent, PagerComponent],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css',
})
export class MessagesComponent implements OnInit {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly containers: { id: MessageContainer; label: string; empty: string }[] = [
    { id: 'Unread', label: 'Unread', empty: 'You are all caught up.' },
    { id: 'Inbox', label: 'Inbox', empty: 'Your inbox is empty.' },
    { id: 'Outbox', label: 'Sent', empty: 'You have not sent any messages.' },
  ];
  protected readonly container = signal<MessageContainer>('Unread');
  protected readonly messages = signal<Message[]>([]);
  protected readonly pagination = signal<Pagination | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly me = this.auth.userId;

  ngOnInit(): void {
    this.load(1);
  }

  show(container: MessageContainer): void {
    this.container.set(container);
    this.load(1);
  }

  emptyText(): string {
    return this.containers.find((c) => c.id === this.container())?.empty ?? '';
  }

  load(page = this.pagination()?.currentPage ?? 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.users.getMessages(this.me(), page, PAGE_SIZE, this.container()).subscribe({
      next: ({ result, pagination }) => {
        this.messages.set(result);
        this.pagination.set(pagination);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  /** The other person in the conversation. */
  other(message: Message): { id: number; name: string; photoUrl: string | null } {
    return message.senderId === this.me()
      ? { id: message.recipientId, name: message.recipientKnownAs, photoUrl: message.recipientPhotoUrl }
      : { id: message.senderId, name: message.senderKnownAs, photoUrl: message.senderPhotoUrl };
  }

  deleteForMe(message: Message): void {
    if (!confirm('Delete this message from your view?')) {
      return;
    }
    this.users.deleteMessage(this.me(), message.id).subscribe({
      next: () => this.removed(message),
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }

  deleteForEveryone(message: Message): void {
    if (!confirm('Delete this message for both of you? This cannot be undone.')) {
      return;
    }
    this.users.deleteMessageForEveryone(this.me(), message.id).subscribe({
      next: () => this.removed(message),
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }

  private removed(message: Message): void {
    this.messages.update((list) => list.filter((m) => m.id !== message.id));
    this.toast.success('Message deleted.');
  }
}
