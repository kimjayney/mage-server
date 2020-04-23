import _ from 'underscore';
import PagingHelper from '../paging'

class AdminTeamController {
  constructor($uibModal, $filter, $state, $stateParams, Team, Event, UserService) {
    this.$uibModal = $uibModal;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$filter = $filter;
    this.Team = Team;
    this.Event = Event;
    this.UserService = UserService;
    this.userState = 'all';
    this.usersPerPage = 10;
    this.memberSearch = '';
    this.nonMemberSearch = '';

    this.permissions = [];

    //This is a user not in the team, that is populated 
    //when a search is performed and a user is selected
    this.nonMember = null;

    //This is the list of users returned from a search
    this.searchedUsers = [];
    this.isSearching = false;

    this.pagingHelper = new PagingHelper(UserService, false);
    this.nonMemberPagingHelper = new PagingHelper(UserService, false);
    
    this.edit = false;

    this.teamEvents = [];
    this.nonTeamEvents = [];
    this.eventsPage = 0;
    this.eventsPerPage = 10;

    this.team = {
      users: []
    };

    // For some reason angular is not calling into filter function with correct context
    this.filterEvents = this._filterEvents.bind(this);
  }

  $onInit() {
    this.Team.get({ id: this.$stateParams.teamId, populate: false }, team => {
      this.team = team;
      this.user = {};

      this.pagingHelper.stateAndData[this.userState].userFilter.in = {userIds: this.team.userIds};
      this.pagingHelper.stateAndData[this.userState].countFilter.in = {userIds: this.team.userIds};
      this.pagingHelper.refresh();

      this.nonMemberPagingHelper.stateAndData[this.userState].userFilter.nin = {userIds: this.team.userIds};
      this.nonMemberPagingHelper.stateAndData[this.userState].countFilter.nin = {userIds: this.team.userIds};
      this.nonMemberPagingHelper.refresh();

      var myAccess = this.team.acl[this.UserService.myself.id];
      var aclPermissions = myAccess ? myAccess.permissions : [];

      this.hasReadPermission = _.contains(this.UserService.myself.role.permissions, 'READ_TEAM') || _.contains(aclPermissions, 'read');
      this.hasUpdatePermission = _.contains(this.UserService.myself.role.permissions, 'UPDATE_TEAM') || _.contains(aclPermissions, 'update');
      this.hasDeletePermission = _.contains(this.UserService.myself.role.permissions, 'DELETE_TEAM') || _.contains(aclPermissions, 'delete');
    });

    this.Event.query(events => {
      this.event = {};
      this.teamEvents = _.filter(events, event => {
        return _.some(event.teams, team => {
          return this.team.id === team.id;
        });
      });

      this.nonTeamEvents = _.reject(events, event => {
        return _.some(event.teams, team => {
          return this.team.id === team.id;
        });
      });
    });
  }

  count() {
    return this.pagingHelper.count(this.userState);
  }

  hasNext() {
    return this.pagingHelper.hasNext(this.userState);
  }

  next() {
    this.pagingHelper.next(this.userState);
  }

  hasPrevious() {
    return this.pagingHelper.hasPrevious(this.userState);
  }

  previous() {
    this.pagingHelper.previous(this.userState);
  }

  users() {
    return this.pagingHelper.users(this.userState);
  }

  search() {
    this.pagingHelper.search(this.userState, this.memberSearch);
  }

  searchNonMembers(searchString) {
    this.isSearching = true;
    return this.nonMemberPagingHelper.search(this.userState, searchString).then(result => {
      this.searchedUsers = this.nonMemberPagingHelper.users(this.userState);
      this.isSearching = false;
      return this.searchedUsers;
    });
  }

  editTeam(team) {
    this.$state.go('admin.editTeam', { teamId: team.id });
  }

  addUser() {
    this.team.users.push(user);
    this.nonMember = null;

    this.saveTeam();
  }

  removeUser(user) {
    this.team.users = _.reject(this.team.users, u => { return user.id === u.id; });

    this.saveTeam();
  }

  _filterEvents(event) {
    var filteredEvents = this.$filter('filter')([event], this.eventSearch);
    return filteredEvents && filteredEvents.length;
  }

  saveTeam() {
    this.team.$save();

    this.pagingHelper.refresh();
    this.nonMemberPagingHelper.refresh();
  }

  hasPermission(permission) {
    return _.contains(this.permissions, permission);
  }

  editAccess(team) {
    this.$state.go('admin.teamAccess', { teamId: team.id });
  }

  gotoEvent(event) {
    this.$state.go('admin.event', { eventId: event.id });
  }

  gotoUser(user) {
    this.$state.go('admin.user', { userId: user.id });
  }

  addEventToTeam(event) {
    this.Event.addTeam({ id: event.id }, this.team, event => {
      this.teamEvents.push(event);
      this.nonTeamEvents = _.reject(this.nonTeamEvents, e => { return e.id === event.id; });

      this.event = {};
    });
  }

  removeEventFromTeam($event, event) {
    $event.stopPropagation();

    this.Event.removeTeam({ id: event.id, teamId: this.team.id }, event => {
      this.teamEvents = _.reject(this.teamEvents, e => { return e.id === event.id; });
      this.nonTeamEvents.push(event);
    });
  }

  deleteTeam() {
    var modalInstance = this.$uibModal.open({
      resolve: {
        team: () => {
          return this.team;
        }
      },
      component: "adminTeamDelete"
    });

    modalInstance.result.then(() => {
      this.$state.go('admin.teams');
    });
  }
}

AdminTeamController.$inject = ['$uibModal', '$filter', '$state', '$stateParams', 'Team', 'Event', 'UserService'];

export default {
  template: require('./team.html'),
  controller: AdminTeamController
};
