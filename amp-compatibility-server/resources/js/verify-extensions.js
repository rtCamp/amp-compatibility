window.addEventListener( 'DOMContentLoaded', function () {
	const verifyExtensions = {

		/**
		 * Init function.
		 *
		 * @return void
		 */
		init: function () {

			const checkboxes = document.querySelectorAll( '.extension-verify-checkbox' );

			checkboxes.forEach( ( checkbox ) => {
				checkbox.addEventListener( 'change', this.onCheckboxChange );
			} );

		},

		/**
		 * Callback function of checkbox change event.
		 * To update extension verification mark.
		 *
		 * @return void
		 */
		onCheckboxChange: function () {

			const parent = jQuery( this ).parents( 'tr' );
			let extensionDetail = jQuery( parent ).attr( 'data-extension' );
			extensionDetail = JSON.parse( extensionDetail ) || {};
			const isVerified = !! this.checked;

			if ( ! extensionDetail.extension_version_slug ) {
				return;
			}

			this.disabled = true;

			jQuery.post( '/admin/verify-extensions', {
				extensionVersionSlug: extensionDetail.extension_version_slug,
				isVerified: isVerified,
			}, ( data ) => {

				const messageContainer = document.getElementById( 'messageContainer' );
				const messageElement = document.createElement( 'p' );

				if ( 'ok' === data.status ) {
					messageElement.classList.add( 'text-success' );
					messageElement.innerText = `Extension "${ extensionDetail.name } - ${ extensionDetail.version }" successfully marked as `;
					messageElement.innerText += ( isVerified ? '"Verified"' : '"Not Verified"' );
				} else {
					messageElement.classList.add( 'text-danger' );
					messageElement.innerText = `Failed to mark "${ extensionDetail.name } - ${ extensionDetail.version }"`;
				}

				this.disabled = false;

				messageContainer.append( messageElement );

				setTimeout( () => {
					messageContainer.removeChild( messageElement );
				}, 10000 );
			} );

		},

	};

	verifyExtensions.init();
} );
