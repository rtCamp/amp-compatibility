<?php

namespace Deployer;

//adds common necessities for the deployment
require 'recipe/common.php';

set( 'ssh_type', 'native' );
set( 'ssh_multiplexing', true );

set( 'shared_dirs', [ 'private' ] );

set( 'writable_dirs', [
	'private',
] );

if ( file_exists( 'vendor/deployer/recipes/recipe/rsync.php' ) ) {
	require 'vendor/deployer/recipes/recipe/rsync.php';
} else {
	require getenv( 'COMPOSER_HOME' ) . '/vendor/deployer/recipes/recipe/rsync.php';
}

inventory( '/hosts.yml' );

$deployer = Deployer::get();
$hosts    = $deployer->hosts;

foreach ( $hosts as $host ) {
	$host
		->addSshOption( 'UserKnownHostsFile', '/dev/null' )
		->addSshOption( 'StrictHostKeyChecking', 'no' );

	$deployer->hosts->set( $host->getHostname(), $host );
}

set( 'rsync', [
	'exclude'       => [
		'.git',
		'.github',
		'deploy.php',
		'composer.lock',
		'.env',
		'.env.example',
		'.gitignore',
		'.gitlab-ci.yml',
		'Gruntfile.js',
		'README.md',
		'gulpfile.js',
		'.circleci',
		'phpcs.xml',
	],
	'exclude-file'  => true,
	'include'       => [],
	'include-file'  => false,
	'filter'        => [],
	'filter-file'   => false,
	'filter-perdir' => false,
	'flags'         => 'rz', // Recursive, with compress
	'options'       => [ 'delete', 'delete-excluded', 'links', 'no-perms', 'no-owner', 'no-group' ],
	'timeout'       => 300,
] );
set( 'rsync_src', getenv( 'build_root' ) );
set( 'rsync_dest', '{{release_path}}' );


/*  custom task defination    */
desc( 'Symlink .env' );
task( 'set:env', function () {

	$output = run( '[ ! -f {{release_path}}/.env ] && cd {{release_path}} && ln -sn ../../.env . && echo "Created Symlink for .env." || echo ""' );
	writeln( '<info>' . $output . '</info>' );
} );


desc( 'Correct Permissions' );
task( 'permissions:set', function () {

	$output = run( 'chown -R root: {{deploy_path}}' );
	writeln( '<info>' . $output . '</info>' );
} );

desc( 'Restart pm2' );
task( 'restart:pm2', function () {

	$output = run( 'cd {{release_path}} && pm2 restart ecosystem.config.js' );
	writeln( '<info>' . $output . '</info>' );
} );

/*   deployment task   */
desc( 'Deploy the project' );
task( 'deploy', [
	'deploy:prepare',
	'deploy:unlock',
	'deploy:lock',
	'deploy:release',
	'rsync',
	'set:env',
	'deploy:shared',
	'deploy:symlink',
	'permissions:set',
	'restart:pm2',
	'deploy:unlock',
	'cleanup',
] );
after( 'deploy', 'success' );
