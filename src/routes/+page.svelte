<script lang="ts">
	import { decodeJwt } from 'jose';
	import { fade, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { goto } from '$app/navigation';
	import bcrypt from 'bcryptjs';
	import { onMount } from 'svelte';
	import { each } from 'svelte/internal';

	let isSiginedIn: boolean = false;
	let mids: string[] = [];

	let isSignUp: boolean = false;

	let email: string = '';
	let isEmailError: boolean = false;

	let password: string = '';
	let isPasswordError: boolean = false;

	let password2: string = '';
	let isPassword2Error: boolean = false;

	let mid: string = '';
	let isMidError: boolean = false;

	onMount(() => {
		if (window) {
			checkTokens();
		}
	});

	const checkTokens = () => {
		const atoken = window.sessionStorage.getItem('atoken');
		const rtoken = window.sessionStorage.getItem('rtoken');
		if (atoken || rtoken) {
			const payload = decodeJwt(atoken || rtoken);
			isSiginedIn = true;
			mids = payload.mids;
		}
	};

	const toggleSignUp = () => {
		isSignUp = !isSignUp;
	};

	const signIn = async () => {
		const result = await fetch(`/api/v1/users?key=${email}&pw=${password}`).then((r) => r.json());

		if (result.status === 200) {
			window.sessionStorage.setItem('atoken', result.body.atoken);
			window.sessionStorage.setItem('rtoken', result.body.rtoken);
			// goto(`/${result.body.mids[0]}`);
			checkTokens();
		} else alert('회원 정보를 확인해 주세요');
	};

	const signUp = async () => {
		// 이메일 유효성 검사
		if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
			isEmailError = true;
			return alert('이메일이 유효하지 않습니다.');
		}

		// 이메일 존재하는지 확인
		const user = await fetch(`/api/v1/users?key=${email}`).then((r) => r.json());
		if (user.ok) {
			isEmailError = true;
			return alert(`해당 이메일로 이미 가입된 회원이 있습니다.`);
		}

		// 패스워드 일치
		if (password !== password2) {
			isPasswordError = true;
			isPassword2Error = true;
			return alert(`암호가 암호 재입력과 일치하지 않습니다.`);
		}

		// 패스워드 4자 이상
		if (password.length < 4) {
			isPasswordError = true;
			isPassword2Error = true;
			return alert(`암호를 4자 이상으로 입력해 주세요.`);
		}

		// mid a-z,_,-유효성 검사
		if (!/^[0-9A-Za-z\-_]+$/.test(mid)) {
			isMidError = true;
			return alert(`메뉴 아이디는 영어, 숫자, 대시만 사용 가능합니다.`);
		}

		// mid 존재하는지 확인
		const menu = await fetch(`/api/v1/menus?key=${mid}`).then((r) => r.json());
		if (menu.ok) {
			isMidError = true;
			return alert(`해당 메뉴 아이디는 이미 존재합니다.`);
		}

		// TODO: 이메일 인증

		// users에 put
		const result = await fetch(`/api/v1/users?key=${email}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				password,
				mids: [mid]
			})
		}).then((r) => r.json());

		// a, r토큰 저장
		window.sessionStorage.setItem('atoken', result.body.atoken);
		window.sessionStorage.setItem('rtoken', result.body.rtoken);

		// menus에 put
		await fetch(`/api/v1/menus?key=${mid}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${result.body.atoken}`
			},
			body: JSON.stringify({
				title: { value: '' },
				headers: [],
				footers: [],
				groups: []
			})
		}).catch((error) => alert(error.message));

		// 가입 완료
		alert(`회원 가입 되었습니다.`);

		// goto /mid
		goto(`/${mid}`);
	};

	const signOut = () => {
		window.sessionStorage.removeItem('atoken');
		window.sessionStorage.removeItem('rtoken');
		isSiginedIn = false;
		mids = [];
	};
</script>

<svelte:head>
	<title>qqur.app</title>
</svelte:head>

<div class="py-9 px-6 space-y-9">
	<div class="text-center text-6xl font-bold font-mono">QQUR</div>
	<div class="text-center text-2xl">Beta version</div>
	<hr />
	{#if isSiginedIn === false}
		<div class="flex flex-col space-y-6">
			<input
				type="email"
				placeholder="이메일"
				class="font-extralight bg-stone-100 rounded-full p-3 px-5 border"
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
				class="font-extralight bg-stone-100 rounded-full p-3 px-5 border"
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
			{#if isSignUp === true}
				<input
					transition:fade
					type="password"
					placeholder="암호 재입력"
					class="font-extralight bg-stone-100 rounded-full p-3 px-5 border"
					class:border-red-400={isPassword2Error}
					class:text-red-400={isPassword2Error}
					bind:value={password2}
					on:focus={() => {
						if (isPassword2Error) {
							password = '';
							password2 = '';
							isPasswordError = false;
							isPassword2Error = false;
						}
					}}
				/>
				<input
					transition:fade
					type="text"
					placeholder="메뉴 아이디 (가입 이후 수정 가능)"
					class="font-extralight bg-stone-100 rounded-full p-3 px-5 border"
					class:border-red-400={isMidError}
					class:text-red-400={isMidError}
					bind:value={mid}
					on:focus={() => {
						if (isMidError) {
							mid = '';
							isMidError = false;
						}
					}}
				/>
			{/if}
			<input
				type="button"
				class="font-extralight h-12 rounded-full bg-black text-white px-3 cursor-pointer"
				value={isSignUp ? '회원가입' : '로그인'}
				on:click={() => {
					if (isSignUp) signUp();
					else signIn();
				}}
			/>
			<div class="font-extralight text-center">
				{isSignUp ? '이미 회원이세요?' : '뀨알이 처음이세요?'}
				<a on:click={toggleSignUp} class="cursor-pointer text-blue-500 font-medium"
					>{isSignUp ? '로그인' : '가입'}</a
				>하러 갈게요.
			</div>
		</div>
	{:else}
		<div class="text-center space-y-3">
			<div>로그인 되었습니다.</div>
			{#each mids as mid (mid)}
				<div>
					<span class="text-blue-500 cursor-pointer" on:click={() => goto(`/${mid}`)}>{mid}</span>
					메뉴 바로가기
				</div>
			{/each}
			<div class="text-center font-extralight">
				<a class="cursor-pointer text-blue-500 font-medium" on:click={signOut}>로그아웃</a>하기
			</div>
		</div>
	{/if}
	<hr />

	<div>
		<header>완전 무료입니다</header>
		<p>
			뀨알(QQUR)은 누구나 쉽게 메뉴판을 만들 수 있는 웹 서비스입니다. QR 코드를 통해 메뉴를
			확인하고, 메뉴판 업데이트도 간편합니다. 또한, 종이 메뉴판 출력도 가능하며, 서비스는 완전히
			무료입니다. 지금 바로 가입해서 편리하고 심플한 메뉴판 제작을 경험해보세요!
		</p>
	</div>

	<div class="text-right">
		<div><a href="https://github.com/misa-lili/qqur">https://github.com/misa-lili/qqur</a></div>
		<div><a href="mailto:kyom@misalili.com?subject=[qqur]">kyom@misalili.com</a></div>
	</div>
</div>

<style>
	body {
		@apply bg-gray-200 p-8;
	}

	header {
		@apply text-center py-4 text-2xl font-bold;
	}

	p {
		@apply leading-7 mb-6;
	}
</style>
