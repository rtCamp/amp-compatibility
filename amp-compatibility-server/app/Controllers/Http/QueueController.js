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
	async index( { view, request, params } ) {

		params = _.defaults( params, {
			queue: 'request-queue',
			status: 'active',
			paged: 1,
		} );

		const queueControllerList = {
			'request-queue': RequestQueueController,
			'synthetic-queue': SyntheticDataQueueController,
			'adhoc-synthetic-queue': AdhocSyntheticDataQueueController,
		};

		const queryParams = {
			paged: params.paged,
			perPage: 20,
			s: request.input( 's' ) || '',
			whereClause: {
				status: params.status,
			},
			orderby: {
				'created_at': 'DESC',
			}
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
				'domain',
				'data',
				'logs',
				'result',
			],
			'adhoc-synthetic-queue': [
				'uuid',
				'domain',
				'data',
				'logs',
				'result',
			],
		};

		const searchFieldList = {
			'request-queue': [
				'uuid',
				'site_url',
			],
			'synthetic-queue': [
				'uuid',
				'domain',
			],
			'adhoc-synthetic-queue': [
				'uuid',
				'domain',
			],
		};

		const queueController = queueControllerList[ params.queue ];
		const databaseModel = queueController.databaseModel;

		/**
		 * Fetch records from respective source. (either MySQL or Redis)
		 */

		queryParams.selectFields = selectFieldList[ params.queue ];
		queryParams.searchFields = searchFieldList[ params.queue ];
		switch ( params.queue ) {
			case 'request-queue':
				if ( request.input( 'is_synthetic' ) ) {
					queryParams.whereClause.is_synthetic = !! parseInt( request.input( 'is_synthetic' ) );
				}
				break;
		}

		const result = await databaseModel.getResult( queryParams );
		const items = _.toArray( result.data );

		/**
		 * Prepare fields according
		 * @type {*[]}
		 */
		const prepareItemCallbacks = {
			'request-queue': ( item ) => {

				const siteDomain = item.site_url;
				let data = item.data.toString();
				data = Utility.maybeParseJSON( data ) || {};

				const preparedItem = {
					uuid: item.uuid,
					site_title: data.site_info.site_title,
					error_count: data.errorCount ? data.errorCount : 0,
					error_sources_count: data.errorSourceCount ? data.errorSourceCount : 0,
					urls_count: data.urls ? _.size( data.urls ) : 0,
					is_synthetic: !! item.is_synthetic,
					data: Utility.jsonPrettyPrint( data ),
				};

				if ( [ 'failed', 'succeeded' ].includes( params.status ) ) {
					preparedItem.result = item.result || '';
					preparedItem.result = preparedItem.result.toString();
				}

				switch ( params.status ) {
					case 'succeeded':
						preparedItem.actions = {
							retry: item.uuid,
							report: `/admin/report/site/${ siteDomain }`,
						};
						break;
					case 'failed':
						preparedItem.actions = {
							retry: item.uuid,
						};
						break;
					case 'waiting':
						preparedItem.actions = {
							remove: item.uuid,
						};
						break;
				}

				return preparedItem;
			},
			'synthetic-queue': ( item ) => {
				let data = item.data.toString();
				data = Utility.maybeParseJSON( data ) || {};
				const siteDomain = `${ item.domain }.local`;

				const preparedItem = {
					uuid: item.uuid,
					domain: siteDomain,
					plugins: Utility.parseSyntheticExtensionParam( data.plugins ),
					theme: Utility.parseSyntheticExtensionParam( data.theme ),
					data: Utility.jsonPrettyPrint( data ),
					logs: Utility.maybeParseJSON( item.logs ) || [],
				};

				if ( [ 'failed', 'succeeded' ].includes( params.status ) ) {
					preparedItem.result = item.result || '';
					preparedItem.result = preparedItem.result.toString();
				}

				switch ( params.status ) {
					case 'succeeded':
						preparedItem.actions = {
							retry: item.uuid,
							report: `/admin/report/site/${ siteDomain }`,
						};
						break;
					case 'failed':
						preparedItem.actions = {
							retry: item.uuid,
						};
						break;
					case 'waiting':
						preparedItem.actions = {
							remove: item.uuid,
						};
						break;
				}

				return preparedItem;
			},
			'adhoc-synthetic-queue': ( item ) => {
				let data = item.data.toString();
				data = Utility.maybeParseJSON( data ) || {};
				const siteDomain = `${ data.domain }.local`;

				const preparedItem = {
					uuid: item.uuid,
					domain: siteDomain,
					plugins: Utility.parseSyntheticExtensionParam( data.plugins ),
					theme: Utility.parseSyntheticExtensionParam( data.theme ),
					amp_source: data.ampSource,
					data: Utility.jsonPrettyPrint( data ),
					logs: Utility.maybeParseJSON( item.logs ) || [],
				};

				if ( [ 'failed', 'succeeded' ].includes( params.status ) ) {
					preparedItem.result = item.result || '';
					preparedItem.result = preparedItem.result.toString();
				}

				preparedItem.requested_by = data.email;
				switch ( params.status ) {
					case 'succeeded':
						preparedItem.actions = {
							retry: item.uuid,
							report: `/admin/report/site/${ siteDomain }`,
						};
						break;
					case 'failed':
						preparedItem.actions = {
							retry: item.uuid,
						};
						break;
					case 'waiting':
						preparedItem.actions = {
							remove: item.uuid,
						};
						break;
				}

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
			headings: {
				uuid: 'UUID',
			},
			valueCallback: ( key, value ) => {
				let htmlMarkup = '';

				switch ( key ) {
					case 'uuid':
						value = `<abbr class="copy-to-clipboard" data-copy-text='${ value }'>${ value.slice( value.length - 13 ) }</abbr>`;
						break;
					case 'domain':
						value = `<a href="//${ value }" target="_blank">${ value }</a>`;
						break;
					case 'plugins':
						htmlMarkup = '<ul class="list-group synthetic-item-plugins list-group-flush mt-0 mb-0">';
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
						htmlMarkup = '<ul class="list-group synthetic-item-logs list-group-flush mt-0 mb-0">';

						for ( const index in value ) {
							const data = value[ index ];

							htmlMarkup += `<li class="list-group-item bg-transparent">` +
							              `<strong>Try ${ parseInt( index ) + 1 }</strong>:&nbsp;${ data.message }`;

							if ( data.logFile ) {
								htmlMarkup += `&nbsp;&nbsp;<a target="_blank" href="https://storage.cloud.google.com/${ data.logFile }">Log</a>`;
							}

							htmlMarkup += `</li>`;
						}

						htmlMarkup += '</ul>';
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
					case 'actions':
						htmlMarkup = '';
						const icons = {
							remove: '<span class="material-icons align-middle">delete_outline</span>',
							retry: '<span class="material-icons align-middle">autorenew</span>',
							report: '<span class="material-icons align-middle">open_in_new</span>',
						};

						for ( const action in value ) {

							if ( 'report' === action ) {
								htmlMarkup += `<a href="${ value[ action ] }" title="${action}" class="btn mr-1 btn-xs btn-link btn-actions" target="_blank">${ icons[ action ] }</a>`;
							} else {
								htmlMarkup += `<button type="button" title="${action}" class="btn mr-1 btn-xs btn-link btn-actions" data-action="${ action }" data-jobid="${ value[ action ] }">${ icons[ action ] }</button>`;
							}
						}

						value = htmlMarkup;
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
			total: result.total,
			perPage: queryParams.perPage,
			currentPage: queryParams.paged,
		};

		return view.render( 'dashboard/queue-list', {
			queryStrings: request.get(),
			queue: params.queue,
			tabs: {
				active: 'Active',
				waiting: 'Waiting',
				succeeded: 'Succeeded',
				failed: 'Failed',
			},
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

		const queueControllerList = {
			'request-queue': RequestQueueController,
			'synthetic-queue': SyntheticDataQueueController,
			'adhoc-synthetic-queue': AdhocSyntheticDataQueueController,
		};

		const queueName = params.queue || 'request-queue';
		const queueObject = queueControllerList[ queueName ];
		let message = '';

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

		const jobID = postData.jobID;

		switch ( postData.action ) {
			case 'retry':

				const job = await queueObject.queue.getJob( jobID );
				let jobData = null;

				if ( job ) {
					jobData = _.clone( job.data );
				} else {
					if ( 'request-queue' !== queueName ) {
						jobData = await queueObject.databaseModel.query().select( 'data' ).where( 'uuid', jobID ).first();
						jobData = Utility.maybeParseJSON( jobData.data ) || {};
					}
				}

				if ( _.isEmpty( jobData ) ) {
					return {
						status: 'fail',
						message: 'Could not find job data.',
					};
				}

				await queueObject.queue.removeJob( postData.jobID );
				await queueObject.createJob( jobData );

				message = `Job ${ postData.jobID } has been added again in the queue`;
				break;
			case 'remove':
				await queueObject.queue.removeJob( postData.jobID );
				await queueObject.databaseModel.query().where( 'uuid', jobID ).delete();
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
