import { DatePipe } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Photo } from '../../_models/photo';
import { User } from '../../_models/user';
import { AvatarComponent } from '../../_shared/avatar.component';
import { AuthService } from '../../_services/auth.service';
import { errorMessage } from '../../_services/error-message';
import { ToastService } from '../../_services/toast.service';
import { UserService } from '../../_services/user.service';
import { PhotoEditorComponent } from '../photo-editor/photo-editor.component';

@Component({
  selector: 'app-member-edit',
  imports: [DatePipe, ReactiveFormsModule, AvatarComponent, PhotoEditorComponent],
  templateUrl: './member-edit.component.html',
  styleUrl: './member-edit.component.css',
})
export class MemberEditComponent implements OnInit {
  private readonly users = inject(UserService);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly member = signal<User | null>(null);
  protected readonly photos = signal<Photo[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    introduction: [''],
    lookingFor: [''],
    interests: [''],
    city: [''],
    country: [''],
  });

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeLeaving(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    this.load();
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.users.getUser(this.auth.userId()).subscribe({
      next: (user) => {
        this.member.set(user);
        this.photos.set(user.photos ?? []);
        this.form.reset({
          introduction: user.introduction ?? '',
          lookingFor: user.lookingFor ?? '',
          interests: user.interests ?? '',
          city: user.city,
          country: user.country,
        });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const update = this.form.getRawValue();
    this.saving.set(true);
    this.users.updateUser(this.auth.userId(), update).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset(update);
        this.member.update((m) => (m ? { ...m, ...update } : m));
        this.toast.success('Profile saved.');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.toast.error(errorMessage(error));
      },
    });
  }
}
