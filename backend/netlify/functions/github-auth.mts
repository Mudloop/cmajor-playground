import type { Context } from "@netlify/functions";

const client_id = Netlify.env.get('GITHUB_CLIENT_ID');
const client_secret = Netlify.env.get('GITHUB_CLIENT_SECRET');
const redirectUrl = Netlify.env.get('GITHUB_REDIRECT_URL');

export default async (req: Request, _context: Context) => {
	const code = new URL(req.url).searchParams.get('code');

	if (!code) {
		return new Response("Missing authorization code", { status: 400 });
	}

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
		// Redirect to the frontend with the token as a URL parameter, or handle it as preferred
		const redirectWithToken = `${redirectUrl}?access_token=${access_token}`;
		return new Response(null, {
			status: 302,
			headers: { 'Location': redirectWithToken }
		});
	} else {
		return new Response("Failed to retrieve access token", { status: 500 });
	}
};