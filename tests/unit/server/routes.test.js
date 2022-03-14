import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config.js'
import { handler } from '../../../server/routes.js'
import { Controller } from '../../../server/controller.js'
import TestUtil from '../_util/testUtil.js'

const { pages, location, constants: { CONTENT_TYPE } } = config

describe('#Routes - test site for api response', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('GET / - should redirect to homepage', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(
      302,
      {
        'Location': location.home
      }
    )
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`GET /home - should response with ${pages.homeHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream
    })

    jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.homeHTML)
    expect(mockFileStream.pipe).toBeCalledWith(params.response)
  })

  test(`GET /controller - should response with ${pages.controllerHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream
    })

    jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.controllerHTML)
    expect(mockFileStream.pipe).toBeCalledWith(params.response)
  })

  test(`GET /index.html - should response with file stream`, async () => {
    const expectedType = '.html'
    const filename = '/index.html'

    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = filename

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(filename)
    expect(mockFileStream.pipe).toBeCalledWith(params.response)
    expect(params.response.writeHead).toBeCalledWith(
      200,
      {
        'Content-Type': CONTENT_TYPE[expectedType]
      }
    )
  })

  test(`GET /file.ext - should response with file stream`, async () => {
    const expectedType = '.ext'
    const filename = '/file.ext'

    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = filename

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(filename)
    expect(mockFileStream.pipe).toBeCalledWith(params.response)
    expect(params.response.writeHead).not.toBeCalled();
  })

  test(`POST /unknown - given an inexistent route it should response with 404`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = '/unknown'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(404);
    expect(params.response.end).toHaveBeenCalled();
  })

  describe('exceptions', () => {
    test('given an inexistent file it should response with 404', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name
      ).mockRejectedValue(new Error('Error: ENOENT: no cuch file or directory'))

      await handler(...params.values())

      expect(params.response.writeHead).toBeCalledWith(404);
      expect(params.response.end).toHaveBeenCalled();
    })

    test('given an error it should response with 500', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name
      ).mockRejectedValue(new Error('Error:'))

      await handler(...params.values())

      expect(params.response.writeHead).toBeCalledWith(500);
      expect(params.response.end).toHaveBeenCalled();
    })
  })
})