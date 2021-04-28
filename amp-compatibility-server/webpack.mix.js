const mix = require( 'laravel-mix' );

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js( 'resources/js/app.js', 'public/js' )
	.sass( 'resources/scss/style.scss', 'public/css' )
	.js( 'resources/js/dashboard.js', 'public/js' )
	.sass( 'resources/scss/dashboard.scss', 'public/css' )
	.js( 'resources/js/adhoc-requests.js', 'public/js')
	.js( 'resources/js/verify-extensions.js', 'public/js')
	.js( 'resources/js/extension.js', 'public/js')
	.js( 'resources/js/queue-table.js', 'public/js')
	.copy( 'resources/images', 'public/images' );
