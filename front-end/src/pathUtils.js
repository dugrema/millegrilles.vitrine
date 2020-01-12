const path = require('path');

class UUIDToDate {
  constructor() {
  	this.GREGORIAN_OFFSET = 122192928000000000;
  }

  extract(uuid_str) {
    return this.get_date_obj(uuid_str);
	}

  get_date_obj(uuid_str) {
    // (string) uuid_str format	=>		'11111111-2222-#333-4444-555555555555'
    var int_time = this.get_time_int( uuid_str ) - this.GREGORIAN_OFFSET,
      int_millisec = Math.floor( int_time / 10000 );
    return new Date( int_millisec );
  }

  get_time_int(uuid_str) {
    // (string) uuid_str format	=>		'11111111-2222-#333-4444-555555555555'
    var uuid_arr = uuid_str.split( '-' ),
      time_str = [
        uuid_arr[ 2 ].substring( 1 ),
        uuid_arr[ 1 ],
        uuid_arr[ 0 ]
      ].join( '' );
      // time_str is convert  '11111111-2222-#333-4444-555555555555'  to  '333222211111111'
    return parseInt( time_str, 16 );
  }

}

const uuidToDate = new UUIDToDate();

// Retourne le path du fichier
// Type est un dict {mimetype, extension} ou une des deux valeurs doit etre fournie
function pathConsignation(fichierUuid, type) {
  let pathFichier = _formatterPath(fichierUuid, type);
  return pathFichier;
}

function _formatterPath(fichierUuid, type) {
  // Extrait la date du fileUuid, formatte le path en fonction de cette date.
  let timestamp = uuidToDate.extract(fichierUuid.replace('/', ''));
  // console.debug("uuid: " + fichierUuid + ". Timestamp " + timestamp);

  let extension = type.extension;

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

export {pathConsignation};
