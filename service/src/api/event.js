var async = require("async")
  , api = require('../api')
  , EventEvents = require('./events/event.js')
  , EventModel = require('../models/event');

function Event(event) {
  this._event = event;
}

var EventEmitter = new EventEvents();
Event.on = EventEmitter;

Event.prototype.count = function(callback) {
  EventModel.count(callback);
};

Event.prototype.getEvents = function(options, callback) {
  EventModel.getEvents(options, function(err, events) {
    if (err) return callback(err);

    async.each(events, function(event, done) {
      new api.Form(event).populateUserFields(done);
    }, function(err) {
      callback(err, events);
    });
  });
};

Event.prototype.getById = function(id, options, callback) {
  EventModel.getById(id, options, function(err, event) {
    if (err) return callback(err);

    if (!event) {
      var error = new Error('Event does not exist');
      error.status = 404;
      return callback(error);
    }

    new api.Form(event).populateUserFields(function(err) {
      callback(err, event);
    });
  });
};

Event.prototype.createEvent = function(event, user, callback) {
  EventModel.create(event, user, function(err, newEvent) {
    if (err) return callback(err);

    // copy default icon into new event directory
    new api.Icon(event._id).saveDefaultIconToEventForm(function(err) {
      if (!err) {
        EventEmitter.emit(EventEvents.events.add, newEvent);
      }

      callback(err, newEvent);
    });
  });
};

Event.prototype.updateEvent = function(event, options, callback) {
  EventModel.update(this._event._id, event, options, function(err, updatedEvent) {
    if (err) return callback(err);

    new api.Form(updatedEvent).populateUserFields(function(err) {
      if (!err) {
        EventEmitter.emit(EventEvents.events.update, updatedEvent);
      }

      callback(err, updatedEvent);
    });
  });
};

Event.prototype.deleteEvent = function(callback) {
  var self = this;
  EventModel.remove(this._event, function(err) {
    if (!err) {
      EventEmitter.emit(EventEvents.events.remove, self._event);
    }

    callback(err);
  });
};

Event.prototype.addForm = function(form, callback) {
  EventModel.addForm(this._event._id, form, function(err, event, form) {
    if (!err) {
      EventEmitter.emit(EventEvents.events.update, event);
    }

    callback(err, form);
  });
};

Event.prototype.updateForm = function(form, callback) {
  EventModel.updateForm(this._event._id, form, function(err, event, form) {
    if (!err) {
      EventEmitter.emit(EventEvents.events.update, event);
    }

    callback(err, form);
  });
};

Event.prototype.addTeam = function(team, callback) {
  EventModel.addTeam(this._event, team, function(err, event) {
    if (!err) {
      EventEmitter.emit(EventEvents.events.update, event);
    }

    callback(err, event);
  });
};

Event.prototype.removeTeam = function(team, callback) {
  EventModel.removeTeam(this._event, team, function(err, event) {
    if (!err) {
      EventEmitter.emit(EventEvents.events.update, event);
    }

    callback(err, event);
  });
};

Event.prototype.addLayer = function(layer, callback) {
  EventModel.addLayer(this._event, layer, function(err, event) {
    if (!err) {
      EventEmitter.emit(EventEvents.events.update, event);
    }

    callback(err, event);
  });
};

Event.prototype.removeLayer = function(layer, callback) {
  EventModel.removeLayer(this._event, layer, function(err, event) {
    if (!err) {
      EventEmitter.emit(EventEvents.events.update, event);
    }

    callback(err, event);
  });
};

module.exports = Event;
