<script lang="ts">
	/** @type {import('./$types').PageData} */
	export let data: { body: Menu };

	import IconPlus from 'svelte-material-icons/Plus.svelte';
	import IconFolderPlusOutline from 'svelte-material-icons/FolderPlusOutline.svelte';
	import IconLightningBolt from 'svelte-material-icons/LightningBolt.svelte';
	import IconWindowClose from 'svelte-material-icons/WindowClose.svelte';
	import { onMount } from 'svelte';
	import { error } from '@sveltejs/kit';
	import { page } from '$app/stores';
	import { decodeJwt } from 'jose';
	import { goto } from '$app/navigation';
	import QR from '$lib/QR.svelte';

	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import Toolbar from '$lib/Toolbar.svelte';

	import '$lib/assets/default.css';

	let isMounted: boolean = false;

	let menu: Menu = {
		title: { value: '' },
		footers: [],
		groups: [],
		headers: []
	};

	let selected: Selected | null = null;

	const select = (event, parameters: { type: string; gidx?: number; idx?: number; data: any }) => {
		selected = parameters;
		selected.target = event.target;
	};

	const unselect = () => {
		selected = null;
		relayout();
	};

	let isOwner: boolean = false;
	let isExpired: boolean = false;

	let Masonry = null;
	let masonry;

	let email: string = '';
	let isEmailError: boolean = false;

	let password: string = '';
	let isPasswordError: boolean = false;

	onMount(async () => {
		isMounted = true;
		if (!data?.body) return;

		menu = {
			...data.body,
			title:
				typeof data.body.title === 'string'
					? { value: data.body.title }
					: data.body?.title || {
							value: ''
					  },
			headers: data.body.headers.map((header) =>
				typeof header === 'string'
					? { id: crypto.randomUUID(), value: header }
					: { ...header, id: crypto.randomUUID() }
			),
			groups: data.body.groups.reduce((acc, cur) => {
				acc = [
					...acc,
					{
						...cur,
						id: crypto.randomUUID(),
						items: cur.items.map((i) => ({ ...i, id: crypto.randomUUID() }))
					}
				];
				return acc;
			}, []),
			footers: data.body.footers.map((footer) => {
				if (typeof footer === 'string') return { id: crypto.randomUUID(), value: footer };
				else return { ...footer, id: crypto.randomUUID() };
			})
		};

		if (menu?.title.value && window && document) {
			insertImage();
		}

		const atoken = window.sessionStorage.getItem('atoken');
		if (atoken && decodeJwt(atoken).mids.includes($page.params.mid)) {
			isOwner = true;
		} else {
			isOwner = false;
		}

		if (menu.options?.styleSheet) {
			// console.log(menu.options.styleSheet);
			// document.head.innerHTML += menu.options.styleSheet;

			var css = menu.options.styleSheet;
			var style = document.createElement('style');

			if (style.styleSheet) {
				style.styleSheet.cssText = css; // 이 코드는 IE를 지원합니다
			} else {
				style.appendChild(document.createTextNode(css));
			}

			document.head.appendChild(style);
		}

		await relayout();
	});

	const initMasonry = async () => {
		Masonry = (await import('masonry-layout')).default;
		masonry = new Masonry('._groups', {
			itemSelector: '._group',
			gutter: 120
		});
	};

	const relayout = async () => {
		console.log('relayout');
		await initMasonry();
	};

	const addHeader = () => {
		menu.headers = [...menu.headers, { id: crypto.randomUUID(), value: '' }];
		relayout();
	};

	const addGroup = () => {
		menu.groups = [...menu.groups, { name: '', id: crypto.randomUUID(), items: [] }];
		relayout();
	};

	const addItem = (group) => {
		group.items = [
			...group.items,
			{
				name: '',
				price: '',
				description: '',
				image: '',
				id: crypto.randomUUID()
			}
		];
		menu.groups = menu.groups;
		relayout();
	};

	const addFooter = () => {
		menu.footers = [...menu.footers, { id: crypto.randomUUID(), value: '' }];
		relayout();
	};

	const handleInputText = (e: InputEvent): string => {
		// TODO: check 로그인 만료
		// alert('로그인이 만료되었습니다.');
		return e.target.innerText;
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();
		}
	};

	const placehold = (event) => {
		if (event.target.innerText.trim().length === 0) {
			event.target.innerText = '';
		}
	};

	const insertImage = () => {
		const target = document.querySelector('._title');
		if (/^https?:\/\//.test(menu.title.value) && target) {
			menu.title.value = `<img src="${menu.title.value.trim()}">`;
		}
		// https://i.imgur.com/ji9VuwA.jpeg
		// https://imgur.com/bYjpMis
		// https://imgur.com/PghbasK.png
	};

	let isSaving = false;
	const save = async () => {
		if (isSaving === true) return;
		isSaving = true;
		const mid = window.location.pathname.slice(1);

		let menuWithoutId: Menu = JSON.parse(JSON.stringify(menu));
		menuWithoutId.headers = menuWithoutId.headers.map((h) => {
			delete h.id;
			return h;
		});
		menuWithoutId.footers = menuWithoutId.footers.map((f) => {
			delete f.id;
			return f;
		});
		menuWithoutId.groups = menuWithoutId.groups.map((g) => {
			delete g.id;

			g.items = g.items.map((i) => {
				delete i.id;
				return i;
			});

			return g;
		});

		const result = await fetch(`/api/v1/menus?key=${mid}`, {
			method: 'PUT',
			headers: {
				Authorization: 'Bearer ' + window.sessionStorage.getItem('atoken')
			},
			body: JSON.stringify(menuWithoutId)
		})
			.then((r) => r.json())
			.catch((error) => {
				console.log(error);
			});

		if ([401, 403].includes(result.status)) {
			console.log('토큰이 만료되어 rtoken으로 재시도');
			const result2 = await fetch(`/api/v1/menus?key=${mid}`, {
				method: 'PUT',
				headers: {
					Authorization: 'Bearer ' + window.sessionStorage.getItem('rtoken')
				},
				body: JSON.stringify(menuWithoutId)
			})
				.then((r) => r.json())
				.catch((error) => {
					console.log(error);
				});

			if (result2.status === 200) {
				window.sessionStorage.setItem('atoken', result2.body.atoken);
				alert('저장되었습니다.');
			} else {
				isExpired = true;
				alert('로그인이 만료되었습니다.'); // TODO: 세션에 임시 저장?
			}
		}

		if (result.status === 200) alert('저장되었습니다.');
		isSaving = false;
	};

	const signInAndSave = async () => {
		const result = await fetch(`/api/v1/users?key=${email}&pw=${password}`).then((r) => r.json());

		if (result.status === 200) {
			window.sessionStorage.setItem('atoken', result.body.atoken);
			window.sessionStorage.setItem('rtoken', result.body.rtoken);
			save();
			isExpired = false;
		} else alert('회원 정보를 확인해 주세요');
	};

	const signOut = () => {
		window.sessionStorage.removeItem('atoken');
		window.sessionStorage.removeItem('rtoken');
		isExpired = false;
		isOwner = false;
	};
