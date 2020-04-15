var request = require('supertest')
  , sinon = require('sinon')
  , mongoose = require('mongoose')
  , MockToken = require('../mockToken')
  , app = require('../../lib/express')
  , TokenModel = mongoose.model('Token');

require('sinon-mongoose');

require('../../lib/models/team');
var TeamModel = mongoose.model('Team');

describe("team create tests", function() {

  afterEach(function() {
    sinon.restore();
  });

  var userId = mongoose.Types.ObjectId();
  function mockTokenWithPermission(permission) {
    sinon.mock(TokenModel)
      .expects('findOne')
      .withArgs({token: "12345"})
      .chain('populate', 'userId')
      .chain('exec')
      .yields(null, MockToken(userId, [permission]));
  }

  it("should create team", function(done) {
    mockTokenWithPermission('CREATE_TEAM');

    var teamId = mongoose.Types.ObjectId();
    var eventId = 1;
    var mockTeam = new TeamModel({
      id: teamId,
      name: 'Mock Team',
      teamEventId: eventId
    });

    var acl = {};
    acl[userId.toString()] = 'OWNER';
    sinon.mock(TeamModel)
      .expects('create')
      .withArgs(sinon.match.has('acl', acl))
      .yields(null, mockTeam);

    request(app)
      .post('/api/teams/')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        name: 'Mock Team'
      })
      .expect(200)
      .end(done);
  });

  it("should reject create team w/o name", function(done) {
    mockTokenWithPermission('CREATE_TEAM');

    request(app)
      .post('/api/teams/')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
      })
      .expect(400)
      .end(done);
  });
});
