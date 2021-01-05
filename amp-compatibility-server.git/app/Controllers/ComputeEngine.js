'use strict';

const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );
const Env = use( 'Env' );
const Helpers = use( 'Helpers' );

// Google Cloud
const Compute = require( '@google-cloud/compute' );

// Utilities
const _ = require( 'underscore' );
const fs = require( 'fs' );
const sshExec = require( 'ssh-exec' );

class ComputeEngine {

	get deployKeyPath() {
		return Env.get( 'DEPLOY_KEY_PATH', '~/.ssh/id_rsa_gcloud' );
	}

	get computeZone() {
		return Env.get( 'GCP_ZONE', 'us-east1-b' );
	}

	get githubToken() {
		return Env.get( 'GITHUB_TOKEN', '' );
	}

	get config() {

		const sshPubKey = fs.readFileSync( this.deployKeyPath + '.pub' );

		return {
			http: true,
			machineType: 'e2-standard-4',
			disks: [
				{
					boot: true,
					initializeParams: {
						sourceImage: 'https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-minimal-2004-focal-v20201211',
						diskSizeGb: '30',
					},
					autoDelete: true,
				},
			],
			metadata: {
				items: [
					{
						key: 'ssh-keys',
						value: 'root:' + sshPubKey,
					},
					{
						key: 'startup-script',
						value: `#!/bin/bash
							# Installs rsync and locales
							apt-get clean
							apt-get update
							apt-get install -y rsync locales
							locale-gen en_US.UTF-8`,
					},
				],
			},
			networkInterfaces: [
				{
					network: 'global/networks/default',
				},
			],
		}
	}

	get name() {
		return this.options.name;
	}

	get zoneName() {
		return this.options.zoneName;
	}

	get numberOfSites() {
		return this.options.numberOfSites;
	}

	/**
	 * Construct method.
	 */
	constructor( options = {} ) {

		this.options = _.defaults( options, {
			name: 'synthetic-data-generator',
			numberOfSites: 5,
			zoneName: this.computeZone,
		} );

	}

	async create() {

		const compute = new Compute();
		const zone = compute.zone( this.zoneName );

		const [ virtualMachine, operation ] = await zone.createVM( this.name, this.config );
		await operation.promise();

		this.virtualMachine = virtualMachine;

		const metadata = await this.virtualMachine.getMetadata();
		this.ip = metadata[ 0 ].networkInterfaces[ 0 ].accessConfigs[ 0 ].natIP;

		Logger.debug( 'Virtual machine created. IP: %s', this.ip );

		return true;
	}

	async delete() {
		const [ operation ] = await this.virtualMachine.delete();
		await operation.promise();

		Logger.debug( 'Virtual machine deleted.' );

		return true;
	}

	async setup() {

		Logger.debug( 'Waiting 120s for Virtual machine to be operational.' );
		await Utility.sleep( 90 );

		await Utility.executeCommand( 'ssh-keygen -f ~/.ssh/known_hosts -R "' + this.ip + '"' );
		await Utility.executeCommand( 'ssh-keyscan -H "' + this.ip + '" >> ~/.ssh/known_hosts' );

		await Utility.sleep( 30 );

		Logger.debug( 'Setting up SSH keys' );
		const sshPrivateKey = fs.readFileSync( this.deployKeyPath );
		await this.executeCommand( "echo '" + sshPrivateKey + "' > ~/.ssh/id_rsa" );
		await this.executeCommand( 'chmod 600 ~/.ssh/id_rsa' );

		Logger.debug( 'Copying initial setup script.' );
		let projectRoot = Helpers.appRoot();
		projectRoot += projectRoot.endsWith( '/' ) ? '' : '/';
		await this.copyFileToRemote( projectRoot + 'scripts/setup-server.sh', '/root/setup-server.sh' );
		await this.copyFileToRemote( projectRoot + 'scripts/site.sh', '/root/site.sh' );
		await this.executeCommand( "echo '" + this.githubToken + "' > ~/.bashrc" );

		Logger.debug( 'Installing and setting up the server.' );
		await this.executeCommand( 'bash -x /root/setup-server.sh > /var/log/init.log 2>&1' );
		await this.copyFileToRemote( projectRoot + '.env', '/root/amp-compatibility-server/' );
	}

	async copyFileToRemote( localPath, remotePath ) {

		const ip = this.ip;

		// Remote command.
		await this.executeCommand( 'command -v rsync || apt update && apt install -y rsync' );

		// Local command.
		await Utility.executeCommand( 'command -v rsync || apt install -y rsync' );
		await Utility.executeCommand( 'rsync -avzhP ' + localPath + ' root@' + ip + ':' + remotePath );
	}

	async executeCommand( command ) {

		await sshExec( command, {
			user: 'root',
			host: this.ip,
			key: this.deployKeyPath,
		}, ( error, stdout, stderr ) => {

			if ( error ) {
				Logger.debug( `error: ${ error.message }` );
				return;
			}

			if ( stderr ) {
				Logger.debug( `stderr: ${ stderr }` );
				return;
			}

			Logger.debug( stdout );
			return stdout;
		} );
	}

}

module.exports = ComputeEngine;
