import { Component, OnInit } from '@angular/core';
import { User } from '../../_models/user';
import {
  Pagination,
  PaginatedResult,
} from '../../../../../DatingApp.API/Models/pagination';
import { AuthService } from '../../_services/auth.service';
import { UserService } from '../../_services/user.service';
import {
  ActivatedRoute,
  Router,
} from '../../../../node_modules/@angular/router';
import { AlertifyService } from '../../_services/alertify.service';
import { Route } from '@angular/compiler/src/core';

@Component({
  selector: 'app-member-block',
  templateUrl: './member-block.component.html',
  styleUrls: ['./member-block.component.css'],
})
export class MemberBlockComponent implements OnInit {
  users: User[];
  pagination: Pagination;
  blockParam: string;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private alertify: AlertifyService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.users = data['users'].result;
      this.pagination = data['users'].pagination;
    });
    this.blockParam = 'blockees';
    this.loadUsers();
  }

  unblockUser(id: number, name: string) {
    this.userService
      .unblock(this.authService.decodedToken.nameid, id)
      .subscribe(
        (data) => {
          this.alertify.success('You have unblocked user ' + name);
        },
        (error) => {
          this.alertify.error(error);
        }
      );

    this.router.navigate(['/members']);
  }

  loadUsers() {
    console.log('checking params ' + this.blockParam);
    this.blockParam = 'blockees';
    this.userService
      .getUsers(
        this.pagination.currentPage,
        this.pagination.itemsPerPage,
        null,
        null,
        this.blockParam
      )
      .subscribe(
        (res: PaginatedResult<User[]>) => {
          this.users = res.result;
          this.pagination = res.pagination;
        },
        (error) => {
          this.alertify.error(error);
        }
      );
  }

  pageChanged(event: any): void {
    this.pagination.currentPage = event.page;
    this.loadUsers();
  }
}
