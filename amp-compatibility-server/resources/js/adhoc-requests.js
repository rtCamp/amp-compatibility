window.addEventListener( 'DOMContentLoaded', function ( event ) {
	let addAdhocSyntheticData = {

		pluginRowCounter: 1,

		init: function () {

			/* makes drop down function */
			$( document ).on( 'click', '.dropdown-item', function () {

				/* updates the hidden value of verions */
				$( this ).parents( '.dropdown' ).find( '.hiddenThemeVersion' ).val( $( this ).text() );
				$( this ).parents( '.dropdown' ).find( '.hiddenPluginVersion' ).val( $( this ).text() );

				/* updates drop down button value */
				$( this ).parents( '.dropdown' ).find( 'button' ).text( $( this ).text() );
			} );

			this.pluginsData = [];
			this.themeData = [];

			/* fetch data for plugins autocomplete */
			$.getJSON( "/data/wporg_mapping/plugins.json", [], ( data, status, xhr ) => {

				for ( const index in data ) {
					this.pluginsData.push( data[ index ].slug );
				}

				this.preparePluginRow();
			} );

			/* fetch data for themes autocomplete */
			$.getJSON( "/data/wporg_mapping/themes.json", [], ( data, status, xhr ) => {
				for ( const index in data ) {
					this.themeData.push( data[ index ].slug );
				}

				this.themeAutocomplete();
			} );

			/* add new plugin button */
			$( '#addNewPlugin' ).on( 'click', () => {

				/* duplicate plugin removal */
				this.removeDuplicatePlugins();

				this.pluginRowCounter++;

				let clonedItem = $( '#pluginClone' ).clone();

				clonedItem.removeAttr( 'id' );
				clonedItem.removeClass( 'd-none' );

				$( '#plugin-name', clonedItem ).attr( 'name', `plugins[${ this.pluginRowCounter }][name]` ).removeAttr( 'id' );
				$( '#plugin-version', clonedItem ).attr( 'name', `plugins[${ this.pluginRowCounter }][version]` ).removeAttr( 'id' );

				$( '#plugin-list' ).append( clonedItem );
				this.preparePluginRow();
			} );

		},

		/* duplicate plugin removal code */
		removeDuplicatePlugins: function () {
			let nodesList = {};
			$( '.plugin-autocomplete' ).each( function () {
				let nodeLength = $( '.plugin-autocomplete' ).length;
				let innerValue = $( this ).val();
				( nodeLength > 2 && nodesList[ innerValue ] ) ?
					$( this ).parent().remove() : nodesList[ innerValue ] = true;
			} );
		},

		/* fetch plugin name and add remove button */
		preparePluginRow: function () {
			let pluginSrc = this.pluginsData;
			jQuery( '.plugin-autocomplete' ).autocomplete( {
				minLength: 3,
				source: function ( request, response ) {
					let results = $.ui.autocomplete.filter( pluginSrc, request.term );
					response( results.slice( 0, 10 ) );
				},
			} );

			jQuery( '.btn-remove-plugin' ).on( 'click', function () {
				let removeButtons = $( '#plugin-list' ).find( '.btn-remove-plugin' ).length;
				( removeButtons > 2 ) ? $( this ).parent( '.plugin-item' ).remove() : null;
			} );

		},

		/* fetch theme names */
		themeAutocomplete: function () {
			let themeSrc = this.themeData;
			jQuery( '.theme-autocomplete' ).autocomplete( {
				minLength: 3,
				source: function ( request, response ) {
					let results = $.ui.autocomplete.filter( themeSrc, request.term );
					response( results.slice( 0, 20 ) );
				},
			} );
		},

		/* fetch theme versions */
		fetchThemeVersions: function () {
			$( '.theme-autocomplete' ).on( 'focusout', function () {

				/* update the drop down with new versions */
				$.getJSON( "/data/wporg_mapping/themes.json", [], ( data, status, xhr ) => {
					$( this ).siblings().find( '.theme-dropdown' ).html( "" );
					for ( const index in data ) {
						const parent = $( this ).val();
						if ( "" !== parent && data[ index ].name === parent ) {
							data[ index ].versions.map( ( data, index ) => {
								$( this ).siblings().find( '.theme-dropdown' )
										 .append( '<li><a class="dropdown-item" href="#">' + data + '</a></li>' );
							} );
						}
					}
				} );
			} );
		},

		/* fetch plugin versions */
		fetchPluginVersions: function () {
			$( document ).on( 'focusout', '.plugin-autocomplete', function () {

				/* update the drop down with new versions */
				$.getJSON( "/data/wporg_mapping/plugins.json", [], ( data, status, xhr ) => {

					/* duplicate plugin removal */
					addAdhocSyntheticData.removeDuplicatePlugins();

					$( this ).siblings().find( '.plugin-dropdown' ).html( "" );
					for ( const index in data ) {
						const parent = $( this ).val();
						if ( "" !== parent && data[ index ].name === parent ) {
							data[ index ].versions.map( ( data, index ) => {
								$( this ).siblings().find( '.plugin-dropdown' )
										 .append( '<li><a class="dropdown-item" href="#">' + data + '</a></li>' );
							} );
						}
					}
				} );
			} );
		},
	};
	addAdhocSyntheticData.init();
	addAdhocSyntheticData.fetchThemeVersions();
	addAdhocSyntheticData.fetchPluginVersions();
} );
