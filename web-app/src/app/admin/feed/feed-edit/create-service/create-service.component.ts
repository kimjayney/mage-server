import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Service, ServiceType } from 'src/app/feed/feed.model';
import { FeedService } from 'src/app/feed/feed.service';

@Component({
  selector: 'app-create-service',
  templateUrl: './create-service.component.html',
  styleUrls: ['./create-service.component.scss']
})
export class CreateServiceComponent implements OnInit, OnChanges {

  @Input() expanded: boolean;
  @Output() serviceCreated = new EventEmitter<Service>();
  @Output() cancelled = new EventEmitter();
  @Output() opened = new EventEmitter();
  @ViewChild('template', {static: true}) template;

  serviceTitleSummarySchema: any;
  serviceConfiguration: any;
  serviceTitleSummary: any;
  serviceConfigurationSchema: any;
  selectedServiceType: ServiceType;
  serviceFormReady = false;
  formOptions: any;
  searchControl: FormControl = new FormControl();
  serviceTypes: Array<ServiceType>;
  services: Array<Service>;

  constructor(
    private feedService: FeedService,
    private viewContainerRef: ViewContainerRef
  ) {
    this.formOptions = {
      addSubmit: false
    };
  }

  ngOnInit(): void {
    this.viewContainerRef.createEmbeddedView(this.template);

    forkJoin(
      this.feedService.fetchServiceTypes(),
      this.feedService.fetchServices()
    ).subscribe(result => {
      this.serviceTypes = result[0]
      this.services = result[1]
    });
  }

  ngOnChanges(): void {

  }

  createService(): void {
    this.serviceTitleSummary.config = this.serviceConfiguration;
    this.serviceTitleSummary.serviceType = this.selectedServiceType.id;
    this.feedService.createService(this.serviceTitleSummary).subscribe(service => {
      this.serviceCreated.emit(service);
    })
  }

  serviceTypeSelected(): void {
    this.serviceTitleSummarySchema = {
      title: {
        type: 'string',
        title: 'Service Title',
        default: this.selectedServiceType.title
      },
      summary: {
        type: 'string',
        title: 'Summary',
        default: this.selectedServiceType.summary
      }
    };
    this.serviceFormReady = true;
  }

  serviceTitleSummaryChanged($event: any): void {
    this.serviceTitleSummary = $event;
  }

  serviceConfigurationChanged($event: any): void {
    this.serviceConfiguration = $event;
  }

  cancel(): void {
    this.cancelled.emit();
  }

}