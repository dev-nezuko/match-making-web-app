import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { User } from '../../_models/user';
import { UserService } from '../../_services/user.service';
import { AlertifyService } from '../../_services/alertify.service';
import { ActivatedRoute, Router } from '@angular/router';
/// <reference types="@types/googlemaps" />
import {
  NgxGalleryOptions,
  NgxGalleryImage,
  NgxGalleryAnimation,
} from '@kolkov/ngx-gallery';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css'],
})
export class MemberDetailComponent implements OnInit {
  @ViewChild('memberTabs', { static: true }) memberTabs: TabsetComponent;
  user: User;
  modalRef: BsModalRef;

  galleryOptions: NgxGalleryOptions[];
  galleryImages: NgxGalleryImage[];
  lat: number = 51.678418;
  lng: number = 7.809007;
  cities: Array<string> = [];

  constructor(
    private userService: UserService,
    private alertify: AlertifyService,
    private route: ActivatedRoute,
    private _zone: NgZone,
    private authService: AuthService,
    private router: Router,
    private modalService: BsModalService
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.user = data['user'];
    });

    this.route.queryParams.subscribe((params) => {
      const selectedTab = params['tab'];
      this.memberTabs.tabs[selectedTab > 0 ? selectedTab : 0].active = true;
    });

    this.galleryOptions = [
      {
        width: '500px',
        height: '500px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        preview: false,
      },
    ];
    this.galleryImages = this.getImages();
  }

  openModal(template: TemplateRef<any>) {
    var add1 = new String(this.user.city);
    var add2 = new String(', ');
    var add3 = add1.concat(add2.toString());
    var add4 = new String(this.user.country);
    var address = '1600 Amphitheatre Parkway, Mountain View, CA';
    console.log('address is' + address);
    this.myfunc(address).subscribe((results) => {
      this._zone.run(() => {
        console.log(results);
      });
    });
    this.modalRef = this.modalService.show(template);
  }

  myfunc(address: string): Observable<any> {
    console.log('Getting address: ', address);
    let geocoder = new google.maps.Geocoder();
    return Observable.create((observer) => {
      geocoder.geocode(
        {
          address: address,
        },
        (results, status) => {
          if (status == google.maps.GeocoderStatus.OK) {
            observer.next(results[0].geometry.location);
            observer.complete();
            var latlng = google.maps.LatLng;
            console.log('observer' + latlng);
          } else {
            console.log('Error: ', results, ' & Status: ', status);
            observer.error();
          }
        }
      );
    });
  }
  getImages() {
    const imageUrls = [];
    for (let i = 0; i < this.user.photos.length; i++) {
      imageUrls.push({
        small: this.user.photos[i].url,
        medium: this.user.photos[i].url,
        big: this.user.photos[i].url,
        description: this.user.photos[i].description,
      });
    }
    return imageUrls;
  }

  blockUser(id: number) {
    this.alertify.confirm(
      'Are you sure you want to block ' + this.user.knownAs + '?',
      () => {
        this.userService
          .blockUser(this.authService.decodedToken.nameid, id)
          .subscribe(
            (data) => {
              this.alertify.error('You have blocked: ' + this.user.knownAs);
            },
            (error) => {
              this.alertify.error(error);
            }
          );

        this.router.navigate(['/members']);
      }
    );
  }

  selectTab(tabId: number) {
    this.memberTabs.tabs[tabId].active = true;
  }
}
