import {
	workers_token,
	account_id,
	users_namespace_id,
	private_key,
	algorithm
} from '$env/static/private';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto-browserify';
import { signToken } from '$lib/server/jwt';

const namespace_id = users_namespace_id;
const key = crypto.createHash('sha256').update(private_key).digest();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const email = url.searchParams.get('key');
	if (email === null) return json({ ok: false, status: 500 });
	const encryptedEmail = unsecureEncrypt(email);
	const pw = url.searchParams.get('pw');

	if (email && pw) {
		// Login
		const result = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${account_id}/storage/kv/namespaces/${namespace_id}/values/${encryptedEmail}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${workers_token}`
				}
			}
		)
			.then((response) => response.json())
			.catch((error) => {
				throw new Error(error);
			});

		const compare = await bcrypt.compare(pw, result.password);

		if (compare) {
			const atoken = signToken({ sub: 'a', uid: encryptedEmail, mids: result.mids });
			const rtoken = signToken({ sub: 'r', uid: encryptedEmail, mids: result.mids });
			return json({ ok: true, status: 200, body: { mids: result.mids, atoken, rtoken } });
		} else {
			return json({ ok: false, status: 401 });
		}
	} else if (email && !pw) {
		// check email is exists
		const body = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${account_id}/storage/kv/namespaces/${namespace_id}/values/${encryptedEmail}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${workers_token}`
				}
			}
		)
			.then((response) => response.json())
			.catch((error) => {
				throw new Error(error);
			});

		if (body.result === null) {
			return json({ ok: false, status: 404 });
		} else {
			return json({ ok: true, status: 200 });
		}
	}
}

export async function PUT({ url, request }) {
	// 회원 가입
	const email = url.searchParams.get('key');
	if (email === null) return json({ ok: false, status: 500 });
	const body = await request.json();

	// email 양방향 암호화
	const encryptedEmail = unsecureEncrypt(email);

	// password 단방향 암호화
	const hashedPassword = await bcrypt.hash(body.password, await bcrypt.genSalt(10));

	await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${account_id}/storage/kv/namespaces/${namespace_id}/values/${encryptedEmail}`,
		{
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${workers_token}`
			},
			body: JSON.stringify({
				...body,
				password: hashedPassword
			})
		}
	);

	// JWT
	const atoken = signToken({ sub: 'a', uid: encryptedEmail, mids: body.mids });
	const rtoken = signToken({ sub: 'r', uid: encryptedEmail, mids: body.mids });

	return json({ ok: true, status: 200, body: { atoken, rtoken } });
}

function unsecureEncrypt(text: string): string {
	const cipher = crypto.createCipheriv(algorithm, key, null);
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	return encrypted;
}

function unsecureDecrypt(encryptedText: string): string {
	const decipher = crypto.createDecipheriv(algorithm, key, null);
	let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}
