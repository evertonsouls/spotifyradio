import { jest, expect, describe, test, beforeEach } from '@jest/globals'

describe('#Services - test service for api', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test("True must be true", () => {
    expect(true).toBeTruthy()
  })
})