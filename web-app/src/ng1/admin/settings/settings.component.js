import _ from 'underscore';

class AdminSettingsController {
  constructor($q, $timeout, Api, Settings, LocalStorageService, Event, Team) {
    this.$q = $q;
    this.$timeout = $timeout;
    this.Api = Api;
    this.Settings = Settings;
    this.Event = Event;
    this.Team = Team;

    this.token = LocalStorageService.getToken();
    this.pill = 'security';

    // this.events = [];
    this.events = [{
      name: 'foo',
      description: 'bar'
    }];

    this.teams = [];
    this.strategies = [];
    this.authConfig = {};
    
    this.usersReqAdminChoices = [{
      title: 'Enabled',
      description: 'New user accounts require admin approval.',
      value: true
    },{
        title: 'Disabled',
        description: 'New user accounts do not require admin approval.',
        value: false
    }];
    this.devicesReqAdminChoices = [{
      title: 'Enabled',
      description: 'New devices require admin approval.',
      value: true
    }, {
      title: 'Disabled',
      description: 'New devices do not require admin approval.',
      value: false
    }];

    this.accountLock = {};
    this.accountLockChoices = [{
      title: 'Off',
      description: 'Do not lock MAGE user accounts.',
      value: false
    },{
      title: 'On',
      description: 'Lock MAGE user accounts for defined time \n after defined number of invalid login attempts.',
      value: true
    }];
  
    this.maxLock = {};
    this.maxLockChoices = [{
      title: 'Off',
      description: 'Do not disable MAGE user accounts.',
      value: false
    },{
      title: 'On',
      description: 'Disable MAGE user accounts after account has been locked defined number of times.',
      value: true
    }];
  
    this.minicolorSettings = {
      position: 'bottom right',
      control: 'wheel'
    };

    this.setting = "banner";
    this.settings = {};
    this.banner = {
      headerTextColor: '#000000',
      headerBackgroundColor: 'FFFFFF',
      footerTextColor: '#000000',
      footerBackgroundColor: 'FFFFFF'
    };
  }

  $onInit() {
    this.$q.all({ 
      api: this.Api.get().$promise, 
      settings: this.Settings.query().$promise ,
      teams: this.Team.query({ state: 'all', populate: false, projection: JSON.stringify(this.projection) }).$promise,
      events: this.Event.query({ state: 'all', populate: false, projection: JSON.stringify(this.projection) }).$promise
    })
    .then(result => {
      const api = result.api;

      this.authConfig = api.authenticationStrategies || {};
      this.pill = this.authConfig.local ? 'security' : 'banner';

      let strategy = {};
      for (strategy in this.authConfig) {
        this.strategies.push(strategy);
      }

      this.settings = _.indexBy(result.settings, 'type');

      this.banner = this.settings.banner ? this.settings.banner.settings : {};
      this.disclaimer = this.settings.disclaimer ? this.settings.disclaimer.settings : {};
      this.security = this.settings.security ? this.settings.security.settings : {};

      if (!this.security.accountLock) {
        this.security.accountLock = {
          enabled: false
        };
      }

      this.strategies.forEach(strategy => {
        if (!this.security[strategy]) {
          this.security[strategy] = {
            devicesReqAdmin: { enabled: true },
            usersReqAdmin: { enabled: true },
            newUserEvents: [],
            newUserTeams: []
          }
        }
      });

      this.maxLock.enabled = this.security.accountLock && this.security.accountLock.max !== undefined;

      this.teams = _.reject(result.teams, team => { return team.teamEventId; });
      this.events = result.events;
    });
  }

  saveBanner() {
    this.Settings.update({type: 'banner'}, this.banner, () => {
      this.saved = true;
      this.saving = false;
      this.saveStatus = 'Banner successfully saved';
      this.debounceHideSave();
    }, () => {
      this.saving = false;
      this.saveStatus = 'Failed to save banner';
    });
  }

  saveDisclaimer() {
    this.Settings.update({type: 'disclaimer'}, this.disclaimer, () => {
      this.saved = true;
      this.saving = false;
      this.saveStatus = 'Disclaimer successfully saved';
      this.debounceHideSave();
    }, () => {
      this.saving = false;
      this.saveStatus = 'Failed to save diclaimer';
    });
  }

  saveSecurity() {
    if (!this.maxLock.enabled) {
      delete this.security.accountLock.max;
    }

    this.strategies.forEach(strategy => {
      if (this.security[strategy].usersReqAdmin.enabled) {
        delete this.security[strategy].newUserEvents;
        delete this.security[strategy].newUserTeams;
      }
    });

    this.Settings.update({type: 'security'}, this.security, () => {
      this.saved = true;
      this.saving = false;
      this.saveStatus = 'Security settings successfully saved.';
      this.debounceHideSave();
    }, () => {
      this.saving = false;
      this.saveStatus = 'Failed to save security settings.';
    });
  }

  debounceHideSave() {
    _.debounce(() => {
      this.$timeout(() => {
        this.saved = false;
      });
    }, 3000)();
  }
}

AdminSettingsController.$inject = ['$q', '$timeout', 'Api', 'Settings', 'LocalStorageService', 'Event', 'Team'];

export default {
  template: require('./settings.html'),
  controller: AdminSettingsController
};
