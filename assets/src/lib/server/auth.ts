import { createHash, timingSafeEqual } from 'node:crypto';
import { redirect, type Cookies } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$app/env/private';

const COOKIE = 'admin_session';
const hash = (s: string) => createHash('sha256').update(`speedcad:${s}`).digest();

export const adminConfigured = () => !!ADMIN_PASSWORD;

export function isAdmin(cookies: Cookies) {
	const token = cookies.get(COOKIE);
	if (!ADMIN_PASSWORD || !token) return false;
	const given = Buffer.from(token, 'hex');
	const expected = hash(ADMIN_PASSWORD);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Use in admin loads/actions: sends logged-out visitors to the login page. */
export function requireAdmin(cookies: Cookies) {
	if (!isAdmin(cookies)) redirect(303, '/admin');
}

export function logIn(cookies: Cookies, password: string) {
	if (!ADMIN_PASSWORD || !timingSafeEqual(hash(password), hash(ADMIN_PASSWORD))) return false;
	cookies.set(COOKIE, hash(ADMIN_PASSWORD).toString('hex'), {
		path: '/admin',
		httpOnly: true,
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 7
	});
	return true;
}

export function logOut(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/admin' });
}
