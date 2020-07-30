var moment = require('moment')
  , Event = require('../models/event')
  , User = require('../models/user')
  , Device = require('../models/device')
  , access = require('../access')
  , exporterFactory = require('../export/exporterFactory')
  , { defaultEventPermissionsSevice: eventPermissions } = require('../permissions/permissions.events');

module.exports = function(app, security) {
  app.get(
    '/api/:exportType(geojson|kml|shapefile|csv)',
    security.authentication.passport.authenticate('bearer'),
    parseQueryParams,
    getEvent,
    validateEventAccess,
    mapUsers,
    mapDevices,
    function(req, res) {
      var options = {
        event: req.event,
        users: req.users,
        devices: req.devices,
        filter: req.parameters.filter
      };
      var exporter = exporterFactory.createExporter(req.params.exportType, options);
      exporter.export(res);
    }
  );
};

function parseQueryParams(req, res, next) {
  var parameters = {filter: {}};

  var startDate = req.param('startDate');
  if (startDate) {
    parameters.filter.startDate = moment.utc(startDate).toDate();
  }

  var endDate = req.param('endDate');
  if (endDate) {
    parameters.filter.endDate = moment.utc(endDate).toDate();
  }

  var eventId = req.param('eventId');
  if (!eventId) {
    return res.status(400).send("eventId is required");
  }
  parameters.filter.eventId = eventId;

  var observations = req.param('observations');
  if (observations) {
    parameters.filter.exportObservations = observations === 'true';

    if (parameters.filter.exportObservations) {
      parameters.filter.favorites = req.param('favorites') === 'true';
      if (parameters.filter.favorites) {
        parameters.filter.favorites = {
          userId: req.user._id
        };
      }

      parameters.filter.important = req.param('important') === 'true';
      parameters.filter.attachments = req.param('attachments') === 'true';
    }
  }

  var locations = req.param('locations');
  if (locations) {
    parameters.filter.exportLocations = locations === 'true';
  }

  req.parameters = parameters;

  next();
}

async function validateEventAccess(req, res, next) {
  if (access.userHasPermission(req.user, 'READ_OBSERVATION_ALL')) {
    return next();
  }
  if (access.userHasPermission(req.user, 'READ_OBSERVATION_EVENT')) {
    // Make sure I am part of this event
    const hasPermission = await eventPermissions.userHasEventPermission(req.event, req.user._id, 'read')
    if (hasPermission) {
      return next();
    }
  }
  res.sendStatus(403);
}

function getEvent(req, res, next) {
  Event.getById(req.parameters.filter.eventId, {}, function(err, event) {
    req.event = event;

    // form map
    event.formMap = {};

    // create a field by name map, I will need this later
    event.forms.forEach(function(form) {
      event.formMap[form.id] = form;

      var fieldNameToField = {};
      form.fields.forEach(function(field) {
        fieldNameToField[field.name] = field;
      });

      form.fieldNameToField = fieldNameToField;
    });

    next(err);
  });
}

function mapUsers(req, res, next) {
  //get users for lookup
  User.getUsers(function (err, users) {
    var map = {};
    users.forEach(function(user) {
      map[user._id] = user;
    });
    req.users = map;

    next();
  });
}

function mapDevices(req, res, next) {
  //get users for lookup
  Device.getDevices()
    .then(devices => {
      var map = {};
      devices.forEach(function(device) {
        map[device._id] = device;
      });
      req.devices = map;
      next();
    })
    .catch(err => next(err));
}
