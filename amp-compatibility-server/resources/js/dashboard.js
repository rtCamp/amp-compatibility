/* globals Chart:false, feather:false */
'use strict';

import $ from 'jquery';

window.$ = window.jQuery = $;
import bootstrap from 'bootstrap';

window.addEventListener( 'DOMContentLoaded', function () {
	const dashboard = {
		init: function () {

			this.copyToClipboard();
		},

		copyToClipboard: function () {

			$( '[data-copy-text]' ).click( function () {

				const textArea = document.createElement( "textarea" );
				document.body.appendChild( textArea );
				textArea.value = this.dataset.copyText || '';
				textArea.select();

				let status = false;

				try {
					status = document.execCommand( 'copy' );
				} catch ( err ) {
				}

				document.body.removeChild( textArea );

				const originalText = this.textContent;
				this.textContent = status ? 'Copied' : 'Failed';

				setTimeout( () => {
					this.textContent = originalText;
				}, 5000 );

			} );

		},
	};

	dashboard.init();
} );