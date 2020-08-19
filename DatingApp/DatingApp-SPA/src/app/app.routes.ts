import { Routes } from '@angular/router';
import { authGuard } from './_guards/auth.guard';
import { preventUnsavedChanges } from './_guards/prevent-unsaved-changes.guard';
import { HomeComponent } from './home/home.component';
import { ListsComponent } from './lists/lists.component';
import { MemberBlockComponent } from './members/member-block/member-block.component';
import { MemberDetailComponent } from './members/member-detail/member-detail.component';
import { MemberEditComponent } from './members/member-edit/member-edit.component';
import { MemberListComponent } from './members/member-list/member-list.component';
import { MessagesComponent } from './messages/messages.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full', title: 'DatingApp' },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: 'members', component: MemberListComponent, title: 'Matches · DatingApp' },
      { path: 'members/:id', component: MemberDetailComponent, title: 'Profile · DatingApp' },
      {
        path: 'member/edit',
        component: MemberEditComponent,
        canDeactivate: [preventUnsavedChanges],
        title: 'Your profile · DatingApp',
      },
      { path: 'messages', component: MessagesComponent, title: 'Messages · DatingApp' },
      { path: 'lists', component: ListsComponent, title: 'Likes · DatingApp' },
      { path: 'blocked', component: MemberBlockComponent, title: 'Blocked · DatingApp' },
    ],
  },
  { path: '**', redirectTo: '' },
];
