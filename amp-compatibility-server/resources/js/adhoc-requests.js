window.addEventListener( 'DOMContentLoaded', function ( event ) {
	let addAdhocSyntheticData = {

		pluginRowCounter: 1,

		init: function () {

			this.preparePluginRow();
			this.prepareThemeRow();

			/**
			 * Events.
			 */
			$( '[name="amp_source"]' ).on( 'change', this.onAMPSourceChange );
			$( document ).on( 'click', '.dropdown-item', this.onDropdownItemClick );
			$( '#addNewPlugin' ).on( 'click', () => {
				this.onAddNewPluginClick();
			} );

		},

		/**
		 * Callback function of change event of amp plugin source.
		 *
		 * @return void
		 */
		onAMPSourceChange: function () {

			const ampSource = $( this ).val();

			if ( 'other' === ampSource ) {
				$( '#amp_source_url' ).removeAttr( 'disabled' );
			} else {
				$( '#amp_source_url' ).attr( 'disabled', 'true' );
			}

		},

		/**
		 * Callback function of version dropdown item click event.
		 *
		 * @return void
		 */
		onDropdownItemClick: function () {

			const version = $( this ).data( 'value' );

			$( this ).parents( '.dropdown' ).find( '.hiddenThemeVersion' ).val( version );
			$( this ).parents( '.dropdown' ).find( '.hiddenPluginVersion' ).val( version );
			$( this ).parents( '.dropdown' ).find( 'button' ).text( $( this ).text() );
		},

		/**
		 * callback function of add new plugin button click event.
		 *
		 * @return void
		 */
		onAddNewPluginClick: function () {
			this.pluginRowCounter++;

			this.removeDuplicatePlugins();

			let clonedItem = $( '#pluginClone' ).clone();

			clonedItem.removeAttr( 'id' );
			clonedItem.removeClass( 'd-none' );

			$( '#plugin-name', clonedItem ).attr( 'name', `plugins[${ this.pluginRowCounter }][name]` ).removeAttr( 'id' );
			$( '#plugin-version', clonedItem ).attr( 'name', `plugins[${ this.pluginRowCounter }][version]` ).removeAttr( 'id' );

			$( '#plugin-list' ).append( clonedItem );
			this.preparePluginRow();
		},

		/**
		 * Remove duplicate plugins.
		 *
		 * @return void
		 */
		removeDuplicatePlugins: function () {
			let nodesList = {};
			$( '.plugin-autocomplete' ).each( function () {
				let nodeLength = $( '.plugin-autocomplete' ).length;
				let innerValue = $( this ).val();
				( nodeLength > 2 && nodesList[ innerValue ] ) ?
					$( this ).parent().remove() : nodesList[ innerValue ] = true;
			} );
		},

		/**
		 * Prepare plugins row.
		 *
		 * @return void
		 */
		preparePluginRow: function () {
			$( '.plugin-autocomplete' ).autocomplete( {
				minLength: 3,
				source: ( request, response ) => {
					const searchTerm = request.term;

					$.getJSON( `/admin/extensions/search/?type=plugin&s=${ searchTerm }`, ( httpResponse ) => {

						if ( 'ok' === httpResponse.status ) {
							const extensionSlugs = [];
							for ( const index in httpResponse.data ) {
								extensionSlugs.push( {
									value: httpResponse.data[ index ].slug,
									label: httpResponse.data[ index ].name,
									versions: httpResponse.data[ index ].versions,
								} );
							}
							response( extensionSlugs );
						}
					} );
				},
				select: ( event, ui ) => {
					const versions = ui.item.versions || [];
					const dropDownElement = $( event.target ).siblings().find( '.plugin-dropdown' );

					$( dropDownElement ).html( '' );
					$( dropDownElement ).append( `<li><a class="dropdown-item" data-value="" href="#">Latest Version</a></li>` );

					versions.map( ( data ) => {
						$( dropDownElement ).append( `<li><a class="dropdown-item" data-value="${ data }" href="#">${ data }</a></li>` );
					} );

				},
			} );

			$( '.btn-remove-plugin' ).on( 'click', function () {
				let removeButtons = $( '#plugin-list' ).find( '.btn-remove-plugin' ).length;
				( removeButtons > 2 ) ? $( this ).parent( '.plugin-item' ).remove() : null;
			} );

		},

		/**
		 * To Prepare theme row.
		 *
		 * @return void
		 */
		prepareThemeRow: function () {

			$( '.theme-autocomplete' ).autocomplete( {
				minLength: 3,
				source: ( request, response ) => {
					const searchTerm = request.term;

					$.getJSON( `/admin/extensions/search/?type=theme&s=${ searchTerm }`, ( httpResponse ) => {

						if ( 'ok' === httpResponse.status ) {
							const extensionSlugs = [];
							for ( const index in httpResponse.data ) {
								extensionSlugs.push( {
									value: httpResponse.data[ index ].slug,
									label: httpResponse.data[ index ].name,
									versions: httpResponse.data[ index ].versions,
								} );
							}
							response( extensionSlugs );
						}
					} );
				},
				select: ( event, ui ) => {
					const versions = ui.item.versions || [];
					const dropDownElement = $( event.target ).siblings().find( '.theme-dropdown' );

					$( dropDownElement ).html( '' );
					$( dropDownElement ).append( `<li><a class="dropdown-item" data-value="" href="#">Latest Version</a></li>` );

					versions.map( ( data ) => {
						$( dropDownElement ).append( `<li><a class="dropdown-item" data-value="${ data }" href="#">${ data }</a></li>` );
					} );

				},
			} );
		},

	};

	addAdhocSyntheticData.init();

} );
