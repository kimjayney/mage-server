import 'hammerjs';
import angular from 'angular';
import mage from './ng1/app.js';

import { enableProdMode, StaticProvider, PlatformRef } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { downgradeModule } from '@angular/upgrade/static';

if (environment.production) {
  enableProdMode();
}

const bootstrapFn = (extraProviders: StaticProvider[]): any => {
  const platformRef: PlatformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(AppModule);
}

const downgradedModule = downgradeModule(bootstrapFn);

const hybrid = angular.module('hybridMage', [mage.name, downgradedModule]);
angular.element(document).ready(function () {
  angular.bootstrap(document.body, [hybrid.name]);
});