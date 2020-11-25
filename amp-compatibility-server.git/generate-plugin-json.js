const { getPluginsList } = require( "@rtcamp/wporg-api-client" );
const fs = require( 'fs' );

const generatePluginJson = async () => {
	try {

		let filePath = 'data/plugins.json';
		let responseData = await getPluginsList();
		let totalPages = responseData.data.info.pages;
		let plugins = responseData.data.plugins;
		let finalPluginSlugs = [];
		let pluginSlugs = [];

		totalPages = 10;

		for ( let i = 1; i <= totalPages; i ++ ) {

			let filter = {
				page: i,
			};

			responseData = await getPluginsList( filter );
			plugins = responseData.data.plugins;

			pluginSlugs = plugins.map( plugin => plugin.slug );

			finalPluginSlugs = [ ...finalPluginSlugs, ...pluginSlugs ];

			console.log( 'Plugin Page: ' + i );
		}

		fs.writeFileSync( filePath, JSON.stringify( finalPluginSlugs ) );

	} catch ( error ) {
		console.log( error.message, "error" );
	}

};

generatePluginJson();
