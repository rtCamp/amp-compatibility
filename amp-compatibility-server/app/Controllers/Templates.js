'use strict';

const View = use( 'View' );

const _ = require( 'underscore' );

class Templates {

	/**
	 * Helper function to render pagination.
	 *
	 * @param {Object} options
	 *
	 * @return {string|*} HTML markup  for pagination.
	 */
	static renderPagination( options ) {

		if ( ! options.total || ! options.perPage || ! options.baseUrl ) {
			return '';
		}

		options.currentPage = parseInt( options.currentPage ) || 1;
		options.totalPage = Math.ceil( options.total / options.perPage );

		if ( 1 >= options.totalPage ) {
			return '';
		}

		options.nextPage = ( options.currentPage < options.totalPage ) ? options.currentPage + 1 : false;
		options.previousPage = ( 1 < options.currentPage ) ? options.currentPage - 1 : false;

		options.showLimit = 2;
		options.showPages = {
			from: ( 1 <= options.currentPage - options.showLimit ) ? options.currentPage - options.showLimit : 1,
			to: ( options.totalPage >= ( options.currentPage + options.showLimit ) ) ? options.currentPage + options.showLimit : options.totalPage,
		};

		options.showPreviousPadding = ( options.showLimit < options.currentPage - 1 );
		options.showNextPadding = ( options.totalPage > ( options.currentPage + options.showLimit ) );

		return View.render( 'templates/pagination', options );
	}

	static renderTable( args ) {

		if ( _.isEmpty( args ) || ! _.isObject( args ) ) {
			return '';
		}

		return View.render( 'templates/table', args );
	}

	static renderComponent( name, args ) {

		if ( _.isEmpty( name ) || _.isEmpty( args ) || ! _.isObject( args ) ) {
			return '';
		}

		return View.render( `templates/${ name }`, args );
	}

}

module.exports = Templates;