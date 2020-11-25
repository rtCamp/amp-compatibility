const { getThemesList } = require( "@rtcamp/wporg-api-client" );
const fs = require( 'fs' );

const generateThemeJson = async () => {
	try {
		let filePath = 'data/themes.json';
		let responseData = await getThemesList();
		let totalPages = responseData.data.info.pages;
		let themes = responseData.data.themes;
		let finalThemeSlugs = [];
		let themeSlugs = [];

		totalPages = 10;

		for ( let i = 1; i <= totalPages; i ++ ) {

			let filter = {
				page: i,
			};

			responseData = await getThemesList( filter );
			themes = responseData.data.themes;

			themeSlugs = themes.map( theme => theme.slug );

			finalThemeSlugs = [ ...finalThemeSlugs, ...themeSlugs ];

			console.log( 'Theme Page: ' + i );
		}

		fs.writeFileSync( filePath, JSON.stringify( finalThemeSlugs ) );

	} catch ( error ) {
		console.log( error.message, "error" );
	}
};

generateThemeJson();