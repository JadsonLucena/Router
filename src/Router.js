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

};