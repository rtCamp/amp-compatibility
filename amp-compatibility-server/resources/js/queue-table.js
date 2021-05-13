import { showNotification } from './utils';

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

				if ( 'ok' === data.status ) {
					showNotification( data.message );
				} else {
					showNotification( data.message, 'danger' );
					this.disabled = false;
				}

			} );

		},
	};

	queueTables.init();
} );
