import type { Context } from "@netlify/functions";
import { existsSync, readFileSync } from "fs";
import { resolve } from 'path';

const readLocalConfig = (path: string) => {
	console.log(path);
	return existsSync(path) ? JSON.parse(readFileSync(path)) : undefined;
}

export default async (req: Request, _context: Context) => {
	const code = new URL(req.url).searchParams.get('code');
	const config = Netlify.env.has('GITHUB_CLIENT_ID') ? {
		client_id: Netlify.env.get('GITHUB_CLIENT_ID'),
		client_secret: Netlify.env.get('GITHUB_CLIENT_SECRET'),
		redirectUrl: Netlify.env.get('GITHUB_REDIRECT_URL')
	} : readLocalConfig(resolve('local.config.json'));
	if (!config) {
		return new Response(JSON.stringify({
			error: 'Invalid config'
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const { client_id, client_secret, redirectUrl } = config;

	if (!code) return new Response("Missing authorization code", { status: 400 });

	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
		body: JSON.stringify({ client_id, client_secret, code })
	});

	const data = await response.json();
	if (data.error) {
		return new Response(JSON.stringify({
			error: data.error,
			description: data.error_description
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const access_token = data.access_token;

	if (access_token) {
		const redirectWithToken = `${redirectUrl}?access_token=${access_token}`;
		return new Response(null, {
			status: 302,
			headers: { 'Location': redirectWithToken }
		});
	} else {
		return new Response("Failed to retrieve access token", { status: 500 });
	}
};

