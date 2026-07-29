// Manual integration check against Apple's DEVELOPMENT endpoint.
// Usage: DC_TEAM_ID=… DC_KEY_ID=… DC_PRIVATE_KEY="$(cat key.p8)" \
//        DC_DEVICE_TOKEN=… npm run test:integration
// Writes are skipped unless DC_WRITE=1 (updates mutate real per-device state).
import { createDeviceCheckClient } from '../build/index.js';

const { DC_TEAM_ID, DC_KEY_ID, DC_PRIVATE_KEY, DC_DEVICE_TOKEN, DC_WRITE } = process.env;

if (!DC_TEAM_ID || !DC_KEY_ID || !DC_PRIVATE_KEY || !DC_DEVICE_TOKEN) {
  console.log('Skipping: set DC_TEAM_ID, DC_KEY_ID, DC_PRIVATE_KEY, and DC_DEVICE_TOKEN.');
  process.exit(0);
}

const client = createDeviceCheckClient({
  teamId: DC_TEAM_ID,
  keyId: DC_KEY_ID,
  privateKey: DC_PRIVATE_KEY,
  environment: 'development',
});

await client.validateDeviceToken(DC_DEVICE_TOKEN);
console.log('validate_device_token: OK');

const state = await client.queryTwoBits(DC_DEVICE_TOKEN);
console.log('query_two_bits:', state);

if (DC_WRITE === '1') {
  await client.updateTwoBits(DC_DEVICE_TOKEN, { bit0: true });
  console.log('update_two_bits: set bit0=true');
  console.log('query after update:', await client.queryTwoBits(DC_DEVICE_TOKEN));
} else {
  console.log('Skipping update (set DC_WRITE=1 to test writes).');
}
