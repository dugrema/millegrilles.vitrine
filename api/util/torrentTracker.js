const express = require('express');
const TrackerServer = require('bittorrent-tracker').Server;  // bittorrent-tracker

const trackerServer = new TrackerServer({
  udp: false, // enable udp server? [default=true]
  http: false, // enable http server? [default=true]
  ws: false, // enable websocket server? [default=true]
  stats: true, // enable web-based statistics? [default=true]
  filter: function (infoHash, params, cb) {
    // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
    // omitted, all torrents are allowed. It is possible to interface with a database or
    // external system before deciding to allow/deny, because this function is async.

    // It is possible to block by peer id (whitelisting torrent clients) or by secret
    // key (private trackers). Full access to the original HTTP/UDP request parameters
    // are available in `params`.

    // This example only allows one torrent.
    console.debug("Infohash " + infoHash + ", ipv4 " + params.ip + ", ipv6 " + params.ipv6);
    console.debug(params.headers);
    // console.debug(params);

    // if(trackerServer.torrents[infoHash]) {
    //   console.debug(trackerServer.torrents[infoHash]);
    //   console.debug("Seeders: ");
    //   console.debug(trackerServer.torrents[infoHash].complete);
    // }

    // console.debug(params);

    var allowed = true; // (infoHash === 'aaa67059ed6bd08362da625b3ae77f6f4a075aaa')
    if (allowed) {
      // If the callback is passed `null`, the torrent will be allowed.
      cb(null);
    } else {
      // If the callback is passed an `Error` object, the torrent will be disallowed
      // and the error's `message` property will be given as the reason.
      cb(new Error('disallowed torrent'));
    }
  }
});

trackerServer.on('error', function (err) {
  // fatal server error!
  console.error("Tracker server error");
  console.error(err.message)
})

trackerServer.on('warning', function (err) {
  // client sent bad data. probably not a problem, just a buggy client.
  console.warn("Tracker warning");
  console.warn(err.message);
  console.debug(err);
})

trackerServer.on('listening', function () {
  // fired when all requested servers are listening
  console.log("Torrent tracker listening");
  // console.log('listening on http port:' + server.http.address().port)
  // console.log('listening on udp port:' + server.udp.address().port)
})

trackerServer.on('start', function (addr) {
  console.log("Tracker server start " + addr);
})

trackerServer.on('complete', function (addr) {
  console.log("Tracker complete " + addr);
})

trackerServer.on('update', function (addr) {
  console.log("Tracker update " + addr);
})

trackerServer.on('stop', function (addr) {
  console.log("Tracker stop " + addr);
})

module.exports = {trackerServer};
