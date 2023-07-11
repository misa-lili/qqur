// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
	type Selected = {
		type: 'title' | 'header' | 'group' | 'item' | 'footer';
		gidx?: number;
		idx: number;
		data: any;
		target: any;
	};

	type Title = { value: string };
	type Header = { id?: string; value: string };
	type Group = {
		id?: string;
		name: string;
		col?: string;
		items: Item[];
	};
	type Item = {
		id?: string;
		name: string;
		price: string;
		description?: string;
		image?: string;
		out?: boolean;
	};
	type Footer = { id?: string; value: string };

	// key is mid
	type Menu = {
		title: Title;
		headers: Header[];
		groups: Group[];
		footers: Footer[];
	};

	/** key is email */
	type User = {
		password: string;
		mids: [mid: string];
	};

	interface Payload extends import('jose').JWTPayload {
		mids?: string[];
		uid?: string;
		sub?: 'a' | 'r';
	}
}

export {};
