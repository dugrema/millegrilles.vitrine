const fs = require('fs')
const zlib = require('zlib')
const { Readable } = require('stream')

function sauvegarderContenuGzip(pathFichier, message) {
  const writeStream = fs.createWriteStream(pathFichier)
  const gzip = zlib.createGzip()
  gzip.pipe(writeStream)

  const promise = new Promise((resolve, reject)=>{
    writeStream.on('finish', _=>{resolve()})
    writeStream.on('error', err=>{reject(err)})
  })

  const readable = new Readable()
  readable._read = () => {}
  readable.pipe(gzip)
  readable.push(JSON.stringify(message))
  readable.push(null)

  return promise
}

function sauvegarderGzip(pathFichier, contenu) {
  const writeStream = fs.createWriteStream(pathFichier)
  const gzip = zlib.createGzip()
  gzip.pipe(writeStream)

  const promise = new Promise((resolve, reject)=>{
    writeStream.on('finish', _=>{resolve()})
    writeStream.on('error', err=>{reject(err)})
  })

  const readable = new Readable()
  readable._read = () => {}
  readable.pipe(gzip)
  readable.push(contenu)
  readable.push(null)

  return promise
}

module.exports = {sauvegarderContenuGzip, sauvegarderGzip}
