const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const app = express();
const { bigquery } = require( './bigquery' );
const { getCurrentDateTime } = require( './utils' );

/**
 * bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use( bodyParser.urlencoded( {
	limit: '50mb',
	extended: true
} ) );

/**
 * bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use( bodyParser.json( { limit: '50mb' } ) );

app.post( '/amp-data/', async ( request, response ) => {
	response.setHeader( 'Content-Type', 'application/json' );
	response.end( JSON.stringify( { status: 'success' } ) );

	const body = request.body;
	const datetime = getCurrentDateTime();

	const query = bigquery.getInsertQuery( 'request_queue', {
		site_url: body.site_url,
		request_data: JSON.stringify( body ),
		date_time: datetime,
		is_processed: false
	} );

	const result = await bigquery.query( query );

	console.log( body.site_url, datetime, result );
} );

app.get( '/', function ( request, response ) {
	response.send( '<h1>Application is working</h1>' );
} );


app.listen( 3000, function () {
	console.log( 'server is running on port http://localhost:3000/' );
} );
