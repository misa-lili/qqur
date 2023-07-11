import { workers_token, account_id, menus_namespace_id } from '$env/static/private';
// import { signToken, verifyToken } from '$lib/server/jwt';
import { json } from '@sveltejs/kit';

const namespace_id = menus_namespace_id;

/** @type {import('./$types').RequestHandler} */
export async function GET({ fetch, url }) {
	/**
	 * 특정 메뉴를 가져옵니다.
	 */
	const key = url.searchParams.get('key');

	// Get menu
	if (key) {
		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${account_id}/storage/kv/namespaces/${namespace_id}/values/${key}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${workers_token}`
				}
			}
		);
		const data = await response.json();

		console.error(data);

		if (data.success === false) {
			return json({ ok: false, status: 404, message: data.errors[0].message });
		}

		return json({ ok: true, status: 200, body: data });
	}
}

// export async function PUT({ url, request }) {
// 	/**
// 	 * 특정 메뉴를 업서트 합니다.
// 	 */
// 	const key = url.searchParams.get('key') || '';
// 	const body = JSON.stringify(await request.json());

// 	const token = request.headers.get('Authorization')?.split(' ')[1] ?? null;

// 	try {
// 		if (token === null) {
// 			// A 토큰이 없음
// 			throw new Error('401');
// 		}
// 		const isValid = verifyToken(token);

// 		if ((isValid as Payload).mids?.includes(key) === false)
// 			throw new Error('Forbidden: no permission');
// 	} catch (error: any) {
// 		return json({ ok: false, status: 403, message: error.message });
// 	}

// 	let atoken = null;
// 	const payload: Payload = verifyToken(token) as Payload;
// 	if (payload.sub === 'r') {
// 		atoken = signToken({ sub: 'a', uid: payload.uid, mids: payload.mids });
// 	}

// 	// PUT menu
// 	await fetch(
// 		`https://api.cloudflare.com/client/v4/accounts/${account_id}/storage/kv/namespaces/${namespace_id}/values/${key}`,
// 		{
// 			method: 'PUT',
// 			headers: {
// 				// 'Content-Type': 'multipart/form-data; boundary=---011000010111000001101001',
// 				'Content-Type': 'application/json',
// 				Authorization: `Bearer ${workers_token}`
// 			},
// 			body
// 		}
// 	);

// 	return json({ ok: true, status: 200, body: { atoken } });
// }
