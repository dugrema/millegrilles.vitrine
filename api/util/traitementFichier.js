const fs = require('fs');
const path = require('path');
const {uuidToDate} = require('./UUIDUtils');
const crypto = require('crypto');
const rabbitMQ = require('./rabbitMQ');

class PathConsignation {

  constructor() {
    this.idmg = process.env.MG_IDMG || 'sansnom';
    this.consignationPath = process.env.MG_CONSIGNATION_PATH ||
      path.join('/var/opt/millegrilles/mounts/consignation');

    // Path utilisable localement
    this.consignationPathLocal = path.join(this.consignationPath, '/local');
    this.consignationPathSeeding = path.join(this.consignationPath, '/torrents/seeding');
    this.consignationPathManagedTorrents = path.join(this.consignationPath, '/torrents/torrentfiles');
  }

  trouverPathLocal(fichierUuid, encrypte) {
    let pathFichier = this._formatterPath(fichierUuid, encrypte);
    return path.join(this.consignationPathLocal, pathFichier);
  }

  formatPathFichierTorrent(nomCollection) {
    return path.join(this.consignationPathManagedTorrents, nomCollection + '.torrent');
  }

  formatPathTorrentStagingCollection(nomCollection) {
    return path.join(this.consignationPathTorrentStaging, nomCollection);
  }

  _formatterPath(fichierUuid, encrypte) {
    // Extrait la date du fileUuid, formatte le path en fonction de cette date.
    let timestamp = uuidToDate.extract(fichierUuid.replace('/', ''));
    // console.debug("uuid: " + fichierUuid + ". Timestamp " + timestamp);

    let extension = encrypte?'mgs1':'dat';

    let year = timestamp.getUTCFullYear();
    let month = timestamp.getUTCMonth() + 1; if(month < 10) month = '0'+month;
    let day = timestamp.getUTCDate(); if(day < 10) day = '0'+day;
    let hour = timestamp.getUTCHours(); if(hour < 10) hour = '0'+hour;
    let minute = timestamp.getUTCMinutes(); if(minute < 10) minute = '0'+minute;
    let fuuide =
      path.join(""+year, ""+month, ""+day, ""+hour, ""+minute,
        fichierUuid + '.' + extension);

    return fuuide;
  }

}

const pathConsignation = new PathConsignation();

module.exports = {pathConsignation};
