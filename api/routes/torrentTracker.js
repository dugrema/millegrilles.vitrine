const express = require('express');
const TrackerServer = require('bittorrent-tracker').Server;  // bittorrent-tracker


// Bittorrent tracker
// var whitelist = {
//   UT: true // uTorrent
// }

const trackerServer = new TrackerServer({
  udp: true, // enable udp server? [default=true]
  http: true, // enable http server? [default=true]
  ws: true, // enable websocket server? [default=true]
  stats: true, // enable web-based statistics? [default=true]
  filter: function (infoHash, params, cb) {
    // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
    // omitted, all torrents are allowed. It is possible to interface with a database or
    // external system before deciding to allow/deny, because this function is async.

    // It is possible to block by peer id (whitelisting torrent clients) or by secret
    // key (private trackers). Full access to the original HTTP/UDP request parameters
    // are available in `params`.

    // This example only allows one torrent.
    console.debug("Infohash");
    console.debug(infoHash);
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
})


trackerServer.on('error', function (err) {
  // fatal server error!
  console.error(err.message)
})

const torrentTracker = trackerServer.onHttpRequest.bind(trackerServer);

module.exports = {torrentTracker};
