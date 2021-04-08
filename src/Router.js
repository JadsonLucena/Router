class Router {

	#isURL;

	#routers;

	constructor() {

		this.#isURL = new RegExp(
			'^('+
				'('+
					'('+
						'(https?:\\/\\/)?'+ // protocol
						'([^:\\s]+:[^@\\s]+@)?'+ // auth
						'('+
							'([a-z\\d]([a-z\\d-]*[a-z\\d])?\\.)+[a-z]{2,}'+ // host
							'|'+ // OR
							'\\d{1,3}(\\.\\d{1,3}){3}'+ // ip (v4) address
						')'+
						'(:\\d+)?'+ // port
					')'+
					'((\\.{1,2})?(\\/[^\\/\\?#\\s]+)*\\/?)?'+ // pathname
				')'+ // origin + pathname
				'|'+
				'((\\.{1,2})?(\\/[^\\/\\?#\\s]+)*\\/?)'+ // pathname only
			')'+
			'(\\?([^=\\s]+\\=[^&#\\s]*)*)?'+ // search
			'(#([a-z][a-z\\d\\._-]*)*)?$'  // hash
		, 'i');

		this.#routers = {};


		window.onpopstate = e => e.state && this.load(e.state);

	}


	get routers () { return Object.keys(this.#routers).reverse(); }


	async #loadContents(key) {

		if (this.#routers[key].place && typeof this.#routers[key].place == 'string') {

			let place = document.querySelector(this.#routers[key].place);

			if (place) {

				for (let content of this.#routers[key].contents.filter(e => e)) {

					if (this.#isURL.test(content)) {

						await fetch(content).then(async response => {

							if (response.ok) {

								await response.text().then(text => {

									place.insertAdjacentHTML('beforeend', text);

								}).catch(console.error);

							} else {

								console.error(response);

							}

						}).catch(console.error);

					} else if (typeof content == 'string') {

						place.insertAdjacentHTML('beforeend', content);

					} else {

						place.append(content);

					}

				}

			} else {

				throw 'HTMLElement not found';

			}

		} else if (this.#routers[key].contents.filter(e => e).length) {

			throw 'Place not allowed';

		}

	}

	#loadScripts(key) {

		return this.#routers[key].scripts.contents.filter(e => e && typeof e == 'string').map(script => {

			let js = document.createElement('script');

			if (this.#isURL.test(script)) {

				let url = new URL(script, location.href);

				url.searchParams.forEach((value, key) => js.setAttribute(key, value));

				js.onerror = console.error;

				js.src = url.host == location.host ? url.pathname : url.host + url.pathname;

			} else {

				js.textContent = script;

			} 

			document.documentElement.append(js);

			return js;

		});

	}

	#loadStyles(key) {

		return Promise.all(this.#routers[key].styles.contents.filter(e => e && typeof e == 'string').map(async style => {

			return new Promise(resolve => {

				if (this.#isURL.test(style)) {

					let url = new URL(style, location.href);

					let css = document.createElement('link');
						css.rel = 'stylesheet';

						url.searchParams.forEach((value, key) => css.setAttribute(key, value));

						css.onload = () => resolve(css);
						css.onerror = () => resolve(css);

						css.href = url.host == location.host ? url.pathname : url.host + url.pathname;

					document.head.append(css);

				} else {

					let css = document.createElement('style');
						css.textContent = style;

					document.head.append(css);

					resolve(css);

				}

			}).catch(console.error);

		}));

	}

	async #pageBuild(key) {

		this.#routers[key].styles.elements = await this.#loadStyles(key).catch(console.error);

		await this.#loadContents(key);

		this.#routers[key].scripts.elements = this.#loadScripts(key);

	}

	async load({
		contents = [],
		place = null,
		scripts = [],
		styles = [],
		title = null
	} = {}) {

		if (title)
			document.title = title;


		let key = (() => { // UUID

			let randomHex = size => Math.round(Math.random() * (Number.MAX_SAFE_INTEGER - Math.pow(2, 4 * size)) + Math.pow(2, 4 * size)).toString(16).slice(size * -1);

			return randomHex(8) + '-' + randomHex(4) + '-' + randomHex(4) + '-' + randomHex(4) + '-' + randomHex(12);

		})();


		this.#routers[key] = {
			contents: (typeof contents == 'string') ? [contents] : contents,
			place: place,
			scripts: { contents: (typeof scripts == 'string') ? [scripts] : scripts, elements: [] },
			styles: { contents: (typeof styles == 'string') ? [styles] : styles, elements: [] },
			title: title
		};


		await this.#pageBuild(key);


		return key;

	}

	async redirect(path, title, {
		contents = [],
		place = null,
		replace = false,
		scripts = [],
		styles = []
	} = {}) {

		// if (typeof path != 'string') {

		// 	throw 'Path not allowed';

		// } else if (typeof title != 'string') {

		// 	throw 'Title not allowed';

		// } else {

			let state = {
				'contents': contents,
				'place': place,
				'scripts': scripts,
				'styles': styles,
				'title': title
			};


			if (replace)
				history.replaceState(state, title, path);
			else
				history.pushState(state, title, path);


			return await this.load(state);

		// }

	}

	remove(key = null) {

		if (key) {
			
			if (!(key in this.#routers)) {

				// throw 'Is not declared';
				return null;

			}

		} else {

			let keys = Object.keys(this.#routers);

			if (keys.length) {

				key = keys.pop();

			} else {

				// throw 'Does not exist';
				return null;

			}

		}


		this.#routers[key].scripts.elements.forEach(script => script.remove());

		if (this.#routers[key].place && typeof this.#routers[key].place == 'string') {

			let place = document.querySelector(this.#routers[key].place);

			if (place)
				place.innerHTML = '';

		}

		this.#routers[key].styles.elements.forEach(style => style.remove());

		return delete this.#routers[key];

	}

};