import { handleLocation, locationReply, publishLocation, rotateLocationKeys } from './location.js';

export default {
  async fetch(request, env, ctx) {
    // Trust only Cloudflare's runtime Access context, never user-supplied headers.
    if (!env.LOCATION_ACCESS_AUD || ctx?.access?.aud !== env.LOCATION_ACCESS_AUD) {
      return locationReply({ error: 'Cloudflare Access required' }, 403);
    }
    return handleLocation(request, env);
  },
  async scheduled(_controller, env) {
    // Publication must continue even when an old rotation key is unavailable.
    const results = await Promise.allSettled([publishLocation(env), rotateLocationKeys(env)]);
    results.forEach((result, i) => {
      if (result.status === 'rejected') console.log(JSON.stringify({ event: i ? 'location_rotation_failed' : 'location_publication_pending' }));
    });
  },
};
