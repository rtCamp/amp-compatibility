'use strict';

const { Storage } = require( '@google-cloud/storage' );

const Helpers = use( 'Helpers' );
const Env = use( 'Env' );

class StorageExtended {

	/**
	 * Construct method.
	 */
	constructor() {
		this.storage = new Storage();

		this.bucketName = Env.get( 'STORAGE_BUCKET_NAME', '' );

		this.createBucket( this.bucketName );
	}

	/**
	 * Get list of available buckets.
	 *
	 * @return {Promise<[]>} List of bucket names.
	 */
	async getBucketList() {

		let bucketNames = [];
		const [ buckets ] = await this.storage.getBuckets();

		buckets.forEach( bucket => {
			bucketNames.push( bucket.name );
		} );

		return bucketNames;
	}

	/**
	 * Create bucket for the project if not exists.
	 *
	 * @param {String} bucketName Bucket name.
	 *
	 * @return {Promise<boolean|Bucket>} True if bucket is created or exists. Otherwise False.
	 */
	async createBucket( bucketName ) {

		const existingBuckets = await this.getBucketList();

		if ( ! this.bucketName ) {
			return false;
		}

		if ( existingBuckets.includes( bucketName ) ) {
			return true;
		}

		await this.storage.createBucket( bucketName );

		return true;
	}

	/**
	 * Upload file to project's bucket.
	 *
	 * @param {String} filePath Full path of the file.
	 *
	 * @return {Promise<string|boolean>} Relative file path of uploaded file.
	 */
	async uploadFile( filePath ) {

		if ( ! this.bucketName ) {
			return '';
		}

		const appRoot = Helpers.appRoot() + '/';
		const destination = filePath.replace( appRoot, '' );

		await this.storage.bucket( this.bucketName ).upload( filePath, {
			destination: destination,
			metadata: {
				cacheControl: 'no-cache',
			},
		} );

		return `${ this.bucketName }/${ destination }`;
	}

}

module.exports = StorageExtended;
