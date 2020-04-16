import _ from 'underscore';
import PagingHelper from '../paging'

class AdminUsersController {
  constructor($uibModal, $state, $timeout, LocalStorageService, UserService) {
    this.$uibModal = $uibModal;
    this.$state = $state;
    this.$timeout = $timeout;
    this.LocalStorageService = LocalStorageService;
    this.UserService = UserService;
    this.pagingHelper = new PagingHelper(UserService);

    this.token = LocalStorageService.getToken();
    this.filter = "all"; // possible values all, active, inactive
    this.userSearch = '';
    this.itemsPerPage = 10;

    this.hasUserCreatePermission = _.contains(UserService.myself.role.permissions, 'CREATE_USER');
    this.hasUserEditPermission = _.contains(UserService.myself.role.permissions, 'UPDATE_USER');
    this.hasUserDeletePermission = _.contains(UserService.myself.role.permissions, 'DELETE_USER');

    // For some reason angular is not calling into filter function with correct context
    this.filterActive = this._filterActive.bind(this);
  }

  $onInit() {

  }

  count(state) {
    return this.pagingHelper.count(state);
  }

  hasNext() {
    return this.pagingHelper.hasNext(this.filter);
  }

  next() {
    this.pagingHelper.next(this.filter);
  }

  hasPrevious() {
    return this.pagingHelper.hasPrevious(this.filter);
  }

  previous() {
    this.pagingHelper.previous(this.filter);
  }

  users() {
    return this.pagingHelper.users(this.filter, this.userSearch);
  }

  _filterActive(user) {
    switch (this.filter) {
      case 'all': return true;
      case 'active': return user.active;
      case 'inactive': return !user.active;
      case 'disabled': return !user.enabled;
    }
  }

  reset() {
    this.filter = 'all';
    this.userSearch = '';
    this.users();
  }

  newUser() {
    this.$state.go('admin.createUser');
  }

  bulkImport() {
    this.$state.go('admin.bulkUser');
  }

  gotoUser(user) {
    this.$state.go('admin.user', { userId: user.id });
  }

  editUser($event, user) {
    $event.stopPropagation();
    this.$state.go('admin.editUser', { userId: user.id });
  }

  deleteUser($event, user) {
    $event.stopPropagation();

    var modalInstance = this.$uibModal.open({
      resolve: {
        user: () => {
          return user;
        }
      },
      component: "adminUserDelete"
    });

    modalInstance.result.then(user => {
      var users = _.reject(this.stateAndData[this.filter].pageInfo.users, u => { return u.id === user.id; });
      this.stateAndData[this.filter].pageInfo.users = users;
      this.stateAndData[this.filter].userCount = this.stateAndData[this.filter].userCount - 1;
    });
  }

  activateUser($event, user) {
    $event.stopPropagation();

    user.active = true;
    this.UserService.updateUser(user.id, user, () => {
      this.pagingHelper.activateUser(user);

      this.onUserActivated({
        $event: {
          user: user
        }
      });
    }, response => {
      this.$timeout(() => {
        this.error = response.responseText;
      });
    });
  }

  enableUser($event, user) {
    $event.stopPropagation();

    user.enabled = true;
    this.UserService.updateUser(user.id, user, () => {
      this.pagingHelper.enableUser(user);
    });
  }
}

AdminUsersController.$inject = ['$uibModal', '$state', '$timeout', 'LocalStorageService', 'UserService'];

export default {
  template: require('./users.html'),
  bindings: {
    onUserActivated: '&'
  },
  controller: AdminUsersController
};
