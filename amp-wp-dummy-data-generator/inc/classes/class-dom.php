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

	/**
	 * Construct method.
	 *
	 * @param string $content String containing HTML content.
	 *
	 * @throws \Exception Throws default Exception if $content is empty.
	 */
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

	/**
	 * Evaluates the given XPath expression.
	 *
	 * @param string $query The XPath expression to execute.
	 *
	 * @return DOMNodeList|false a DOMNodeList containing all nodes matching
	 * the given XPath expression. Any expression which does not return nodes
	 * will return an empty DOMNodeList. The return is false if the expression
	 * is malformed or the contextnode is invalid.
	 */
	public function query( $query ) {

		return $this->xpath->query( $query );
	}
}
