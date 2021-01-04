'use strict';

const { Command } = require( '@adonisjs/ace' );
const Compute = require( '@google-cloud/compute' );
const compute = new Compute();
const zone = compute.zone( 'us-east1-b' );
const Env = use( 'Env' );
const fs = require( 'fs' );
const sshExec = require( 'ssh-exec' );
const { exec } = require( 'child_process' );
const deployKeyPath = Env.get( 'DEPLOY_KEY_PATH', '~/.ssh/id_rsa_gcloud' );
const Utility = use( 'App/Helpers/Utility' );
const vmName = 'synthetic-data-generator';
const numberOfSites = 5;
class SyntheticData extends Command {
	static get signature() {
		return 'synthetic:data';
	}

	static get description() {
		return 'Generates synthetic data.';
	}

	async handle( args, options ) {

		await this.createVM();
		await this.bootstrap();
		// await this.deleteVM();
	}

	async createVM() {

		console.log( 'Starting VM creation.' );
		const sshPubKey = fs.readFileSync( deployKeyPath + '.pub' );
		const config = {
			http: true,
			machineType: 'e2-standard-4',
			// machineType: 'e2-micro',
			disks: [
				{
					boot: true,
					initializeParams: {
						sourceImage:
							'https://www.googleapis.com/compute/v1/projects' +
							'/ubuntu-os-cloud/global/images/ubuntu-minimal-2004-focal-v20201211',
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
		const [ vm, operation ] = await zone.createVM( vmName, config );
		await operation.promise();
		const ip = await this.getIP( vm );
		console.log( `VM created with IP: ${ ip }` );
	}

	async getIP( vm = zone.vm( vmName ) ) {

		const metadata = await vm.getMetadata();
		return metadata[ 0 ].networkInterfaces[ 0 ].accessConfigs[ 0 ].natIP;
	}

	async deleteVM() {

		const vm = zone.vm( vmName );
		const [ operation ] = await vm.delete();
		await operation.promise();
		console.log( 'VM deleted!' );
	}

	async bootstrap() {

		console.log( 'Waiting 120s for VM to be operational.' );
		const ip = await this.getIP();
		await Utility.sleep( 90 );

		await this.execCommand( 'ssh-keygen -f ~/.ssh/known_hosts -R "' + ip + '"' );
		await this.execCommand( 'ssh-keyscan -H "' + ip + '" >> ~/.ssh/known_hosts' );

		await Utility.sleep( 30 );
		console.log( 'Setting up SSH keys' );
		const sshPrivKey = fs.readFileSync( deployKeyPath );
		await this.execRemoteCommand( "echo '" + sshPrivKey + "' > ~/.ssh/id_rsa" );
		await this.execRemoteCommand( 'chmod 600 ~/.ssh/id_rsa' );
		let projectRoot = Env.get( 'PROJECT_ROOT', '' );
		projectRoot    += projectRoot.endsWith( '/' ) ? '' : '/';

		console.log( 'Copying initial setup script.' );
		await this.copyFileToRemote( projectRoot + 'scripts/setup-server.sh', '/root/setup-server.sh' );
		await this.copyFileToRemote( projectRoot + 'scripts/site.sh', '/root/site.sh' );
		console.log( 'Installing and setting up the server.' );
		await this.execRemoteCommand( 'bash -x /root/setup-server.sh > /var/log/init.log 2>&1' );
		await this.execRemoteCommand( 'bash -x /root/site.sh ' + numberOfSites + ' > /var/log/site.log 2>&1' );
	}

	async copyFileToRemote( localPath, remotePath ) {

		const ip = await this.getIP();
		await this.execRemoteCommand( 'command -v rsync || apt update && apt install -y rsync' );
		await this.execCommand( 'command -v rsync || apt install -y rsync' );
		await this.execCommand( 'rsync -avzhP ' + localPath + ' root@' + ip + ':' + remotePath );
	}

	async execCommand( command ) {

		exec( command, ( error, stdout, stderr ) => {
			if ( error ) {
				console.log( `error: ${ error.message }` );
				return;
			}
			if ( stderr ) {
				console.log( `stderr: ${ stderr }` );
				return;
			}
			console.log( stdout );
			return stdout;
		} );
	}

	async execRemoteCommand( command ) {

		const ip = await this.getIP();
		sshExec( command, {
			user: 'root',
			host: ip,
			key: deployKeyPath,
		}, function ( error, stdout, stderr ) {
			if ( error ) {
				console.log( `error: ${ error.message }` );
				return;
			}
			if ( stderr ) {
				console.log( `stderr: ${ stderr }` );
				return;
			}
			console.log( stdout );
		} );
	}
}

module.exports = SyntheticData;
