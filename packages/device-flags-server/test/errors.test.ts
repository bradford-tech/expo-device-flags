import { describe, expect, it } from 'vitest';

import { DeviceCheckServerError, mapResponseToError } from '../src/errors.js';

const APPLE_RESPONSE_ROWS: [number, string, string][] = [
  [400, 'Bad Device Token', 'ERR_BAD_DEVICE_TOKEN'],
  [400, 'Bad Bits', 'ERR_BAD_BITS'],
  [400, 'Bad Timestamp', 'ERR_BAD_TIMESTAMP'],
  [400, 'Bad Authorization Token', 'ERR_BAD_AUTHORIZATION_TOKEN'],
  [400, 'Bad Payload', 'ERR_BAD_PAYLOAD'],
  [401, 'Invalid Authorization Token', 'ERR_INVALID_AUTHORIZATION_TOKEN'],
  [401, 'Authorization Token Expired', 'ERR_AUTHORIZATION_TOKEN_EXPIRED'],
  [403, 'Forbidden', 'ERR_FORBIDDEN'],
  [405, 'Method Not Allowed', 'ERR_METHOD_NOT_ALLOWED'],
  [429, 'Too Many Requests', 'ERR_TOO_MANY_REQUESTS'],
  [500, 'Server Error', 'ERR_SERVER_ERROR'],
  [503, 'Service Unavailable', 'ERR_SERVICE_UNAVAILABLE'],
];

describe('mapResponseToError', () => {
  it.each(APPLE_RESPONSE_ROWS)('maps %i "%s" to %s', (status, body, code) => {
    const error = mapResponseToError(status, body);
    expect(error).toBeInstanceOf(DeviceCheckServerError);
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
    expect(error.appleMessage).toBe(body);
  });

  it('maps unknown status codes to ERR_UNEXPECTED_RESPONSE', () => {
    expect(mapResponseToError(418, 'teapot').code).toBe('ERR_UNEXPECTED_RESPONSE');
  });

  it('maps unrecognized 400 bodies to ERR_UNEXPECTED_RESPONSE', () => {
    expect(mapResponseToError(400, 'mystery').code).toBe('ERR_UNEXPECTED_RESPONSE');
  });

  it('maps unrecognized 401 bodies to ERR_INVALID_AUTHORIZATION_TOKEN', () => {
    expect(mapResponseToError(401, '').code).toBe('ERR_INVALID_AUTHORIZATION_TOKEN');
  });

  it('includes status and message in the error message', () => {
    const error = mapResponseToError(429, 'Too Many Requests');
    expect(error.message).toContain('429');
    expect(error.message).toContain('Too Many Requests');
  });
});
