const User = require("../models/user.js"),
      Device = require("../models/device.js"),
FilterParser = require("./filterParser.js");

class PageInfo {
  constructor() {
    this.links = {
      base: '',
      context: '',
      next: null,
      prev: null,
      self: ''
    };
    this.limit = 0;
    this.size = 0;
    this.start = 0;
  }
}

function pageUsers(countQuery, query, options, callback) {
  countAndPage(countQuery, query, options, 'users').then(pageInfo => {
    callback(null, pageInfo.users, pageInfo);
  }).catch(err => {
    callback(err, null, null);
  });
}

function pageDevices(countQuery, query, options, conditions) {
  if (countQuery == null) {
    return queryUsersAndDevicesThenPage(options, conditions);
  }
  return countAndPage(countQuery, query, options, 'devices');
}

function pageTeams(countQuery, query, options, callback) {
  countAndPage(countQuery, query, options, 'teams').then(pageInfo => {
    callback(null, pageInfo.teams, pageInfo);
  }).catch(err => {
    callback(err, null, null);
  });
}

function countAndPage(countQuery, query, options, dataKey) {
  return countQuery.count().then(count => {
    return page(count, query, options, dataKey, null);
  });
}

function page(count, query, options, dataKey, dataConverter) {
  var sort = {};
  if (options.sort) {
    let json = JSON.parse(options.sort);

    for (let [key, value] of Object.entries(json)) {
      sort[key] = value;
    }
  }

  var limit = Math.abs(options.limit) || 10;
  var start = (Math.abs(options.start) || 0);
  var page = Math.ceil(start / limit);

  return query.sort(sort).limit(limit).skip(limit * page).exec().then(data => {
    if (dataConverter) {
      data = dataConverter(data);
    }
    let pageInfo = new PageInfo();
    pageInfo.start = start;
    pageInfo.limit = limit;
    pageInfo[dataKey] = data;
    pageInfo.size = data.length;

    const estimatedNext = start + limit;

    if (estimatedNext < count) {
      pageInfo.links.next = estimatedNext;
    }

    if (start > 0) {
      pageInfo.links.prev = Math.abs(options.start - options.limit);
    }

    return Promise.resolve(pageInfo);
  });
}

async function queryUsersAndDevicesThenPage(options, conditions) {
  var registered = null;
  if(conditions.registered != null) {
    registered = conditions.registered;
    delete conditions.registered;
  }
  const count = await User.Model.count(conditions);
  return User.Model.find(conditions, "_id").exec().then(data => {
    let ids = [];
    for(var i =0; i < data.length; i++) {
      let user = data[i];
      ids.push(user.id);
    }
    let deviceOptions = {
      filter: {
        in: {
          userId: ids
        }
      }
    };

    delete options.sort;

    let deviceConditions = FilterParser.parse(deviceOptions.filter);
    if(registered != null) {
      deviceConditions.registered = registered;
    }
    let deviceQuery = Device.Model.find(deviceConditions);
    deviceQuery.populate('userId');
    return page(count, deviceQuery, options, 'devices');
  });
}

module.exports.pageUsers = pageUsers
module.exports.pageDevices = pageDevices
module.exports.pageTeams = pageTeams