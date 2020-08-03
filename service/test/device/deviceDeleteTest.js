var request = require('supertest')
  , sinon = require('sinon')
  , should = require('chai').should()
  , mongoose = require('mongoose')
  , { app } = require('../../lib/express')
  , MockToken = require('../mockToken')
  , TokenModel = mongoose.model('Token');

require('sinon-mongoose');

require('../../lib/models/device');
var DeviceModel = mongoose.model('Device');

describe("device delete tests", function() {

  afterEach(function() {
    sinon.restore();
  });

  var userId = mongoose.Types.ObjectId();
  function mockTokenWithPermission(permission) {
    sinon.mock(TokenModel)
      .expects('findOne')
      .withArgs({token: "12345"})
      .chain('populate')
      .chain('exec')
      .yields(null, MockToken(userId, [permission]));
  }

  it("should delete device", function(done) {
    mockTokenWithPermission('DELETE_DEVICE');

    var userId = mongoose.Types.ObjectId();
    var mockDevice = new DeviceModel({
      uid: '12345',
      name: 'Test Device',
      registered: true,
      description: 'Some description',
      userId: userId.toString()
    });
    sinon.mock(DeviceModel)
      .expects('findById')
      .chain('exec')
      .resolves(mockDevice);

    sinon.mock(mockDevice)
      .expects('remove')
      .chain('exec')
      .resolves(mockDevice);

    request(app)
      .delete('/api/devices/123')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        var device = res.body;
        should.exist(device);
      })
      .end(done);
  });

  it("should fail to delete device that does not exist", function(done) {
    mockTokenWithPermission('DELETE_DEVICE');

    sinon.mock(DeviceModel)
      .expects('findById')
      .chain('exec')
      .resolves(null);

    request(app)
      .delete('/api/devices/123')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer 12345')
      .expect(404)
      .end(done);
  });

});
