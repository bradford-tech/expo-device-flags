export type DeviceCheckServerErrorCode =
  | 'ERR_BAD_DEVICE_TOKEN'
  | 'ERR_BAD_BITS'
  | 'ERR_BAD_TIMESTAMP'
  | 'ERR_BAD_AUTHORIZATION_TOKEN'
  | 'ERR_BAD_PAYLOAD'
  | 'ERR_INVALID_AUTHORIZATION_TOKEN'
  | 'ERR_AUTHORIZATION_TOKEN_EXPIRED'
  | 'ERR_FORBIDDEN'
  | 'ERR_METHOD_NOT_ALLOWED'
  | 'ERR_TOO_MANY_REQUESTS'
  | 'ERR_SERVER_ERROR'
  | 'ERR_SERVICE_UNAVAILABLE'
  | 'ERR_UNEXPECTED_RESPONSE'
  | 'ERR_NETWORK';

export class DeviceCheckServerError extends Error {
  code: DeviceCheckServerErrorCode;
  status: number;
  appleMessage: string;

  constructor(
    code: DeviceCheckServerErrorCode,
    status: number,
    appleMessage: string,
    options?: { cause?: unknown }
  ) {
    super(`DeviceCheck request failed (HTTP ${status}): ${appleMessage || code}`, options);
    this.name = 'DeviceCheckServerError';
    this.code = code;
    this.status = status;
    this.appleMessage = appleMessage;
  }
}

/** Maps Apple's documented response rows to typed errors; never throws. */
export function mapResponseToError(status: number, body: string): DeviceCheckServerError {
  const text = body.toLowerCase();
  let code: DeviceCheckServerErrorCode = 'ERR_UNEXPECTED_RESPONSE';
  switch (status) {
    case 400:
      if (text.includes('device token')) code = 'ERR_BAD_DEVICE_TOKEN';
      else if (text.includes('bits')) code = 'ERR_BAD_BITS';
      else if (text.includes('timestamp')) code = 'ERR_BAD_TIMESTAMP';
      else if (text.includes('authorization') || text.includes('authentication'))
        code = 'ERR_BAD_AUTHORIZATION_TOKEN';
      else if (text.includes('payload')) code = 'ERR_BAD_PAYLOAD';
      break;
    case 401:
      code = text.includes('expired')
        ? 'ERR_AUTHORIZATION_TOKEN_EXPIRED'
        : 'ERR_INVALID_AUTHORIZATION_TOKEN';
      break;
    case 403:
      code = 'ERR_FORBIDDEN';
      break;
    case 405:
      code = 'ERR_METHOD_NOT_ALLOWED';
      break;
    case 429:
      code = 'ERR_TOO_MANY_REQUESTS';
      break;
    case 500:
      code = 'ERR_SERVER_ERROR';
      break;
    case 503:
      code = 'ERR_SERVICE_UNAVAILABLE';
      break;
  }
  return new DeviceCheckServerError(code, status, body);
}
