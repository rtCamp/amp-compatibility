import * as mdb from 'mdb-ui-kit';

export function showNotification( message, type = 'secondary' ) {

	const notificationContainer = document.getElementById( 'notification-container' );

	const toast = document.createElement( 'div' );
	toast.innerHTML = `
	<button type="button" class="toast-close" data-mdb-dismiss="toast" aria-label="Close">
		<div class="toast-body">${ message }</div>
	</button>
	`;

	toast.classList.add( 'toast', 'fade', 'text-white', 'mb-2', `bg-${ type }` );
	notificationContainer.appendChild( toast );

	const toastInstance = new mdb.Toast( toast, {
		stacking: true,
		hidden: true,
		width: '450px',
		position: 'top-right',
		autohide: true,
		delay: 5000,
	} );

	toastInstance.show();

}
