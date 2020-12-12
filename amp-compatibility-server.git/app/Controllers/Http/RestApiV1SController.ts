// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class RestApiV1SController {

	/**
	 * API endpoint callback.
	 *
	 * @method GET
	 *
	 * @return object Response data.
	 */
	public async index() {
		return {status: 'ok'};
	}

	/**
	 * API endpoint callback.
	 *
	 * @method POST
	 *
	 * @return object Response data.
	 */
	public async store({ request }) {

		console.log(request.all());

		return {status: 'ok'};
	}

}
