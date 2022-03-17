import fs from 'fs'
import fsPromises from 'fs/promises'
import { randomUUID } from 'crypto'
import config from './config.js'
import { join, extname } from 'path'
import { PassThrough, Writable } from 'stream'
import { once } from 'events'
import streamsPromises from 'stream/promises'
import Throttle from 'throttle'
import childProcess from 'child_process'
import { logger } from './util.js'

const {
  dir: {
    publicDirectory
  },
  constants: {
    fallbackBitRate,
    englishConversation,
    bitRateDivisor
  }
} = config

export class Service {
  constructor() {
    this.clientSteams = new Map()
    this.currentSong = englishConversation;
    this.currentBitRate = 0;
    this.throttleTransformer = {};
    this.currentReadable = {};
  }


  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientSteams.set(id, clientStream)

    return {
      id, clientStream
    }
  }

  removeClientStream(id) {
    this.clientSteams.delete(id)
  }

  createFileStream(file) {
    return fs.createReadStream(file)
  }

  _executeSoxCommand(args) {
    return childProcess.spawn('sox', args)
  }

  async getBitRate(song) {
    try {
      const args = [
        '--i',
        '-B',
        song
      ]

      const {
        stderr, // error
        stdout, // log
        //stdin // send data like stream
      } = this._executeSoxCommand(args)

      await Promise.all([
        once(stderr, 'readable'),
        once(stdout, 'readable')
      ])

      const [success, error] = [stdout, stderr].map(stream => stream.read());

      if (error) return await Promise.reject(error)

      return success
        .toString()
        .trim()
        .replace(/k/, '000')

    } catch (error) {
      logger.error(`Error on bitrate: ${error}`)

      return fallbackBitRate;
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk, enc, cb) => {
        for (const [id, stream] of this.clientSteams) {
          if (stream.writableEnd) {
            this.clientSteams.delete(id)
            continue;
          }

          stream.write(chunk)
        }

        cb()
      }
    })
  }

  async startStreaming() {
    logger.info(`Starting stream with ${this.currentSong}`)

    const bitRate = this.currentBitRate = (await this.getBitRate(this.currentSong)) / bitRateDivisor

    const throttleTransformer = this.throttleTransformer = new Throttle(bitRate)
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong)

    return streamsPromises.pipeline(
      songReadable,
      throttleTransformer,
      this.broadCast()
    )
  }

  async stopStreaming() {
    this.throttleTransformer?.end?.()
  }

  async getFileInfo(file) {
    const fullFilePath = join(publicDirectory, file)
    await fsPromises.access(fullFilePath)
    const fileType = extname(fullFilePath)

    return {
      type: fileType,
      name: fullFilePath
    }
  }

  async getFileStream(file) {
    const { name, type } = await this.getFileInfo(file)

    return {
      stream: this.createFileStream(name),
      type
    }
  }
}