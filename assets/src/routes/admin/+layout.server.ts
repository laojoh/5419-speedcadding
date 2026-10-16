import { adminConfigured, isAdmin } from '#lib/server/auth.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => ({
	configured: adminConfigured(),
	authed: isAdmin(cookies)
});
