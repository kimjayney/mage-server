'use strict';

const MDCDialog = require('material-components-web').dialog.MDCDialog
    , MDCChipSet = require('material-components-web').chips.MDCChipSet
    , angular = require('angular');

function ExportInfoController($element, $timeout, FilterService, ExportService) {
    this.exportInfoPanel;
    this.chipSet;
    this.exports = [];

    this.$onChanges = function () {
        if (this.events) {
            if (this.open && this.open.opened && this.exportInfoPanel && !this.exportInfoPanel.isOpen) {
                this.exportInfoPanel.open();
            }
        }
    };

    this.$postLink = function () {
        $timeout(() => this.initialize());
    };

    this.$onDestroy = function () {
        this.exportInfoPanel.destroy();
    };

    this.initialize = function () {
        this.chipSet = new MDCChipSet($element.find('.mdc-chip-set')[0]);
        this.exportInfoPanel = new MDCDialog(angular.element.find('.export-info-panel')[0]);
        this.exportInfoPanel.listen('MDCDialog:closing', () => {
            this.onExportClose();
        });
        this.exportInfoPanel.listen('MDCDialog:opening', () => {
            this.exportEvent = { selected: FilterService.getEvent() };
            this.getExports();

        });

        this.chipSet.listen('MDCChip:selection', event => {
            console.log(event.detail);

        });

        if (this.events) {
            if (this.open && this.open.opened && !this.exportInfoPanel.isOpen) {
                this.exportInfoPanel.open();
            }
        }
    };

    this.getExports = function () {
        this.exports.splice(0, this.exports.length);

        ExportService.getAllExports().then(response => {
            for (const e of response.data) {
                this.exports.push(e);
            }
        }).catch(err => {
            console.log(err);
        });
    };

    this.openExport = function ($event) {
        //TODO implement
        console.log('Launch Dialog');
    }
}

module.exports = {
    template: require('./export-info.html'),
    bindings: {
        myself: '<',
        open: '<',
        events: '<',
        onExportClose: '&'
    },
    controller: ExportInfoController
};

ExportInfoController.$inject = ['$element', '$timeout', 'FilterService', 'ExportService'];