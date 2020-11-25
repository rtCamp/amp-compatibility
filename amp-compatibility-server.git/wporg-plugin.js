const { getPluginsList } = require( "@rtcamp/wporg-api-client" );
const _ = require( 'lodash' );
const stripHtml = require( 'string-strip-html' );
const { bigquery } = require( './bigquery' );

const fetchPluginsList = async () => {

	try {
		let responseData = await getPluginsList();
		let totalPages = responseData.data.info.pages;
		let plugins = {};

		totalPages = 5;

		for ( let i = 3; i <= totalPages; i++ ) {

			let filter = {
				page: i,
			};

			responseData = await getPluginsList( filter );
			const plugins = responseData.data.plugins;

			for ( let key in plugins ) {

				const plugin = plugins[ key ];

				await insertPlugin( plugin );

			}
		}

	} catch ( error ) {
		console.log( error.message, "error" );
	}
};


const insertPlugin = async ( data ) => {

	data.tags = data.tags || {};

	const slug = `plugin-${ data.slug }-${ data.version }`;
	const sourceData = {
		UUID: '',
		slug: slug,
		title: data.name,
		name: data.slug,
		version: data.version,
		type: 'plugin',
		requires_wp: data.requires || '',
		requires_php: data.requires_php || '',
		source: 'wporg',
	};

	const meta_data = {
		tested: data.tested,
		rating: data.rating,
		num_ratings: data.num_ratings,
		ratings_1: data.ratings[ 1 ],
		ratings_2: data.ratings[ 2 ],
		ratings_3: data.ratings[ 3 ],
		ratings_4: data.ratings[ 4 ],
		ratings_5: data.ratings[ 5 ],
		wp_active_install: data.active_installs,
		downloaded: data.downloaded,
	};

	let query = bigquery.getInsertQuery( 'source_code', sourceData );

	for ( let meta_key in meta_data ) {


		if ( meta_data[ meta_key ] ) {

			const sourceMeta = {
				UUID: '',
				source_code_slug: slug,
				meta_key: meta_key,
				meta_value: meta_data[ meta_key ].toString(),
			};
			query += "\n" + bigquery.getInsertQuery( 'source_code_meta', sourceMeta );

		}

	}

	for ( let tag in data.tags ) {
		const sourceMeta = {
			UUID: '',
			source_code_slug: slug,
			meta_key: 'tag',
			meta_value: tag.toString(),
		};

		query += "\n" + bigquery.getInsertQuery( 'source_code_meta', sourceMeta );
	}

	const result = await bigquery.query( query );

	console.log( `Plugin ${ slug } :`, result, query );


};


const stripHTML = ( html ) => {
	return stripHtml( html ).result;
};

