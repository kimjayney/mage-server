"use strict";

const log = require('winston');

exports.id = 'add-export-permissions';

exports.up = function (done) {
    try {
        log.info('Adding export permissions (READ_EXPORT, DELETE_EXPORT)');
        this.db.collection('roles', { strict: true }, function (err, rolesCollection) {
            if (err) return done(err);

            //TODO
            //rolesCollection.updateOne({ name: 'ADMIN_ROLE' }, { $push: { permissions: 'READ_EXPORT', 'DELETE_EXPORT' } }).then(() => done()).catch(err => done(err));
        });
    } catch (err) {
        log.warn('Failed adding export roles', err);
        done(err);
    }
};

exports.down = function (done) {
    //TODO
    //rolesCollection.updateOne({ name: 'ADMIN_ROLE' }, { $pull: { permissions: 'READ_EXPORT', 'DELETE_EXPORT' } }).then(() => done()).catch(err => done(err));
    done();
};
