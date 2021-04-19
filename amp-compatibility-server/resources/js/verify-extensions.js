window.addEventListener( 'DOMContentLoaded', function () {
	const verifyExtensions = {

		/**
		 * Init function.
		 *
		 * @return void
		 */
		init: function () {

			const checkboxes = document.querySelectorAll( '.extension-verify-status' );

			checkboxes.forEach( ( checkbox ) => {
				checkbox.addEventListener( 'change', this.onStatusChange );
			} );

		},

		/**
		 * Callback function of checkbox change event.
		 * To update extension verification mark.
		 *
		 * @return void
		 */
		onStatusChange: function () {

			const statusLabel = {
				known_issues: 'Known Issues',
				unverified: 'Unverified',
				human_verified: 'Human Verified',
				auto_verified: 'Auto Verified',
			};
			const extensionDetail = {
				name: this.dataset.extensionName,
				version: this.dataset.extensionVersion,
			};

			const extensionVersionSlug = this.dataset.extensionVersionSlug;
			const status = this.value;

			if ( ! extensionVersionSlug ) {
				return;
			}

			this.disabled = true;

			jQuery.post( '/admin/verify-extensions', {
				extensionVersionSlug: extensionVersionSlug,
				verificationStatus: status,
			}, ( data ) => {

				const messageContainer = document.getElementById( 'messageContainer' );
				const messageElement = document.createElement( 'p' );

				if ( 'ok' === data.status ) {
					messageElement.classList.add( 'text-success' );
					messageElement.innerText = `Extension "${ extensionDetail.name } - ${ extensionDetail.version }" successfully marked as "${ statusLabel[ status ] }"`;
				} else {
					messageElement.classList.add( 'text-danger' );
					messageElement.innerText = `Failed to mark "${ extensionDetail.name } - ${ extensionDetail.version }" as "${ statusLabel[ status ] }"`;
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
