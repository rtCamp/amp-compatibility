<?php
/**
 * Group of function for DOM manipulation.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

/**
 * Helper class to traverse through HTML DOM.
 */
class Dom {

	/**
	 * DOM xpath.
	 *
	 * @var \DOMXPath
	 */
	public $xpath = false;

	/**
	 * DOM Document.
	 *
	 * @var \DOMDocument
	 */
	public $dom_document = false;

	public function __construct( $content ) {

		if ( empty( $content ) ) {
			throw new \Exception( 'Please provide HTML content.' );
		}

		$html = mb_convert_encoding( $content, 'HTML-ENTITIES', 'UTF-8' );

		$this->dom_document = new \DOMDocument( '1.0', 'utf-8' );

		// Set error level.
		$internal_errors = libxml_use_internal_errors( true );

		@$this->dom_document->loadHTML( $html ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,Generic.PHP.NoSilencedErrors.Forbidden

		// Restore error level.
		libxml_use_internal_errors( $internal_errors );

		$this->xpath = new \DOMXPath( $this->dom_document );

	}

	public function query( $query ) {

		return $this->xpath->query( $query );
	}

}
