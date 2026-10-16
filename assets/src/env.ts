import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	ADMIN_PASSWORD: {
		description: 'Password for /admin, where submissions are approved. Leave unset to disable admin.',
		schema: (value) => value || undefined
	},
	DATA_DIR: {
		description: 'Folder where submissions are stored as JSON. Defaults to ./data',
		schema: (value) => value || 'data'
	}
});
