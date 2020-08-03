var ObservationModel = require('../models/observation')
  , AttachmentEvents = require('./events/attachment.js')
  , log = require('winston')
  , path = require('path')
  , fs = require('fs-extra')
  , environment = require('../environment/env');

var attachmentBase = environment.attachmentBaseDirectory;

var createAttachmentPath = function(event) {
  var now = new Date();
  return path.join(
    event.collectionName,
    now.getFullYear().toString(),
    (now.getMonth() + 1).toString(),
    now.getDate().toString()
  );
};

function Attachment(event, observation) {
  this._event = event;
  this._observation = observation;
}

var EventEmitter = new AttachmentEvents();
Attachment.on = EventEmitter;

Attachment.prototype.getById = function(attachmentId, options, callback) {
  var size = options.size ? Number(options.size) : null;

  ObservationModel.getAttachment(this._event, this._observation._id, attachmentId, function(err, attachment) {
    if (!attachment) return callback();

    if (size) {
      attachment.thumbnails.forEach(function(thumbnail) {
        if ((thumbnail.minDimension < attachment.height || !attachment.height) &&
          (thumbnail.minDimension < attachment.width || !attachment.width) &&
          (thumbnail.minDimension >= size)) {
          attachment = thumbnail;
        }
      });
    }

    if (attachment) attachment.path = path.join(attachmentBase, attachment.relativePath);

    callback(null, attachment);
  });
};

Attachment.prototype.create = function(observationId, attachment, callback) {
  var event = this._event;
  var observation = this._observation;

  var relativePath = createAttachmentPath(event);
  // move file upload to its new home
  var dir = path.join(attachmentBase, relativePath);
  fs.mkdirp(dir, function(err) {
    if (err) return callback(err);

    var fileName = path.basename(attachment.path);
    attachment.relativePath = path.join(relativePath, fileName);
    var file = path.join(attachmentBase, attachment.relativePath);

    fs.move(attachment.path, file, function(err) {
      if (err) return callback(err);

      ObservationModel.addAttachment(event, observationId, attachment, function(err, newAttachment) {
        if (!err) {
          EventEmitter.emit(AttachmentEvents.events.add, newAttachment.toObject(), observation, event);
        }

        callback(err, newAttachment);
      });
    });
  });
};

Attachment.prototype.update = function(id, attachment, callback) {
  var event = this._event;
  var observation = this._observation;

  var relativePath = createAttachmentPath(event);
  var dir = path.join(attachmentBase, relativePath);
  // move file upload to its new home
  fs.mkdirp(dir, function(err) {
    if (err) return callback(err);

    var fileName = path.basename(attachment.path);
    attachment.relativePath = path.join(relativePath, fileName);
    var file = path.join(attachmentBase, attachment.relativePath);
    fs.move(attachment.path, file, function(err) {
      if (err) return callback(err);

      ObservationModel.updateAttachment(event, observation._id, id, attachment, function(err, attachment) {
        if (err) return callback(err);

        callback(err, attachment);
      });
    });
  });
};

Attachment.prototype.delete = function(id, callback) {
  var observation = this._observation;
  if (id !== Object(id)) {
    id = {id: id, field: '_id'};
  }

  ObservationModel.removeAttachment(observation, id, function(err) {
    if (err) return callback(err);

    var attachment = null;
    observation.attachments.forEach(function(a) {
      if (a[id.field] === id.id) {
        attachment = a;
        return false; //found attachment stop iterating
      }
    });

    if (attachment) {
      var file = path.join(attachmentBase, attachment.relativePath);
      fs.remove(file, function(err) {
        if (err) {
          log.error('Could not remove attachment file ' + file + '.', err);
        }
      });
    }

    callback();
  });
};

Attachment.prototype.deleteAllForEvent = function (callback) {

  var directoryPath = path.join(attachmentBase, this._event.collectionName);
  log.info('removing attachments directory ' + directoryPath);

  fs.remove(directoryPath, function(err) {
    if (err) {
      log.warn('Could not remove attachments for event at path "' + directoryPath + '"', err);
    }

    callback(err);
  });
};

module.exports = Attachment;
