window.addEventListener( 'DOMContentLoaded', function () {
	const queueTables = {

		/**
		 * Init method.
		 *
		 * @return void
		 */
		init: function () {
			const actionButtons = document.querySelectorAll( '.btn-actions' );

			actionButtons.forEach( ( checkbox ) => {
				checkbox.addEventListener( 'click', this.onActionButtonClick );
			} );
		},

		/**
		 * Callback handler for on click event of action button.
		 *
		 * @return void
		 */
		onActionButtonClick: function () {

			const action = this.dataset.action || '';
			const jobID = this.dataset.jobid || '';

			if ( ! action || ! jobID ) {
				return;
			}

			this.disabled = true;

			jQuery.post( window.location.href, {
				action: action,
				jobID: jobID,
			}, ( data ) => {

				const messageContainer = document.getElementById( 'messageContainer' );
				const messageElement = document.createElement( 'p' );
				messageElement.innerText = data.message;

				if ( 'ok' === data.status ) {
					messageElement.classList.add( 'text-success' );
				} else {
					messageElement.classList.add( 'text-danger' );
					this.disabled = false;
				}

				messageContainer.append( messageElement );

				setTimeout( () => {
					messageContainer.removeChild( messageElement );
				}, 10000 );

			} );

		},
	};

	queueTables.init();
} );
