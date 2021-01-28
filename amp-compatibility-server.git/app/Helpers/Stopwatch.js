/**
 * Stopwatch class.
 * Reference: https://github.com/joeltok/performance-stopwatch/blob/master/src/index.js
 */

const Logger = use( 'Logger' );

class Stopwatch {

	constructor( options = {} ) {
		this.name = options.name || 'Default 1: ';
		this.loggerFunc = options.loggerFunc;
		this.timings = [];
	}

	start() {
		const now = new Date().valueOf();
		this.timings.push( now );
		this._log( `stopwatch started` );
	}

	lap() {
		this._checkStarted();
		const now = new Date().valueOf();
		const lapTime = now - this.timings[ this.timings.length - 1 ];
		this.timings.push( now );
		this._log( ` ${ this.prettyPrint( lapTime ) } from previous lap.` );
		return lapTime;
	}

	total() {
		this._checkStarted();
		const now = new Date().valueOf();
		const totalTime = now - this.timings[ 0 ];
		this._log( ` ${ this.prettyPrint( totalTime ) } since started.` );
		return totalTime;
	}

	stop() {
		this.total();
		delete this;
	}

	prettyPrint( milliseconds ) {

		const parsed = this.parseMilliseconds( milliseconds );
		let timeString = [];

		for ( const period in parsed ) {
			const time = parsed[ period ];
			if ( time ) {
				timeString.push( `${ time } ${ period }` );
			}
		}

		return timeString.join( ' ' );
	}

	parseMilliseconds( milliseconds ) {
		if ( typeof milliseconds !== 'number' ) {
			throw new TypeError( 'Expected a number' );
		}

		const roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil;

		return {
			days: roundTowardsZero( milliseconds / 86400000 ),
			hours: roundTowardsZero( milliseconds / 3600000 ) % 24,
			minutes: roundTowardsZero( milliseconds / 60000 ) % 60,
			seconds: roundTowardsZero( milliseconds / 1000 ) % 60,
			milliseconds: roundTowardsZero( milliseconds ) % 1000,
			microseconds: roundTowardsZero( milliseconds * 1000 ) % 1000,
			nanoseconds: roundTowardsZero( milliseconds * 1e6 ) % 1000,
		};
	}

	_checkStarted() {
		if ( 0 === this.timings.length ) {
			throw new Error( 'stopwatch not started' );
		}
	}

	_log( message ) {
		let logString = this.name;

		logString += message;

		if ( this.loggerFunc ) {
			try {
				this.loggerFunc( logString );
			} catch ( err ) {
				throw new Error( `option loggerFunc needs to be a function` );
			}
		} else {
			Logger.debug( logString );
		}
	}
}

module.exports = Stopwatch;
