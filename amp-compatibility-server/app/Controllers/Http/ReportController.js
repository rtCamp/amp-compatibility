'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const Database = use( 'Database' );

const SiteModel = use( 'App/Models/Site' );
const ExtensionVersionsModel = use( 'App/Models/ExtensionVersion' );

class ReportController {
	/**
	 * To Show report based on site.
	 *
	 * @param {object} ctx
	 * @param {View} view ctx.view
	 * @param {Request} request ctx.request
	 * @param {Response} response ctx.response
	 * @param {object} params ctx.params
	 *
	 * @return {Promise<Route|String|*>}
	 */
	async index( { view } ) {

		const ampModeCounts = await Database.from( SiteModel.table ).select( 'amp_mode AS label' ).count( '* AS value' ).groupBy( 'amp_mode' ).where( 'is_synthetic_data', false );
		const ampVersionCounts = await Database.from( SiteModel.table ).select( 'amp_version AS label' ).count( '* AS value' ).groupBy( 'amp_version' ).where( 'is_synthetic_data', false );
		const extensionVerificationCounts = await Database.from( ExtensionVersionsModel.table ).select( 'verification_status AS label' ).count( '* AS value' ).groupBy( 'verification_status' );
		const pluginGroupCounts = await this._getExtensionCountByActiveInstalls( 'plugin' );
		const themeGroupCounts = await this._getExtensionCountByActiveInstalls( 'theme' );
		const extensionErrorCounts = await this._getExtensionErrorCountGroup( 'theme' );

		const viewData = {
			ampChartInfoBoxes: {
				ampModes: {
					id: 'amp-modes',
					title: 'AMP Modes',
					data: ampModeCounts,
				},
				ampVersions: {
					id: 'amp-version',
					title: 'AMP Version',
					data: ampVersionCounts,
				},
			},
			extensionChartInfoBoxes: {
				extensionVerification: {
					id: 'extension-verification-status',
					title: 'Extension Verification Status',
					data: extensionVerificationCounts,
				},
				errorCountGroup: {
					id: 'error-count-group',
					title: 'Error Count Group',
					data: extensionErrorCounts,
				},
				pluginGroup: {
					id: 'active-install-group-plugins',
					title: 'Active Install Group (Plugins)',
					data: pluginGroupCounts,
				},
				themeGroup: {
					id: 'active-install-group-themes',
					title: 'Active Install Group (Themes)',
					data: themeGroupCounts,
				},
			},
		};

		return view.render( 'dashboard/reports/index', viewData );
	}

	/**
	 * To get active install count group by extension type.
	 *
	 * @private
	 *
	 * @param {String} type Extension type.
	 *
	 * @return {Promise<*>}
	 */
	async _getExtensionCountByActiveInstalls( type = 'plugin' ) {
		const query = `SELECT CASE
		WHEN active_installs BETWEEN 0 AND 100 THEN "0 - 100"
		WHEN active_installs BETWEEN 101 AND 1000 THEN "101 - 1000"
		WHEN active_installs BETWEEN 1001 AND 10000 THEN "1001 - 10000"
		WHEN active_installs BETWEEN 10001 AND 100000 THEN "10,001 - 100,000"
		WHEN active_installs BETWEEN 100001 AND 500000 THEN "100,001 - 500,000"
		WHEN active_installs BETWEEN 500001 AND 1000000 THEN "500,001 - 1,000,000"
		WHEN active_installs > 1000000 THEN "10,000,001 - Above"
		END  AS label,
	count(1) AS value
FROM extensions
WHERE extensions.type = '${ type }'
GROUP BY label;`;

		const [ result ] = await Database.raw( query );

		return result;
	}

	/**
	 * Get error count group of extension.
	 *
	 * @private
	 *
	 * @return {Promise<*>}
	 */
	async _getExtensionErrorCountGroup() {

		const errorCountByExtension = `
            SELECT extensions.slug, count(DISTINCT errors.error_slug) AS error_count
            FROM extensions AS extensions
                     INNER JOIN extension_versions AS extension_versions
                                ON extensions.extension_slug = extension_versions.extension_slug AND
                                   extensions.latest_version = extension_versions.version
                     INNER JOIN
                 (
                     SELECT error_sources.extension_version_slug, count(1) AS source_count
                     FROM error_sources AS error_sources
                     GROUP BY error_sources.extension_version_slug
                 ) AS source_counts
                 ON extension_versions.extension_version_slug = source_counts.extension_version_slug
                     INNER JOIN error_sources AS error_sources
                                ON extension_versions.extension_version_slug = error_sources.extension_version_slug
                     INNER JOIN url_error_relationships AS url_error_relationships
                                ON url_error_relationships.error_source_slug = error_sources.error_source_slug
                     INNER JOIN errors AS errors
                                ON errors.error_slug = url_error_relationships.error_slug
            WHERE extensions.wporg = true
            GROUP BY extensions.slug
            ORDER BY error_count DESC`;

		const query = `
		SELECT CASE
			WHEN error_count = 0 THEN "None"
			WHEN error_count BETWEEN 1 AND 10 THEN "1 - 10"
			WHEN error_count BETWEEN 11 AND 50 THEN "11 - 50"
			WHEN error_count BETWEEN 51 AND 100 THEN "51 - 100"
			WHEN error_count BETWEEN 101 AND 250 THEN "101 - 250"
			WHEN error_count BETWEEN 251 AND 500 THEN "251 - 500"
			WHEN error_count BETWEEN 500 AND 1000 THEN "500 - 1000"
			WHEN error_count > 1000 THEN "1000 - Above"
		END AS label, count(1) AS value
		FROM ( ${ errorCountByExtension } ) AS view_error_count_by_extension
		GROUP BY label;`;

		const [ result ] = await Database.raw( query );

		return result;
	}

}

module.exports = ReportController;
