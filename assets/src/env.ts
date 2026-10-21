import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	ADMIN_PASSWORD: {
		description: 'Password for /admin, where submissions are approved. Leave unset to disable admin.',
		schema: optional
	},
	DATA_DIR: {
		description: 'Folder where data is stored as JSON when Redis is not configured. Defaults to ./data',
		schema: (value) => value || 'data'
	},

	// Upstash Redis (set automatically when you add Upstash from the Vercel Marketplace).
	// When neither pair is set, data is saved to DATA_DIR instead.
	KV_REST_API_URL: { description: 'Upstash Redis REST URL (Vercel Marketplace name)', schema: optional },
	KV_REST_API_TOKEN: { description: 'Upstash Redis REST token (Vercel Marketplace name)', schema: optional },
	UPSTASH_REDIS_REST_URL: { description: 'Upstash Redis REST URL (Upstash console name)', schema: optional },
	UPSTASH_REDIS_REST_TOKEN: { description: 'Upstash Redis REST token (Upstash console name)', schema: optional },

	// Drawings are committed to the repo so Vercel redeploys with them.
	// When GITHUB_TOKEN is unset, they are written straight to static/images (local dev).
	GITHUB_TOKEN: {
		description: 'Fine-grained GitHub token with Contents: read & write on the repo',
		schema: optional
	},
	GITHUB_REPO: { description: 'owner/name of the repo', schema: (value) => value || 'laojoh/5419-speedcadding' },
	GITHUB_BRANCH: { description: 'Branch Vercel deploys from', schema: (value) => value || 'main' }
});
