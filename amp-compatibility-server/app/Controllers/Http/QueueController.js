'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const AdhocSyntheticDataQueueController = use( 'App/Controllers/Queue/AdhocSyntheticDataController' );

const Database = use( 'Database' );

const { validateAll } = use( 'Validator' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class QueueController {

	/**
	 * To render queue job listing table.
	 *
	 * @param {object} ctx
	 * @param {View} ctx.view
	 * @param {Object} ctx.params
	 *
	 * @return {Promise<*>}
	 */
	async index( { view, params } ) {

		params = _.defaults( params, {
			queue: 'request-queue',
			status: 'active',
			paged: 1,
			perPage: 50,
		} );

		params.queue = params.queue.toString().toLowerCase().trim();
		params.status = params.status.toString().toLowerCase().trim();

		let queue = false;
		let pageDescription = '';
		const jobs = [];
		let page = {
			start: ( params.paged * params.perPage ) - params.perPage,
			end: ( params.paged * params.perPage ),
		};

		if ( [ 'failed', 'succeeded' ].includes( params.status ) ) {
			page = { size: 100 };
		}

		switch ( params.queue ) {
			case 'synthetic-queue':
				queue = SyntheticDataQueueController.queue;

				const dow = 6;
				const currentDate = new Date();

				currentDate.setHours( 4 );
				currentDate.setMinutes( 0 );
				currentDate.setSeconds( 0 );
				currentDate.setDate( currentDate.getDate() + ( dow + ( 7 - currentDate.getDay() ) ) % 7 );

				pageDescription = `The next synthetic data run is scheduled on "<b>${ currentDate.toUTCString() }</b>"`;
				break;
			case 'adhoc-synthetic-queue':
				queue = AdhocSyntheticDataQueueController.queue;
				break;
			case 'request-queue':
			default:
				queue = RequestQueueController.queue;
				break;
		}

		const queueHealth = await queue.checkHealth();
		const queueJobs = await queue.getJobs( params.status, page ) || [];

		for ( const index in queueJobs ) {
			const queueJob = queueJobs[ index ];
			let job = {};

			let site_domain = '';
			job.id = queueJob.id;

			if ( [ 'synthetic-queue', 'adhoc-synthetic-queue' ].includes( params.queue ) ) {

				job.domain = `${ queueJob.data.domain }.local`;
				job.plugins = Utility.parseSyntheticExtensionParam( queueJob.data.plugins );
				job.theme = Utility.parseSyntheticExtensionParam( queueJob.data.theme );

				site_domain = job.domain;

			} else if ( 'request-queue' === params.queue ) {

				job.site_url = queueJob.data.site_url;
				job.site_title = queueJob.data.site_info.site_title;
				job.error_count = queueJob.data.errors ? _.size( queueJob.data.errors ) : 0;
				job.error_sources_count = queueJob.data.error_sources ? _.size( queueJob.data.error_sources ) : 0;
				job.urls_count = queueJob.data.urls ? _.size( queueJob.data.urls ) : 0;

				site_domain = job.site_url;
			}

			if ( 'adhoc-synthetic-queue' === params.queue ) {
				job.AMP_source = queueJob.data.ampSource;
			}

			if ( 'active' === params.status ) {
				job.progress = queueJob.progress.toString();
			}

			if ( [ 'failed', 'succeeded' ].includes( params.status ) &&
				 [ 'synthetic-queue', 'adhoc-synthetic-queue' ].includes( params.queue )
			) {
				job.logs = queueJob.options._logs || [];
			}

			switch ( params.status ) {
				case 'succeeded':
					job.actions = {
						retry: queueJob.id,
						report: `/admin/report/site/${ site_domain }`,
					};
					break;
				case 'failed':
					job.actions = {
						retry: queueJob.id,
					};
					break;
				case 'waiting':
					job.actions = {
						remove: queueJob.id,
					};
					break;
			}

			jobs.push( job );
		}

		const pagination = {
			baseUrl: `/admin/${ params.queue }/${ params.status }`,
			total: queueHealth[ params.status ],
			perPage: params.perPage,
			currentPage: params.paged,
		};

		const data = {
			pageDescription: pageDescription,
			queue: params.queue,
			tabs: {
				active: 'Active',
				waiting: 'Waiting',
				succeeded: 'Succeeded',
				failed: 'Failed',
				delayed: 'Delayed',
			},
			queueHealth: queueHealth,
			pagination: pagination,
			jobs: jobs,
		};

		return view.render( 'dashboard/queue-table', data );
	}

	/**
	 * To render queue job listing table.
	 *
	 * @param {object} ctx
	 * @param {View} ctx.view
	 * @param {Object} ctx.params
	 *
	 * @return {Promise<*>}
	 */
	async indexMySQL( { view, params } ) {

		params = _.defaults( params, {
			queue: 'request-queue',
			status: 'active',
			paged: 1,
			perPage: 50,
		} );

		const queueControllerList = {
			'request-queue': RequestQueueController,
			'synthetic-queue': SyntheticDataQueueController,
			'adhoc-synthetic-queue': AdhocSyntheticDataQueueController,
		};

		const selectFieldList = {
			'request-queue': [
				'uuid',
				'site_url',
				'is_synthetic',
				'data',
				'logs',
				'result',
			],
			'synthetic-queue': [
				'uuid',
				'data',
				'logs',
				'result',
			],
			'adhoc-synthetic-queue': [
				'uuid',
				'data',
				'logs',
				'result',
			],
		};

		const queueController = queueControllerList[ params.queue ];
		const fields = selectFieldList[ params.queue ];
		const databaseModel = queueController.databaseModel;

		/**
		 * Prepare counts for each status.
		 */
		const queueHealth = await queueController.queue.checkHealth();

		const statusCountsResult = await Database.select( 'status' ).count( '* as value' ).from( databaseModel.table ).groupBy( 'status' );
		const statusCounts = {};
		statusCountsResult.map( ( item ) => {
			statusCounts[ item.status ] = parseInt( item.value ) || 0;
		} );
		queueHealth.succeeded = statusCounts.succeeded;

		/**
		 * Fetch records from respective source. (either MySQL or Redis)
		 */
		let items = [];

		switch ( params.status ) {
			case 'active':
			case 'failed':
			case 'waiting':
			case 'succeeded':
				const result = await Database.select( fields ).from( databaseModel.table ).where( 'status', params.status ).paginate( params.paged, params.perPage );
				items = result.data;
				break;
		}

		/**
		 * Prepare fields according
		 * @type {*[]}
		 */
		const prepareItemCallbacks = {
			'request-queue': ( item ) => {

				let data = item.data.toString();
				data = Utility.maybeParseJSON( data ) || {};

				const preparedItem = {
					uuid: item.uuid,
					site_title: data.site_info.site_title,
					error_count: data.errorCount ? data.errorCount : 0,
					error_sources_count: data.errorSourceCount ? data.errorSourceCount : 0,
					urls_count: data.urls ? _.size( data.urls ) : 0,
					is_synthetic: !! item.is_synthetic,
				};

				if ( [ 'failed', 'succeeded' ].includes( params.status ) ) {
					preparedItem.result = item.result.toString();
				}

				return preparedItem;
			},
			'synthetic-queue': ( item ) => {
				let data = item.data.toString();
				data = Utility.maybeParseJSON( data ) || {};

				const preparedItem = {
					uuid: item.uuid,
					domain: `${ item.data.domain }.local`,
					plugins: Utility.parseSyntheticExtensionParam( data.plugins ),
					theme: Utility.parseSyntheticExtensionParam( data.theme ),
				};

				if ( [ 'failed', 'succeeded' ].includes( params.status ) ) {
					preparedItem.logs = Utility.maybeParseJSON( item.logs ) || [];
					preparedItem.result = item.result.toString();
				}

				return preparedItem;
			},
			'adhoc-synthetic-queue': ( item ) => {
				let data = item.data.toString();
				data = Utility.maybeParseJSON( data ) || {};

				const preparedItem = {
					uuid: item.uuid,
					domain: `${ data.domain }.local`,
					plugins: Utility.parseSyntheticExtensionParam( data.plugins ),
					theme: Utility.parseSyntheticExtensionParam( data.theme ),
					amp_source: data.ampSource,
				};

				if ( [ 'failed', 'succeeded' ].includes( params.status ) ) {
					preparedItem.logs = Utility.maybeParseJSON( item.logs ) || [];
					preparedItem.result = item.result.toString();
				}

				preparedItem.requested_by = data.email;

				return preparedItem;
			},
		};

		const preparedItems = items.map( prepareItemCallbacks[ params.queue ] );

		/**
		 * Prepare table args.
		 */
		const tableArgs = {
			tableID: 'queueTable',
			items: preparedItems,
			valueCallback: ( key, value ) => {
				let htmlMarkup = '';

				switch ( key ) {
					case 'uuid':
						value = `<abbr class="copy-to-clipboard" data-copy-text='${ value }'>${ value.slice( value.length - 13 ) }</abbr>`;
						break;
					case 'domain':
						value = `<a href="${ value }" target="_blank">${ value }</a>`;
						break;
					case 'plugins':
						htmlMarkup = '<ul class="list-group list-group-flush mt-0 mb-0">';
						value = value || [];

						value.map( ( item ) => {
							htmlMarkup += `<li class="list-group-item bg-transparent">${ item.name }&nbsp;${ item.version ? item.version : '' }</li>`
						} );

						htmlMarkup += '</ul>';

						value = htmlMarkup;
						break;
					case 'theme':
						value = ( ! _.isEmpty( value[ 0 ] ) ) ? `${ value[ 0 ].name }&nbsp;${ value[ 0 ].version ? value[ 0 ].version : '' }` : '';
						break;
					case 'amp_source':
						if ( ! [ 'wporg', 'github' ].includes( value ) ) {
							value = `<a href="${ value }" target="_blank" title="${ value }">Other</a>`;
						}
						break;
					case 'logs':
						value = value || {};
						htmlMarkup = '<ul class="list-group list-group-flush mt-0 mb-0">';

						for ( const index in value ) {
							const data = value[ index ];

							htmlMarkup += `<li class="list-group-item bg-transparent">` +
							              `<strong>Try ${ parseInt( index ) + 1 }</strong>:&nbsp;${ data.message }`;

							if ( data.logFile ) {
								htmlMarkup += `&nbsp;&nbsp;<a target="_blank" href="https://storage.cloud.google.com/${ data.logFile }">Log</a>`;
							}

							htmlMarkup += `</li>`;
						}

						htmlMarkup += '<ul>';
						value = htmlMarkup;
						break;
					case 'data':
					case 'result':
						const regex = /'/gm;
						value = value.replace( regex, '"' );
						value = `<button class="btn btn-outline-primary btn-xs copy-to-clipboard" data-copy-text='${ value }'>Copy</button>`;
						break;
					case 'requested_by':
						value = `<a href="mailto:${ value }">${ value }</a>`;
						break;
					case 'is_synthetic':
						value = `<span>${ value ? 'Yes' : 'No' }</span>`;
						break;

				}

				return value;
			},
		};

		/**
		 * Pagination.
		 */
		const pagination = {
			baseUrl: `/admin/${ params.queue }/${ params.status }`,
			total: queueHealth[ params.status ],
			perPage: params.perPage,
			currentPage: params.paged,
		};

		return view.render( 'dashboard/queue-secondary', {
			queue: params.queue,
			tabs: {
				active: 'Active',
				waiting: 'Waiting',
				succeeded: 'Succeeded',
				failed: 'Failed',
			},
			queueHealth: queueHealth,
			itemCount: parseInt( queueHealth[ params.status ] ) || 0,
			tableArgs,
			pagination,
		} );
	}

	/**
	 * Request handler for add adhoc synthetic queue form.
	 *
	 * @param {object} ctx
	 * @param {View} ctx.view
	 *
	 * @return {Promise<*>}
	 */
	addAdhocSyntheticQueue( { view } ) {

		return view.render( 'dashboard/add-adhoc-synthetic' );
	}

	/**
	 * Postback handler when user add  job into adhoc synthetic data queue.
	 *
	 * @param {object} ctx
	 * @param {View} ctx.view
	 * @param {Request} ctx.request
	 * @param {Object} ctx.auth
	 *
	 * @return {Promise<*>}
	 */
	async addAdhocSyntheticQueueFetch( { view, request, auth } ) {

		const user = await auth.getUser();
		const prefix = request.input( 'prefix' ) || user.username;
		const data = {};
		let ampSource = request.input( 'amp_source' );
		const ampSourceURL = request.input( 'amp_source_url' );
		const theme = request.input( 'theme' );
		let plugins = _.filter( request.input( 'plugins' ), ( value ) => {
			return ( _.isObject( value ) && ! _.isEmpty( value.name ) );
		} );

		if ( _.isEmpty( theme ) && _.isEmpty( plugins ) ) {
			data.errorNotification = 'Please provide either theme or plugins.';
			return view.render( 'dashboard/add-adhoc-synthetic', data );
		}

		if ( 'other' === ampSource && _.isEmpty( ampSourceURL ) ) {
			data.errorNotification = 'Please provide URL for AMP plugin.';
			return view.render( 'dashboard/add-adhoc-synthetic', data );
		}

		if ( 'other' === ampSource ) {
			ampSource = ampSourceURL;
		}

		let domain = 'adhoc-synthetic-data-' + Utility.getCurrentDateTime().replace( / |:/g, '-' );

		if ( prefix ) {
			domain = `${ prefix.trim() }-${ domain }`;
		}

		const job = {
			domain: domain,
			email: user.email,
			ampSource: ampSource,
		};

		if ( ! _.isEmpty( plugins ) ) {
			plugins = _.map( plugins, ( plugin ) => {
				let value = '';
				if ( ! _.isEmpty( plugin ) ) {
					value = ( _.isEmpty( plugin.version ) ) ? plugin.name : `${ plugin.name }:${ plugin.version }`;
				}

				return value;
			} );

			job.plugins = plugins.join( ',' ).trim();
		}

		if ( ! _.isEmpty( theme ) ) {
			job.theme = ( _.isEmpty( theme.version ) ) ? theme.name : `${ theme.name }:${ theme.version }`;
		}

		await AdhocSyntheticDataQueueController.createJob( job );

		data.successNotification = `Job has been added with domain "${ domain }.local"`;

		return view.render( 'dashboard/add-adhoc-synthetic', data );
	}

	/**
	 * Http handler for update job.
	 *
	 * @param {object} ctx
	 * @param {Request} ctx.request
	 * @param {Object} ctx.params
	 *
	 * @return {Promise<{data: *, status: string}|{message: string, status: string}>}
	 */
	async update( { request, params } ) {

		const postData = request.post();
		const queueName = params.queue || 'request-queue';
		let queueObject = false;
		let message = '';

		switch ( queueName ) {
			case 'synthetic-queue':
				queueObject = SyntheticDataQueueController;
				break;
			case 'adhoc-synthetic-queue':
				queueObject = AdhocSyntheticDataQueueController;
				break;
			case 'request-queue':
			default:
				queueObject = RequestQueueController;
				break;
		}

		const rules = {
			action: 'required|in:retry,remove',
			jobID: 'required|string',
		};

		const messages = {
			'action': 'Please provide valid action.',
			'jobID.required': 'Please provide Job ID.',
		};

		const validation = await validateAll( postData, rules, messages );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		switch ( postData.action ) {
			case 'retry':
				const job = await queueObject.queue.getJob( postData.jobID );
				const jobData = _.clone( job.data );

				if ( 'synthetic-queue' === queueName ) {
					await queueObject.queue.removeJob( postData.jobID );
					await AdhocSyntheticDataQueueController.createJob( jobData );
				} else {
					await queueObject.queue.removeJob( postData.jobID );
					await queueObject.createJob( jobData );
				}

				message = `Job ${ postData.jobID } has been added again in the queue`;
				break;
			case 'remove':
				await queueObject.queue.removeJob( postData.jobID );
				message = `Job ${ postData.jobID } has been removed from queue`;
				break;
		}

		return {
			status: 'ok',
			message: message,
		};

	}
}

module.exports = QueueController;
