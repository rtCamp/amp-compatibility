/* globals Chart:false, feather:false */
'use strict';

import $ from 'jquery';
import * as mdb from 'mdb-ui-kit';
import bootstrap from 'bootstrap';

window.$ = window.jQuery = $;

window.addEventListener( 'DOMContentLoaded', function () {
	const dashboard = {
		init: function () {

			this.copyToClipboard();

			$( '[data-chart]' ).each( ( index, element ) => {
				this.initializeChart( element );
			} );

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

		/**
		 * To initialize the chart for element.
		 *
		 * @param element
		 */
		initializeChart: function ( element ) {

			const chartType = element.dataset.chartType || '';
			const chartTitle = element.dataset.chartTitle || '';
			let data = element.dataset.chartData || '{}';

			data = JSON.parse( data );
			const labels = [];
			const values = [];

			for ( const index in data ) {
				const label = data[ index ].label || '';
				const value = data[ index ].value || 0;

				if ( label ) {
					labels.push( label );
					values.push( value );
				}
			}

			const chart = new Chart( element, {
				type: chartType,
				data: {
					labels: labels,
					datasets: [
						{
							label: chartTitle,
							data: values,
							backgroundColor: [
								'rgba(63, 81, 181, 0.2)',
								'rgba(220, 53, 69, 0.2)',
								'rgba(25, 118, 210, 0.2)',
								'rgba(255, 193, 7, 0.2)',
								'rgba(75, 192, 192, 0.2)',
								'rgba(153, 102, 255, 0.2)',
								'rgba(255, 159, 64, 0.2)',
							],
							borderColor: [
								'rgb(63, 81, 181, 1)',
								'rgb(220, 53, 69, 1)',
								'rgba(25, 118, 210, 1)',
								'rgba(255, 193, 7, 1)',
								'rgba(75, 192, 192, 1)',
								'rgba(153, 102, 255, 1)',
								'rgba(255, 159, 64, 1)',
							],
							borderWidth: 1,
						},
					],
				},
			} );

			element.chart = chart;

		},
	};

	dashboard.init();
} );