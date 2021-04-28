window.addEventListener( 'DOMContentLoaded', function () {
	const extension = {

		/**
		 * Init function.
		 *
		 * @return void
		 */
		init: function () {

			const extensionVersionStatusControls = document.querySelectorAll( '.extension-verify-status' );

			extensionVersionStatusControls.forEach( ( extensionVersionStatusControl ) => {
				extensionVersionStatusControl.addEventListener( 'change', this.onExtensionVersionStatusChange );
			} );

			const extensionPartnerControls = document.querySelectorAll( '.extension-partner-control' );

			extensionPartnerControls.forEach( ( extensionPartnerControl ) => {
				extensionPartnerControl.addEventListener( 'change', this.onExtensionPartnerChange );
			} );

		},

		/**
		 * Callback function of to extension version status control change event.
		 * To update extension version verification status.
		 *
		 * @return void
		 */
		onExtensionVersionStatusChange: function () {

			const statusLabel = {
				fail: 'Fail',
				unknown: 'Unknown',
				pass: 'Pass',
				auto_pass: 'Pass (Auto)',
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

			jQuery.post( '/admin/extensions/version', {
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

		/**
		 * Callback function of to update partnership status of the extension.
		 *
		 * @return void
		 */
		onExtensionPartnerChange: function () {

			const extensionDetail = {
				name: this.dataset.name,
				extensionSlug: this.dataset.extensionSlug,
			};

			if ( ! extensionDetail.extensionSlug ) {
				return;
			}

			const status = this.checked || false;

			this.disabled = true;

			jQuery.post( '/admin/extensions', {
				extensionSlug: extensionDetail.extensionSlug,
				status: status,
			}, ( data ) => {

				const messageContainer = document.getElementById( 'messageContainer' );
				const messageElement = document.createElement( 'p' );

				if ( 'ok' === data.status ) {
					messageElement.classList.add( 'text-success' );
					messageElement.innerText = `Extension "${ extensionDetail.name }" successfully marked as "${ status ? 'Partner extension' : 'Not a partner extension' }"`;
				} else {
					messageElement.classList.add( 'text-danger' );
					messageElement.innerText = `Failed to mark "${ extensionDetail.name }" as "${ status ? 'Partner extension' : 'Not a partner extension' }"`;
				}

				this.disabled = false;

				messageContainer.append( messageElement );

				setTimeout( () => {
					messageContainer.removeChild( messageElement );
				}, 10000 );
			} );

		},
	};

	extension.init();
} );
