'use strict';

const path = require( 'path' );

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
|
| Providers are building blocks for your Adonis app. Anytime you install
| a new Adonis specific package, chances are you will register the
| provider here.
|
*/
const providers = [
	'@adonisjs/framework/providers/AppProvider',
	'@adonisjs/framework/providers/ViewProvider',
	'@adonisjs/session/providers/SessionProvider',
	'@adonisjs/auth/providers/AuthProvider',
	'@adonisjs/bodyparser/providers/BodyParserProvider',
	'@adonisjs/cors/providers/CorsProvider',
	'@adonisjs/lucid/providers/LucidProvider',
	'@adonisjs/redis/providers/RedisProvider',
	'@adonisjs/validator/providers/ValidatorProvider',
	'@adonisjs/ally/providers/AllyProvider',
	'adonis-throttle/providers/ThrottleProvider',
	path.join( __dirname, '..', 'providers', 'BigQueryProvider' ),
	path.join( __dirname, '..', 'providers', 'Sanitizer/Provider' ),
	path.join( __dirname, '..', 'providers', 'Validator/Provider' ),
	path.join( __dirname, '..', 'providers', 'Queue/Provider' ),
	path.join( __dirname, '..', 'providers', 'Storage/Provider' ),
];

/*
|--------------------------------------------------------------------------
| Ace Providers
|--------------------------------------------------------------------------
|
| Ace providers are required only when running ace commands. For example
| Providers for migrations, tests etc.
|
*/
const aceProviders = [
	'@adonisjs/lucid/providers/MigrationsProvider',
];

/*
|--------------------------------------------------------------------------
| Aliases
|--------------------------------------------------------------------------
|
| Aliases are short unique names for IoC container bindings. You are free
| to create your own aliases.
|
| For example:
|   { Route: 'Adonis/Src/Route' }
|
*/
const aliases = {
	Throttle: 'Adonis/Addons/Throttle',
};

/*
|--------------------------------------------------------------------------
| Commands
|--------------------------------------------------------------------------
|
| Here you store ace commands for your package
|
*/
const commands = [
	'App/Commands/WporgScraper',
	'App/Commands/WorkerStart',
	'App/Commands/UserCreate',
	'App/Commands/UserRemove',
	'App/Commands/SyntheticQueueRefill',
	'App/Commands/SyntheticDataStart',
	'App/Commands/AdhocSyntheticDataAdd',
	'App/Commands/ExtensionVersionVerify',
	'App/Commands/UpdateComputeFieldsExtensionVersion',
	'App/Commands/BigQueryUpdate',
	'App/Commands/RetryJob',
];

module.exports = { providers, aceProviders, aliases, commands };
