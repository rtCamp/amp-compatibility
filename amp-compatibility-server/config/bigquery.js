'use strict';

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use( 'Env' );

module.exports = {
	projectId: Env.get( 'BIGQUERY_PROJECT_ID', '' ),
	dataset: Env.get( 'BIGQUERY_DATASET', '' ),
	keyFilename: Env.get( 'BIGQUERY_KEY_FILENAME', '' ),
};
