/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
	return await fetch(`/api/v1/menus?key=${params.mid}`)
		.then((response) => response.json())
		.catch((err) => console.error(err));
}
