import fs from 'fs'
import fsPromises from 'fs/promises'
import config from './config.js'
import { join, extname } from 'path'

const { dir: { publicDirectory } } = config

export class Service {
  createFileStream(file) {
    return fs.createReadStream(file)
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