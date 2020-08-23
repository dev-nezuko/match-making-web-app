import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HelperService } from '../_services/helper.service';
/// <reference path="_services/auth.service.ts" />
import { AlertifyService } from '../_services/alertify.service';

import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { User } from '../_models/user';
import { Router } from '@angular/router';
import {
  AuthService,
  FacebookLoginProvider,
  GoogleLoginProvider,
} from 'angular-6-social-login-v2';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  @Output() cancelRegister = new EventEmitter();
  user: User;
  registerForm: FormGroup;
  bsConfig: Partial<BsDatepickerConfig>;

  constructor(
    private authService: HelperService,
    private router: Router,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private socialAuthService: AuthService
  ) {}

  // tslint:disable-next-line: typedef
  ngOnInit() {
    (this.bsConfig = {
      containerClass: 'theme-red',
    }),
      this.createRegisterForm();
  }

  createRegisterForm() {
    this.registerForm = this.fb.group(
      {
        gender: ['female'],
        username: ['', Validators.required],
        knownAs: ['', Validators.required],
        dateOfBirth: [new Date(), Validators.required],
        city: ['Lahore', Validators.required],
        country: ['Pakistan', Validators.required],
        password: [
          'password',
          [
            Validators.required,
            Validators.minLength(4),
            Validators.maxLength(8),
          ],
        ],
        confirmPassword: ['password', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  public socialSignIn(socialPlatform: string) {
    let socialPlatformProvider;
    if (socialPlatform == 'facebook') {
      socialPlatformProvider = FacebookLoginProvider.PROVIDER_ID;
    } else if (socialPlatform == 'google') {
      socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    }

    this.socialAuthService.signIn(socialPlatformProvider).then((userData) => {
      this.user = Object.assign({}, this.registerForm.value);
      console.log(socialPlatform + ' sign in data : ', userData);
      this.user.username = userData.name;
      this.user.photoUrl = userData.image;
      this.user.knownAs = userData.name;

      this.authService.changeMemberPhoto(userData.image);
      
      this.authService.register(this.user).subscribe(
        () => {
          this.alertify.success('Registeration Successful, login to proceed');
        },
        (error) => {
          this.alertify.error(error);
        }
      );
    });
  }
  register() {
    if (this.registerForm.valid) {
      this.user = Object.assign({}, this.registerForm.value);
      console.log(this.user);
      this.authService.register(this.user).subscribe(
        () => {
          this.alertify.success('Registeration Successful, login to proceed');
        },
        (error) => {
          this.alertify.error(error);
        }
      );
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password').value === g.get('confirmPassword').value
      ? null
      : { mismatch: true };
  }

  // tslint:disable-next-line: typedef

  // tslint:disable-next-line: typedef
  cancel() {
    this.cancelRegister.emit(false);
  }
}
