class Router {

	#isURL;

	#routers;

	constructor() {

		this.#isURL = new RegExp(
			'^('+
				'(https?:\\/\\/)?'+ // protocol
				'('+
					'([a-z\\d]([a-z\\d-]*[a-z\\d])?\\.)+[a-z]{2,}'+ // host
					'|'+ // OR
					'\\d{1,3}(\\.\\d{1,3}){3}'+ // ip (v4) address
				')'+
				'(\\:\\d+)?'+ // port
			')?'+
			'((\\.{1,2})?(\\/[^\\/\\?#]+)*\\/?)?'+ // pathname
			'(\\?([^=]+\\=[^&#]*)*)?'+ // search
			'(#([a-z][a-z\\d\\._-]*)*)?$'  // hash
		, 'i');

		this.#routers = {};

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

};