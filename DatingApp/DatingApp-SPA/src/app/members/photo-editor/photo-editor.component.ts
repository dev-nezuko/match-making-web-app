import { Component, inject, input, output, signal } from '@angular/core';
import { Photo } from '../../_models/photo';
import { AuthService } from '../../_services/auth.service';
import { errorMessage } from '../../_services/error-message';
import { ToastService } from '../../_services/toast.service';
import { UserService } from '../../_services/user.service';

const MAX_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrl: './photo-editor.component.css',
})
export class PhotoEditorComponent {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly photos = input.required<Photo[]>();
  readonly photosChange = output<Photo[]>();

  protected readonly uploading = signal(false);
  protected readonly dragging = signal(false);

  onFilesChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.upload(Array.from(input.files ?? []));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.upload(Array.from(event.dataTransfer?.files ?? []));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  private upload(files: File[]): void {
    const images = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_BYTES);
    if (images.length < files.length) {
      this.toast.error('Only images up to 10 MB can be uploaded.');
    }
    const [next, ...rest] = images;
    if (!next) {
      return;
    }
    this.uploading.set(true);
    this.users.uploadPhoto(this.auth.userId(), next).subscribe({
      next: (photo) => {
        this.photosChange.emit([...this.photos(), photo]);
        if (photo.isMain) {
          this.auth.changeMainPhoto(photo.url);
        }
        this.uploading.set(false);
        this.upload(rest);
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        this.toast.error(errorMessage(error));
      },
    });
  }

  setMain(photo: Photo): void {
    this.users.setMainPhoto(this.auth.userId(), photo.id).subscribe({
      next: () => {
        this.photosChange.emit(this.photos().map((p) => ({ ...p, isMain: p.id === photo.id })));
        this.auth.changeMainPhoto(photo.url);
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }

  remove(photo: Photo): void {
    if (!confirm('Delete this photo?')) {
      return;
    }
    this.users.deletePhoto(this.auth.userId(), photo.id).subscribe({
      next: () => {
        this.photosChange.emit(this.photos().filter((p) => p.id !== photo.id));
        this.toast.success('Photo deleted.');
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
