/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	console.log(params);
	const response = await fetch(`/api/v1/menus?key=${params.mid}`);

	const data = await response.json();

	if (data.ok === false) {
		throw new Error(data.message);
	}

	console.log(data);

	return data;
}
