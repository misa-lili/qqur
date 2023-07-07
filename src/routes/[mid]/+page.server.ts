/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
	try {
		const response = await fetch(`/api/v1/menus?key=${params.mid}`);
		const data = await response.json();
		return data;
	} catch (error) {
		return { error };
	}
}
