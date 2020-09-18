import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Service, Feed } from 'src/app/feed/feed.model';

type ServiceWithFeeds = {
  service: Service
  feeds: Feed[]
}

@Component({
  selector: 'app-admin-service-delete',
  templateUrl: './admin-service-delete.component.html',
  styleUrls: ['./admin-service-delete.component.scss']
})
export class AdminServiceDeleteComponent {

  service: Service
  feeds: Feed[]

  constructor(@Inject(MAT_DIALOG_DATA) public data: ServiceWithFeeds) {
    this.service = data.service
    this.feeds = data.feeds
  }

}
