import { CanDeactivateFn } from '@angular/router';
import { MemberEditComponent } from '../members/member-edit/member-edit.component';

export const preventUnsavedChanges: CanDeactivateFn<MemberEditComponent> = (component) =>
  !component.hasUnsavedChanges() ||
  confirm('Leave this page? Your unsaved profile changes will be lost.');
