import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ExportMetadataService, ExportMetadata, ExportResponse } from './services/export-metadata.service';
import { EventService, LocalStorageService } from '../upgrade/ajs-upgraded-providers';

export interface Undoable {
    undoable: boolean;
    undoTimerHandle?: NodeJS.Timer;
}

export class ExportMetadataUI implements ExportMetadata, Undoable {
    _id: any;
    userId: any;
    physicalPath: string;
    exportType: string;
    location: string;
    filename?: string;
    status: string;
    options: any;
    eventName: string;
    undoable: boolean = false;
    undoTimerHandle?: NodeJS.Timer;
}

@Component({
    selector: 'export-metadata-dialog',
    templateUrl: 'export-metadata-dialog.component.html',
    styleUrls: ['./export-metadata-dialog.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
        trigger('flyInOut', [
            state('in', style({ transform: 'translateX(0)' })),
            transition('void => *', [
                style({ transform: 'translateX(-100%)' }),
                animate(100)
            ]),
            transition('* => void', [
                animate(100, style({ transform: 'translateX(100%)' }))
            ])
        ])
    ]
})
export class ExportMetadataDialogComponent implements OnInit {
    @ViewChild(MatPaginator, { static: true })
    paginator: MatPaginator;
    @ViewChild(MatSort, { static: true })
    sort: MatSort;
    columnsToDisplay: string[] = ['status', 'type', 'url', 'event', 'delete'];
    dataSource = new MatTableDataSource<ExportMetadataUI>();
    isLoadingResults: boolean = true;
    token: any;
    private uiModels: ExportMetadataUI[] = [];

    constructor(public dialogRef: MatDialogRef<ExportMetadataDialogComponent>,
        public snackBar: MatSnackBar,
        @Inject(ExportMetadataService)
        public exportMetaService: ExportMetadataService,
        @Inject(EventService)
        public eventService: any,
        @Inject(LocalStorageService)
        public storageService: any) {
        this.token = this.storageService.getToken();
    }

    openExport(): void {
        this.dialogRef.close('openExport');
    }

    ngOnInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // If the user changes the sort order, reset back to the first page.
        this.sort.sortChange.subscribe(() => this.paginator.firstPage());
        this.loadData();
    }

    loadData(): void {
        this.isLoadingResults = true;
        this.uiModels = [];
        this.exportMetaService.getMyExportMetadata().subscribe((data: ExportMetadata[]) => {
            let map = new Map<any, string>();
            data.forEach(meta => {
                if (!map.has(meta.options.eventId)) {
                    const eventName = this.eventService.getEventById(meta.options.eventId).name;
                    map.set(meta.options.eventId, eventName);
                }
                let metaUI: ExportMetadataUI = new ExportMetadataUI();
                Object.keys(meta).forEach(key => metaUI[key] = meta[key]);
                metaUI.eventName = map.get(meta.options.eventId);
                this.uiModels.push(metaUI);
            });
            this.dataSource.data = this.uiModels;
            this.isLoadingResults = false;
        }, (error: any) => {
            console.log("Error getting my export metadata " + error)
        });
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    retryExport(meta: ExportMetadataUI): void {
        this.exportMetaService.retryExport(meta).subscribe((response: ExportResponse) => {
            const msg: string = "Retrying export";
            this.snackBar.open(msg, null, { duration: 2000 });
            //TODO delay by snackbar timeout?
            this.loadData();
        });
    }

    scheduleDeleteExport(meta: ExportMetadataUI): void {
        meta.undoable = true;
        const self = this;
        this.snackBar.open("Export removed", "Undo", {
            duration: 2000,
        }).onAction().subscribe(() => {
            self.undoDelete(meta);
        });
        meta.undoTimerHandle = setTimeout(() => {
            meta.undoTimerHandle = null;
            this.deleteExport(meta);
        }, 10000);
    }

    private deleteExport(meta: ExportMetadataUI): void {
        this.exportMetaService.deleteExport(meta._id).subscribe(() => {
            const idx: number = this.uiModels.indexOf(meta);

            if (idx > -1) {
                this.uiModels.splice(idx, 1);
                this.dataSource.data = this.uiModels;
                if (this.dataSource.paginator) {
                    this.dataSource.paginator.firstPage();
                }
            }
        });
    }

    undoDelete(meta: Undoable): void {
        meta.undoable = false;
        clearTimeout(meta.undoTimerHandle);
    }
}
