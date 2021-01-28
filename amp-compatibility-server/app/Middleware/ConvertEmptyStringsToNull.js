'use strict';

class ConvertEmptyStringsToNull {
	async handle( { request }, next ) {
		if ( Object.keys( request.body ).length ) {
			request.body = Object.assign(
				...Object.keys( request.body ).map( key => (
					{
						[ key ]: request.body[ key ] !== '' ? request.body[ key ] : null,
					}
				) ),
			);
		}


		const Exception = use('Exception')
		const Logger = use('Logger')

		Exception.handle('InvalidSessionException', async (error, { request, response, session }) => {
			Logger.error(error)
			Logger.info(session.all())

			const dest = request.url()
			Logger.info(dest)
			session.put('original-destination', dest)

			// redirect to login
			return response.redirect('/login', 302)
		})

		await next();
	}
}

module.exports = ConvertEmptyStringsToNull;
