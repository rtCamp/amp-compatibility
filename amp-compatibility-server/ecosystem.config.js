// https://pm2.io/docs/runtime/reference/ecosystem-file/

// This is needed for getting proper current working directory in case of symlinked release directory.
const cwd = __dirname;
module.exports = {
	apps: [
		{
			name: 'AMP-WP-Dashboard',
			cwd: cwd,
			script: 'server.js',
			instances: 1,
			log_date_format: "YYYY-MM-DD HH:mm Z",
			autorestart: true,
			watch: false,
			out_file: "/var/log/adonis/out.log",
			error_file: "/var/log/adonis/error.log",
			combine_logs: true,
		},
		{
			name: 'request-queue-worker',
			cwd: cwd,
			script: 'node ace worker:start --name=request --concurrency=10',
			instances: 1,
			log_date_format: "YYYY-MM-DD HH:mm Z",
			autorestart: true,
			watch: false,
			out_file: "/var/log/adonis/request-out.log",
			error_file: "/var/log/adonis/request-error.log",
			combine_logs: true,
		},
		{
			name: 'adhoc-queue-worker',
			cwd: cwd,
			script: 'node ace worker:start --name=adhoc-synthetic-data --concurrency=1',
			instances: 1,
			log_date_format: "YYYY-MM-DD HH:mm Z",
			autorestart: true,
			watch: false,
			out_file: "/var/log/adonis/adhoc-synthetic-out.log",
			error_file: "/var/log/adonis/adhoc-synthetic-error.log",
			combine_logs: true,
		},
	],
};