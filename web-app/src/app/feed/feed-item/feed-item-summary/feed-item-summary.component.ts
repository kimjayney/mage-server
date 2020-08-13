import { Component, OnInit, Input, Inject } from '@angular/core';
import { Feed } from '../../feed.model';
import { FeedItemService } from '../feed-item.service';
import { MapService } from 'src/app/upgrade/ajs-upgraded-providers';
import { Feature } from 'geojson';

@Component({
  selector: 'feed-item-summary',
  templateUrl: './feed-item-summary.component.html',
  styleUrls: ['./feed-item-summary.component.scss']
})
export class FeedItemSummaryComponent implements OnInit {
  @Input() feed: Feed;
  @Input() item: Feature;

  hasContent = false;
  timestamp: number;
  primary: string;
  secondary: string;
  iconUrl: string;

  constructor(private feedItemService: FeedItemService, @Inject(MapService) private mapService: any) { }

  ngOnInit(): void {
    if (!this.item.properties) return;

    if (this.feed.mapStyle) {
      this.iconUrl = this.feed.mapStyle.iconUrl;
    }

    if (this.feed.itemTemporalProperty && this.item.properties[this.feed.itemTemporalProperty] != null) {
      this.timestamp = this.item.properties[this.feed.itemTemporalProperty];
      this.hasContent = true;
    }
   
    if (this.feed.itemPrimaryProperty && this.item.properties[this.feed.itemPrimaryProperty] != null) {
      this.primary = this.item.properties[this.feed.itemPrimaryProperty];
      this.hasContent = true;
    }

    if (this.feed.itemSecondaryProperty && this.item.properties[this.feed.itemSecondaryProperty] != null) {
      this.secondary = this.item.properties[this.feed.itemSecondaryProperty];
      this.hasContent = true;
    }
  }

  onItemSelect(): void {
    this.feedItemService.select(this.feed, this.item);
    this.mapService.zoomToFeatureInLayer(this.item, `feed-${this.feed.id}`);
  }
}