</script>

<svelte:head>
	<title>{$page.params.mid || menu.title || 'qqur.app'}</title>
</svelte:head>

{#if isOwner}
	<Toolbar bind:menu bind:selected on:relayout={relayout} on:save={save} on:signOut={signOut} />
{/if}

<dialog class="bg-white/50 fixed z-50 top-0 w-full h-full" open={isExpired}>
	<div class="bg-white border rounded-3xl flex flex-col space-y-6 px-3 pt-3 pb-12">
		<div class="flex justify-end">
			<div
				class="cursor-pointer"
				on:click={() => {
					isExpired = false;
				}}
			>
				<IconWindowClose class="_icon" />
			</div>
		</div>
		<p class="text-center">로그인이 만료되었습니다. 로그인해주세요.</p>
		<input
			type="email"
			placeholder="이메일"
			class="font-extralight bg-stone-100 rounded-full p-3 px-5 border shadow-inner"
			class:border-red-400={isEmailError}
			class:text-red-400={isEmailError}
			bind:value={email}
			on:focus={() => {
				if (isEmailError) {
					email = '';
					isEmailError = false;
				}
			}}
		/>
		<input
			type="password"
			placeholder="암호"
			class="font-extralight bg-stone-100 rounded-full p-3 px-5 border shadow-inner"
			class:border-red-400={isPasswordError}
			class:text-red-400={isPasswordError}
			bind:value={password}
			on:focus={() => {
				if (isPasswordError) {
					password = '';
					password2 = '';
					isPasswordError = false;
					isPassword2Error = false;
				}
			}}
		/>

		<input
			type="button"
			class="font-extralight h-12 rounded-full bg-black text-white px-3 cursor-pointer"
			value="로그인"
			on:click={signInAndSave}
		/>

		<div class="text-center font-extralight">
			대신 <a class="cursor-pointer text-blue-500 font-medium" on:click={signOut}>로그아웃</a>하기
		</div>
	</div>
</dialog>

<div class="_template">
	<div class="_wrapper_title">
		<div
			class="_title"
			class:ring={selected?.type === 'title'}
			placeholder={!isOwner ? '' : 'Title'}
			contenteditable={isOwner}
			on:keydown={onKeyDown}
			on:focus={(event) => select(event, { type: 'title', idx: 0, data: menu.title })}
			on:input={(event) => {
				menu.title.value = event.target.innerText;
			}}
			on:blur={(event) => {
				placehold(event);
				insertImage();
				unselect();
			}}
		>
			{@html menu.title.value}
		</div>
	</div>
	<div class="_wrapper_header">
		{#each menu.headers as header, idx (header.id)}
			<div
				class="_header"
				class:ring={selected?.type === 'header' && selected?.idx === idx}
				placeholder={!isOwner ? '' : '머릿말'}
				contenteditable={isOwner}
				on:keydown={onKeyDown}
				on:focus={(event) => select(event, { type: 'header', idx, data: header })}
				on:input={(event) => {
					header.value = handleInputText(event);
				}}
				on:blur={(event) => {
					placehold(event);
					unselect();
				}}
			>
				{header.value}
			</div>
		{/each}
		<div class="_btn_header_plus" class:hidden={!isOwner} on:click={addHeader}>
			<IconPlus class="_icon" />
		</div>
	</div>

	<div class="_groups">
		{#each menu.groups as group, gidx (group.id)}
			<div
				class="_group"
				in:fade|local={{ delay: 100, duration: 200 }}
				out:fade|local={{ delay: 0, duration: 200 }}
				animate:flip={200}
				class:ring={selected?.type === 'group' && selected?.idx === gidx}
			>
				<div class="_group_properties">
					<div
						class="_group_name"
						class:hidden={!isOwner && group === ''}
						placeholder={!isOwner ? '' : '그룹 이름'}
						contenteditable={isOwner}
						on:keydown={onKeyDown}
						on:focus={(event) => select(event, { type: 'group', idx: gidx, data: group })}
						on:input={(event) => {
							menu.groups[gidx].name = handleInputText(event);
						}}
						on:blur={(event) => {
							placehold(event);
							unselect();
						}}
					>
						{group.name}
					</div>
					<div
						class="_group_col"
						class:hidden={!isOwner && !group.col}
						placeholder={!isOwner ? '' : '칸 설명'}
						contenteditable={isOwner}
						on:keydown={onKeyDown}
						on:focus={(event) => select(event, { type: 'group', idx: gidx, data: group })}
						on:input={(event) => {
							menu.groups[gidx].col = handleInputText(event);
						}}
						on:blur={(event) => {
							placehold(event);
							unselect();
						}}
					>
						{group.col ? group.col : ''}
					</div>
				</div>
				<div class="_items">
					{#each group.items as item, iidx (item.id)}
						<div
							class="_item_wrapper"
							in:fade|local={{ delay: 100, duration: 200 }}
							out:fade|local={{ delay: 0, duration: 200 }}
							animate:flip={200}
						>
							<div
								class="_item"
								class:ring={selected?.type === 'item' &&
									selected?.gidx === gidx &&
									selected?.idx === iidx}
							>
								<div class="_item_header">
									<div
										class="_item_name"
										class:opacity-30={item.out}
										class:line-through={item.out}
										placeholder={!isOwner ? '' : '상품 이름'}
										contenteditable={isOwner}
										on:keydown={onKeyDown}
										on:focus={(event) =>
											select(event, { type: 'item', gidx, idx: iidx, data: item })}
										on:input={(event) => {
											menu.groups[gidx].items[iidx].name = handleInputText(event);
										}}
										on:blur={(event) => {
											placehold(event);
											unselect();
										}}
									>
										{item.name}
									</div>
									<div
										class="_item_price"
										placeholder={!isOwner ? '' : '가격'}
										contenteditable={isOwner}
										on:keydown={onKeyDown}
										on:focus={(event) =>
											select(event, { type: 'item', gidx, idx: iidx, data: item })}
										on:input={(event) => {
											menu.groups[gidx].items[iidx].price = handleInputText(event);
										}}
										on:blur={(event) => {
											placehold(event);
											unselect();
										}}
									>
										{item.price}
									</div>
								</div>
								<div
									class="_item_description"
									placeholder={!isOwner ? '' : '상세 설명'}
									contenteditable={isOwner}
									on:keydown={onKeyDown}
									on:focus={(event) => select(event, { type: 'item', gidx, idx: iidx, data: item })}
									on:input={(event) => {
										menu.groups[gidx].items[iidx].description = handleInputText(event);
									}}
									on:blur={(event) => {
										placehold(event);
										unselect();
									}}
								>
									{item.description}
								</div>
							</div>
						</div>
					{/each}
				</div>
				<div
					class="_btn_item_plus"
					class:hidden={!isOwner}
					on:click={() => {
						addItem(group);
					}}
				>
					<IconPlus class="_icon" />
				</div>
			</div>
		{/each}
		<div class="_group">
			<div class="_btn_group_plus" class:hidden={!isOwner} on:click={addGroup}>
				<IconFolderPlusOutline class="_icon" />
			</div>
		</div>
	</div>

	<div class="_footer_container">
		<div class="_footer_wrapper">
			{#each menu.footers as footer, idx (footer.id)}
				<div
					class="_footer"
					class:ring={selected?.type === 'footer' && selected?.idx === idx}
					placeholder={!isOwner ? '' : '바닥글'}
					contenteditable={isOwner}
					on:keydown={onKeyDown}
					on:focus={(event) => select(event, { type: 'footer', idx, data: footer })}
					on:input={(event) => {
						footer.value = handleInputText(event);
					}}
					on:blur={(event) => {
						placehold(event);
						unselect();
					}}
				>
					{footer.value}
				</div>
			{/each}
		</div>
		<div class="_btn_footer_plus" class:hidden={!isOwner} on:click={addFooter}>
			<IconPlus class="_icon" />
		</div>
		<div class="_qr">
			<QR url={`https://qqur.app/${$page.params.mid}`} />
		</div>
		<div class="_qqur" on:click={() => goto('/')}>
			<IconLightningBolt class="_icon" /> <span>BY 뀨알</span>
		</div>
	</div>
</div>
