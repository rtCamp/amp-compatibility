// Imports the Google Cloud client library
const { BigQueryClient } = require( './bigqueryclient' );

const config = {
	projectId: 'test-amp-comp-db',
	dataset: 'wp_amp_db_comp_er2',
	keyFilename: __dirname + '/config/test-amp-comp-db-4fc0fcc052c7.json',
};

exports.bigquery = new BigQueryClient( config );
