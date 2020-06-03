"use strict";

var Paging = require('../utilities/paging.js'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = require("chai").expect,
    mongoose = require('mongoose');

require('sinon-mongoose');

chai.use(sinonChai);

describe("Paging Tests", function () {

    afterEach(function () {
        sinon.restore();
    });

    it('Test page users', function (done) {
        var countQuery = new mongoose.Query();
        sinon.stub(countQuery, 'count');
        countQuery.count.returns(Promise.resolve(1));

        let user0 = {
            _id: '0'
        };
    
        var query = new mongoose.Query();
        sinon.stub(query, 'sort').returns({
            limit: sinon.stub().returnsThis(),
            skip: sinon.stub().returnsThis(),
            exec: sinon.stub().resolves([user0])
        });

        var callback = function (error, users, pageInfo) {
            expect(error).to.be.null;
            expect(users).to.not.be.null;
            expect(users.length).to.equal(1);
            expect(pageInfo).to.not.be.null;
            expect(pageInfo.limit).to.equal(10);
            expect(pageInfo.size).to.equal(1);
            expect(pageInfo.links).to.not.be.null;
            expect(pageInfo.links.next).to.be.null;
            done();
        };
        let spy = sinon.spy(callback);
        let options = { limit: '10' };
        Paging.pageUsers(countQuery, query, options, spy);
    });

    it('Test page no results', function (done) {
        var countQuery = new mongoose.Query();
        sinon.stub(countQuery, 'count');
        countQuery.count.returns(Promise.resolve(0));

    
        var query = new mongoose.Query();
        sinon.stub(query, 'sort').returns({
            limit: sinon.stub().returnsThis(),
            skip: sinon.stub().returnsThis(),
            exec: sinon.stub().resolves([])
        });

        var callback = function (error, users, pageInfo) {
            expect(error).to.be.null;
            expect(users).to.not.be.null;
            expect(users.length).to.equal(0);
            expect(pageInfo).to.not.be.null;
            expect(pageInfo.limit).to.equal(10);
            expect(pageInfo.size).to.equal(0);
            expect(pageInfo.links).to.not.be.null;
            expect(pageInfo.links.next).to.be.null;
            expect(pageInfo.links.prev).to.be.null;
            done();
        };
        let spy = sinon.spy(callback);
        let options = { limit: '10' };
        Paging.pageUsers(countQuery, query, options, spy);
    });

    it('Test page devices', function (done) {
        var countQuery = new mongoose.Query();
        sinon.stub(countQuery, 'count');
        countQuery.count.returns(Promise.resolve(10));

        let device0 = {
            _id: '0'
        };

        var query = new mongoose.Query();
        sinon.stub(query, 'sort').returns({
            limit: sinon.stub().returnsThis(),
            skip: sinon.stub().returnsThis(),
            exec: sinon.stub().resolves([device0])
        });

        let conditions = {};
        let options = { limit: '10' };
        Paging.pageDevices(countQuery, query, options, conditions).then(pageInfo => {
            expect(pageInfo).to.not.be.null;
            expect(pageInfo.size).to.equal(1);
            expect(pageInfo.devices).to.not.be.null;
            expect(pageInfo.devices).to.have.lengthOf(1);
            done();
        });
    });
})