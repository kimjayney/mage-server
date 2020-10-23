import { Component, OnInit, OnChanges, Input, Output, EventEmitter, ViewChild, SimpleChanges } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ExportMetadataService, ExportMetadata } from './export-metadata.service';


@Component({
  template: '<div></div>'
})
export class ExportsComponent implements OnChanges {
  @Input() open: any;
  @Input() events: any[];
  @Output() onExportClose = new EventEmitter<void>();

  /**
   * Keep track of the dialog ref to detect if the dialog is open or not
   */
  private matDialogRef: MatDialogRef<ExportMetadataDialogComponent>;

  constructor(private dialog: MatDialog) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.open && this.open.opened && !this.matDialogRef) {
      this.openDialog();
    }
  }
  openDialog(): void {
    this.matDialogRef = this.dialog.open(ExportMetadataDialogComponent);

    this.matDialogRef.afterClosed().subscribe(() => {
      this.onExportClose.emit();
      this.matDialogRef = null;
    });
  }
}

@Component({
  selector: 'export-metadata-dialog',
  templateUrl: 'export-metadata-dialog.component.html',
  styleUrls: ['./export-metadata-dialog.component.scss'],
  providers: [ExportMetadataService]
})
export class ExportMetadataDialogComponent implements OnInit, OnChanges {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  displayedColumns: string[] = ['status', 'user', 'type', 'url'];
  dataSource = new MatTableDataSource<ExportMetadata>();

  constructor(
    private dialogRef: MatDialogRef<ExportMetadataDialogComponent>, private exportMetaService: ExportMetadataService) { }


  newExport(): void {
    //TODO launch old export dialog?
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.dataSource.data.splice(0, this.dataSource.data.length);

    this.exportMetaService.getMyExportMetadata().subscribe((data: ExportMetadata[]) => {
      this.dataSource.data.concat(data);
    });
  }
}