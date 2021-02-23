'use strict';

const { Storage } = require( '@google-cloud/storage' );

const Helpers = use( 'Helpers' );
const Env = use( 'Env' );

class StorageExtended {

	constructor() {
		this.storage = new Storage();

		this.bucketName = Env.get( 'STORAGE_BUCKET_NAME', '' );

		this.createBucket( this.bucketName );
	}

	async getBucketList() {

		let bucketNames = [];
		const [ buckets ] = await this.storage.getBuckets();

		buckets.forEach( bucket => {
			bucketNames.push( bucket.name );
		} );

		return bucketNames;
	}

	async createBucket( bucketName ) {

		const existingBuckets = await this.getBucketList();

		if ( ! this.bucketName ) {
			return false;
		}

		if ( existingBuckets.includes( bucketName ) ) {
			return true;
		}

		const [ bucket ] = await this.storage.createBucket( bucketName );

		return bucket;
	}

	async uploadFile( filePath ) {

		if ( ! this.bucketName ) {
			return false;
		}

		const appRoot = Helpers.appRoot() + '/';
		const destination = filePath.replace( appRoot, '' );

		await this.storage.bucket( this.bucketName ).upload( filePath, {
			destination: destination,
			metadata: {
				cacheControl: 'no-cache',
			},
		} );

	}

}

module.exports = StorageExtended;
