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

	get githubToken() {
		return Env.get( 'GITHUB_TOKEN', '' );
	}

	get config() {

		const sshPubKey = fs.readFileSync( this.deployKeyPath + '.pub' );

		return {
			http: true,
			machineType: Env.get( 'GCP_INSTANCE_TYPE', 'c2-standard-4' ),
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
		};
	}

	get name() {
		return this.options.name;
	}

	get zoneName() {
		return this.options.zoneName;
	}

	get isVMExists() {
		return ( 'undefined' !== typeof this.virtualMachine );
	}

	/**
	 * Construct method.
	 */
	constructor( options = {} ) {

		this.options = _.defaults( options, {
			name: 'synthetic-data-generator',
			zoneName: Env.get( 'GCP_ZONE', 'us-central1-a' ),
		} );

	}

	async getInstanceIfExists() {

		if ( this.isVMExists ) {
			throw 'Virtual machine is already exists.';
		}

		const compute = new Compute();
		const zone = compute.zone( this.zoneName );

		const options = {
			autoPaginate: false,
			filter: {
				name: this.name,
				comparison: 'eq',
			},
		};
		const [ virtualMachines ] = await zone.getVMs( options );

		for ( const index in virtualMachines ) {

			if ( this.name === virtualMachines[ index ].name ) {
				this.virtualMachine = virtualMachines[ index ];

				await this.getIP();

				Logger.debug( `%s : Already exists. IP: %s`, this.options.name, this.ip );

				return true;
			}

		}

		return false;
	}

	async create() {

		if ( this.isVMExists ) {
			throw 'Virtual machine is already exists.';
		}

		const compute = new Compute();
		const zone = compute.zone( this.zoneName );

		const [ virtualMachine, operation ] = await zone.createVM( this.name, this.config );
		await operation.promise();

		this.virtualMachine = virtualMachine;

		await this.getIP();

		Logger.debug( `%s : Created. (Waiting 120s for instance to be operational.) IP: %s`, this.options.name, this.ip );
		await Utility.sleep( 120 );

		return true;
	}

	async getIP() {

		if ( ! this.isVMExists ) {
			throw 'Virtual machine does not exists.';
		}

		const metadata = await this.virtualMachine.getMetadata();
		//this.ip = metadata[ 0 ].networkInterfaces[ 0 ].networkIP;
		this.ip = metadata[ 0 ].networkInterfaces[ 0 ].accessConfigs[ 0 ].natIP;
	}

	async delete() {

		if ( ! this.isVMExists ) {
			throw 'Virtual machine does not exists.';
		}

		const [ operation ] = await this.virtualMachine.delete();
		await operation.promise();

		Logger.debug( `%s : Deleted.`, this.options.name );

		return true;
	}

	async setup() {

		if ( ! this.isVMExists ) {
			throw 'Virtual machine does not exists.';
		}

		Logger.debug( `%s : Setup started.`, this.options.name );

		await Utility.executeCommand( 'touch ~/.ssh/known_hosts && chmod 644 ~/.ssh/known_hosts' );
		await Utility.executeCommand( 'ssh-keygen -f ~/.ssh/known_hosts -R "' + this.ip + '"' );
		await Utility.executeCommand( 'ssh-keyscan -H "' + this.ip + '" >> ~/.ssh/known_hosts' );

		await Utility.sleep( 30 );

		Logger.debug( `%s : Setting up SSH keys.`, this.options.name );
		const sshPrivateKey = fs.readFileSync( this.deployKeyPath );
		await this.executeCommand( "echo '" + sshPrivateKey + "' > ~/.ssh/id_rsa" );
		await this.executeCommand( 'chmod 600 ~/.ssh/id_rsa' );

		Logger.debug( `%s : Copying initial setup script.`, this.options.name );
		let projectRoot = Helpers.appRoot();
		projectRoot += projectRoot.endsWith( '/' ) ? '' : '/';
		await this.copyFileToRemote( projectRoot + 'scripts/setup-server.sh', '/root/setup-server.sh' );
		await this.executeCommand( "echo 'export GITHUB_TOKEN=" + this.githubToken + "' > ~/.bashrc" );

		Logger.debug( `%s : Installing and setting up the server.`, this.options.name );
		await this.executeCommand( 'bash -x /root/setup-server.sh > /var/log/init.log 2>&1' );
		await this.copyFileToRemote( projectRoot + '.env', '/root/amp-compatibility-server/' );

		Logger.debug( `%s : Setup completed.`, this.options.name );
	}

	async copyFileToRemote( localPath, remotePath ) {

		if ( ! this.isVMExists ) {
			throw 'Virtual machine does not exists.';
		}

		const ip = this.ip;

		// Remote command.
		await this.executeCommand( 'command -v rsync || apt update && apt install -y rsync' );

		// Local command.
		await Utility.executeCommand( 'command -v rsync || apt install -y rsync' );
		await Utility.executeCommand( 'rsync -avzhPL ' + localPath + ' root@' + ip + ':' + remotePath );
	}

	async executeCommand( command ) {

		if ( ! this.isVMExists ) {
			throw 'Virtual machine does not exists.';
		}

		return new Promise( ( done, failed ) => {
			Logger.debug( `%s : Running command : %s`, this.options.name, command );
			sshExec( command, {
				user: 'root',
				host: this.ip,
				key: this.deployKeyPath,
			}, ( error, stdout, stdError ) => {

				if ( error ) {
					error.stdout = stdout;
					error.stderr = stdError;

					Logger.error( `%s : Stdout : %s`, this.options.name, stdout );
					Logger.error( `%s : Std Error : %s`, this.options.name, stdError );
					failed( error );
					return;
				}

				Logger.debug( `%s : Stdout : %s`, this.options.name, stdout );
				done( { stdout, stdError } );
			} );
		} );

	}

}

module.exports = ComputeEngine;
