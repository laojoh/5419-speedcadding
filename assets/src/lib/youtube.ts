const ID = /^[\w-]{11}$/;

/** The video ID from any common YouTube link (watch, youtu.be, shorts, embed, live), or null. */
export function youtubeId(url: string): string | null {
	try {
		const u = new URL(url);
		const host = u.hostname.replace(/^(www|m|music)\./, '');
		let id: string | null | undefined = null;
		if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
		else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
			id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1];
		}
		return id && ID.test(id) ? id : null;
	} catch {
		return null;
	}
}
