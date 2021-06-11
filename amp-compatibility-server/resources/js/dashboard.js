/* globals Chart:false, feather:false */
'use strict';

import $ from 'jquery';
import { Collapse } from 'bootstrap';

window.$ = window.jQuery = $;

window.addEventListener( 'DOMContentLoaded', function () {
	const dashboard = {
		init: function () {

			this.searchFilters = document.getElementById('search-filters');
			this.searchField = document.querySelector('.search-toolbar [type="search"]');
			this.searchToolbarWrapper = document.querySelector('.search-toolbar');

			this.bindEvents();
			this.copyToClipboard();

			if ( this.searchField && this.searchField.value.trim().length ) {
				this.searchToolbarWrapper.classList.add( 'has-value' );
			}

			$( '[data-chart]' ).each( ( index, element ) => {
				this.initializeChart( element );
			} );

		},

		bindEvents: function () {

			if ( this.searchFilters ) {
				this.collapsibleFilters = new Collapse(this.searchFilters, {
					toggle: false,
				});

				document.addEventListener( 'click', ( event ) => this.handlePageClick(event) );
			}

			if ( this.searchField ) {
				this.searchField.addEventListener( 'change', ( event ) => this.handleChange(event) );
			}

			/**
			 * Handle sorting of the table.
			 */
			const sortButtons = document.querySelectorAll( '.btn-table-sort' );
			sortButtons.forEach( ( sortButton ) => {
				sortButton.addEventListener( 'click', this.onSortButtonClick );
			} );
		},

		onSortButtonClick: function ( event ) {

			const orderBy = this.dataset.orderBy;
			let currentOrder = this.dataset.order || 'none';
			currentOrder = currentOrder.toLowerCase();

			const newOrderMapping = {
				none: 'DESC',
				desc: 'ASC',
				asc: 'none',
			};

			const urlParams = new URLSearchParams( window.location.search );

			if ( 'none' === newOrderMapping[ currentOrder ] ) {
				urlParams.delete( `sort[${ orderBy }]` );
			} else {
				urlParams.set( `sort[${ orderBy }]`, newOrderMapping[ currentOrder ] );
			}


			window.location.search = urlParams.toString();

		},

		/**
		 * Keep the search field background if user has added value.
		 *
		 * @param {*} event
		 */
		handleChange: function( event ) {
			if ( event.target.value.trim().length ) {
				this.searchToolbarWrapper.classList.add( 'has-value' );
			} else {
				this.searchToolbarWrapper.classList.remove( 'has-value' );
			}
		},

		/**
		 * Collapse search filters drawer if clicker outside.
		 *
		 * @param {*} event
		 */
		handlePageClick: function( event ) {
			const target = event.target;

			if( !$( target ).parents('#search-filters').length ) {
				this.collapsibleFilters.hide();
			}
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

			switch ( chartType ) {
				case 'pie':
				case 'doughnut':
					this._initializePieChart( element );
					break;
				case 'bar':
					this._initializeBarChart( element );
					break;
			}

		},

		/**
		 * To get config for chart by element.
		 *
		 * @private
		 *
		 * @param {DOMElement} element Dom element object.
		 *
		 * @return void
		 */
		_getChartConfig: function ( element ) {
			const chartType = element.dataset.chartType || '';
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

			const chartData = {
				labels: labels,
				datasets: [
					{
						data: values,
						backgroundColor: [
							'rgba(26, 115, 232, 1)',
							'rgba(213, 0, 0, 1)',
							'rgba(242, 166, 0, 1)',
							'rgba(11, 128, 67, 1)',
							'rgba(171, 71, 188, 1)',
							'rgba(0, 172, 193, 1)',
							'rgba(255, 112, 67, 1)',
							'rgba(63, 81, 181, 1)',
							'rgba(0,0,0,.54)',
						],
						borderColor: [
							'rgba(26, 115, 232, 1)',
							'rgba(213, 0, 0, 1)',
							'rgba(242, 166, 0, 1)',
							'rgba(11, 128, 67, 1)',
							'rgba(171, 71, 188, 1)',
							'rgba(0, 172, 193, 1)',
							'rgba(255, 112, 67, 1)',
							'rgba(63, 81, 181, 1)',
							'rgba(0,0,0,.54)',
						],
						borderWidth: 1,
					},
				],
			};

			return {
				type: chartType,
				data: chartData,
			};
		},

		/**
		 * To initialize pie chart.
		 *
		 * @private
		 *
		 * @param {DOMElement} element Dom element object.
		 *
		 * @return void
		 */
		_initializePieChart: function ( element ) {

			const chartConfig = this._getChartConfig( element );
			const chart = new Chart( element, chartConfig );
			element.chart = chart;
		},

		/**
		 * To initialize bar chart.
		 *
		 * @private
		 *
		 * @param {DOMElement} element Dom element object.
		 *
		 * @return void
		 */
		_initializeBarChart: function ( element ) {

			const chartConfig = this._getChartConfig( element );

			chartConfig.options = {
				plugins: {
					legend: false,
				},
				indexAxis: 'y',
			};
			const chart = new Chart( element, chartConfig );
			element.chart = chart;
		},
	};

	dashboard.init();
} );
