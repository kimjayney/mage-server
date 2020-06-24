var request = require('supertest')
  , sinon = require('sinon')
  , should = require('chai').should()
  , MockToken = require('../mockToken')
  , { app } = require('../../lib/express')
  , mongoose = require('mongoose');

require('../../lib/models/token');
var TokenModel = mongoose.model('Token');

require('../../lib/models/role');
var RoleModel = mongoose.model('Role');

require('../../lib/models/user');
var UserModel = mongoose.model('User');

const Setting = require('../../lib/models/setting');

require('sinon-mongoose');

describe("user create tests", function() {

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

  it('should create user as admin', function(done) {
    mockTokenWithPermission('CREATE_USER');

    var id = mongoose.Types.ObjectId();
    var roleId = mongoose.Types.ObjectId();
    var mockUser = new UserModel({
      _id: id,
      username: 'test',
      displayName: 'test',
      password: 'password',
      passwordconfirm: 'password',
      roleId: roleId,
      authentication: {
        type: this.test.title
      }
    });

    sinon.mock(Setting)
      .expects('getSetting').withArgs('security')
      .resolves({
        settings: {
          [mockUser.authentication.type]: {
            usersReqAdmin: true
          }
        }
      })

    sinon.mock(mockUser)
      .expects('populate')
      .twice()
      .withArgs('roleId')
      .yields(null, mockUser);

    sinon.mock(UserModel)
      .expects('create')
      .withArgs(sinon.match.has('active', true))
      .yields(null, mockUser);

    sinon.mock(mockUser)
      .expects('save')
      .yields(null, mockUser);

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        displayName: 'test',
        password: 'passwordpassword',
        passwordconfirm: 'passwordpassword',
        roleId: roleId
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        var user = res.body;
        should.exist(user);
        user.should.have.property('id').that.equals(id.toString());
      })
      .end(done);
  });

  it('should fail to create user as admin w/o roleId', function(done) {
    mockTokenWithPermission('CREATE_USER');

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        displayName: 'test',
        password: 'passwordpassword',
        passwordconfirm: 'passwordpassword'
      })
      .expect(400)
      .expect(function(res) {
        res.text.should.equal('roleId is a required field');
      })
      .end(done);
  });

  it('should create user', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    sinon.mock(RoleModel)
      .expects('findOne')
      .withArgs({ name: 'USER_ROLE' })
      .yields(null, new RoleModel({
        permissions: ['SOME_PERMISSIONS']
      }));

    var id = mongoose.Types.ObjectId();
    var mockUser = new UserModel({
      _id: id,
      username: 'test',
      displayName: 'test',
      password: 'passwordpassword',
      passwordconfirm: 'passwordpassword',
      authentication: {
        type: this.test.title
      }
    });

    sinon.mock(Setting)
      .expects('getSetting').withArgs('security')
      .resolves({
        settings: {
          [mockUser.authentication.type]: {
            usersReqAdmin: true
          }
        }
      });

    sinon.mock(mockUser)
      .expects('populate')
      .withArgs('roleId')
      .yields(null, mockUser);

    sinon.mock(UserModel)
      .expects('create')
      .withArgs(sinon.match.has('active', false))
      .yields(null, mockUser);

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        displayName: 'test',
        phone: '000-000-0000',
        email: 'test@test.com',
        password: 'passwordpassword',
        passwordconfirm: 'passwordpassword'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        var user = res.body;
        should.exist(user);
        user.should.have.property('id').that.equals(id.toString());
      })
      .end(done);
  });

  it('should create user with no whitespace', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    sinon.mock(RoleModel)
      .expects('findOne')
      .withArgs({ name: 'USER_ROLE' })
      .yields(null, new RoleModel({
        permissions: ['SOME_PERMISSIONS']
      }));

    var id = mongoose.Types.ObjectId();
    var mockUser = new UserModel({
      _id: id,
      username: 'test',
      displayName: 'test',
      password: 'passwordpassword',
      passwordconfirm: 'passwordpassword',
      authentication: {
        type: 'test_auth'
      }
    });

    sinon.mock(Setting)
      .expects('getSetting').withArgs('security')
      .resolves({
        settings: {
          [mockUser.authentication.type]: {
            usersReqAdmin: true
          }
        }
      })

    sinon.mock(mockUser)
      .expects('populate')
      .withArgs('roleId')
      .yields(null, mockUser);

    sinon.mock(UserModel)
      .expects('create')
      .withArgs(sinon.match.has('username', 'test'))
      .yields(null, mockUser);

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: ' test ',
        displayName: 'test',
        phone: '000-000-0000',
        email: 'test@test.com',
        password: 'passwordpassword',
        passwordconfirm: 'passwordpassword'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        var user = res.body;
        should.exist(user);
        user.should.have.property('id').that.equals(id.toString());
      })
      .end(done);
  });

  it('should fail to create user w/o username', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        displayName: 'test',
        password: 'passwordpassword',
        passwordconfirm: 'passwordpassword'
      })
      .expect(400)
      .expect(function(res) {
        res.text.should.equal("Invalid user document: missing required parameter 'username'");
      })
      .end(done);
  });

  it('should fail to create user w/o displayName', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        password: 'passwordpassword',
        passwordconfirm: 'passwordpassword'
      })
      .expect(400)
      .expect(function(res) {
        res.text.should.equal("Invalid user document: missing required parameter 'displayName'");
      })
      .end(done);
  });

  it('should fail to create user with invalid email', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        displayName: 'test',
        email: 'notvalid',
        password: 'passwordpassword',
        passwordconfirm: 'passwordpassword'
      })
      .expect(400)
      .expect(function(res) {
        res.text.should.equal('Invalid email address');
      })
      .end(done);
  });

  it('should fail to create user w/o password', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        displayName: 'test',
        passwordconfirm: 'passwordpassword'
      })
      .expect(400)
      .expect(function(res) {
        res.text.should.equal("Invalid user document: missing required parameter 'password'");
      })
      .end(done);
  });

  it('should fail to create user w/o passwordconfirm', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        displayName: 'test',
        password: 'passwordpassword'
      })
      .expect(400)
      .expect(function(res) {
        res.text.should.equal("Invalid user document: missing required parameter 'passwordconfirm'");
      })
      .end(done);
  });

  it('should fail to create user when passsord and passwordconfirm do not match', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        displayName: 'test',
        password: 'passwordpassword',
        passwordconfirm: 'passwordconfirmpasswordconfirm'
      })
      .expect(400)
      .expect(function(res) {
        res.text.should.equal('Passwords do not match');
      })
      .end(done);
  });

  it('should fail to create user when passsord does not meet complexity', function(done) {
    mockTokenWithPermission('NO_PERMISSIONS');

    sinon.mock(RoleModel)
      .expects('findOne')
      .withArgs({ name: 'USER_ROLE' })
      .yields(null, new RoleModel({
        permissions: ['SOME_PERMISSIONS']
      }));

    request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .send({
        username: 'test',
        displayName: 'test',
        password: 'password',
        passwordconfirm: 'password'
      })
      .expect(400)
      .expect(function(res) {
        res.text.should.equal('Password must be at least 14 characters');
      })
      .end(done);
  });

});
