import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Workers Sites entry point
// This serves the built React app as static assets

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      // Try to serve static assets from KV
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
          // Enable browser cache for static assets
          cacheControl: {
            browserTTL: 31536000, // 1 year
            edgeTTL: 31536000,
            bypassCache: false,
          },
        }
      );
    } catch (e) {
      // If the asset is not found, return the index.html for client-side routing
      if (e instanceof Error && e.message.includes('could not find')) {
        try {
          // Return index.html for SPA routing
          const indexRequest = new Request(new URL('/', request.url), request);
          return await getAssetFromKV(
            {
              request: indexRequest,
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
            }
          );
        } catch (indexError) {
          return new Response('Not Found', { status: 404 });
        }
      }

      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
