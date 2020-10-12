'use strict';

module.exports = {
  template: require('./export-button.component.html'),
  bindings: {
    drawer: '<'
  },
  controller: ExportButtonController
};

ExportButtonController.$inject = ['Event', 'ExportService', 'UserService'];

function ExportButtonController(Event, ExportService, UserService) {

  this.$onInit = function () {
    this.count = 0;
    setInterval(this.checkCompletedExports.bind(this), 10000);
  };

  this.$onChanges = function (changes) {
    this.checkCompletedExports();
  }

  this.export = function () {
    Event.query().$promise.then(function (events) {
      this.events = events;
    }.bind(this));
    this.exportOpen = { opened: true };
  };

  this.onExportClose = function () {
    this.exportOpen = { opened: false };
  };

  this.checkCompletedExports = function () {
    if (UserService.myself) {
      ExportService.getMyExports().then(response => {
        this.count = response.data.length;
      }).catch(err => {
        console.log(err);
      });
    }
  };
}