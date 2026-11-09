<?php
/**
 * Permite o envio de SVG na biblioteca de mídia.
 *
 * O WordPress bloqueia SVG por padrão, e com razão: um SVG é um documento XML
 * que pode carregar <script> e executar no navegador de quem o abre. As capas
 * de categoria deste site são SVG, então o envio precisa ser liberado — mas
 * apenas para quem administra o site, e com o conteúdo higienizado antes de
 * gravar, para que um arquivo com script nunca chegue à biblioteca.
 *
 * @package on-court-cms
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Libera o mime type de SVG somente para quem pode enviar arquivos sem restrição.
 *
 * @param array $mimes Mime types permitidos.
 * @return array
 */
function occ_allow_svg_upload( $mimes ) {
	if ( ! current_user_can( 'unfiltered_upload' ) && ! current_user_can( 'manage_options' ) ) {
		return $mimes;
	}

	$mimes['svg']  = 'image/svg+xml';
	$mimes['svgz'] = 'image/svg+xml';

	return $mimes;
}
add_filter( 'upload_mimes', 'occ_allow_svg_upload' );

/**
 * Corrige a checagem de tipo real do arquivo para SVG.
 *
 * O wp_check_filetype_and_ext() usa finfo, que costuma devolver "text/plain"
 * para SVG. Sem este ajuste o envio é recusado mesmo com o mime liberado.
 *
 * @param array  $data     Dados do arquivo (ext, type, proper_filename).
 * @param string $file     Caminho temporário do arquivo.
 * @param string $filename Nome do arquivo.
 * @param array  $mimes    Mime types permitidos.
 * @return array
 */
function occ_fix_svg_filetype( $data, $file, $filename, $mimes ) {
	unset( $file, $mimes );

	if ( ! empty( $data['type'] ) ) {
		return $data;
	}

	$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );

	if ( 'svg' === $ext || 'svgz' === $ext ) {
		$data['ext']  = $ext;
		$data['type'] = 'image/svg+xml';
	}

	return $data;
}
add_filter( 'wp_check_filetype_and_ext', 'occ_fix_svg_filetype', 10, 4 );

/**
 * Remove scripts e handlers de evento de um SVG antes de gravá-lo.
 *
 * Recusa o envio quando o arquivo não é XML válido, para que um arquivo
 * disfarçado de SVG não entre na biblioteca.
 *
 * @param array $upload Dados do upload ('file', 'url', 'type', 'error').
 * @return array
 */
function occ_sanitize_svg_upload( $upload ) {
	if ( empty( $upload['type'] ) || 'image/svg+xml' !== $upload['type'] ) {
		return $upload;
	}

	if ( empty( $upload['file'] ) || ! file_exists( $upload['file'] ) ) {
		return $upload;
	}

	$contents = file_get_contents( $upload['file'] ); // phpcs:ignore WordPress.WP.AlternativeFunctions

	if ( false === $contents || '' === trim( $contents ) ) {
		$upload['error'] = __( 'Não foi possível ler o arquivo SVG enviado.', 'on-court-cms' );
		return $upload;
	}

	$previous = libxml_use_internal_errors( true );
	$document = new DOMDocument();
	$loaded   = $document->loadXML( $contents );
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );

	if ( ! $loaded || ! $document->documentElement ) {
		$upload['error'] = __( 'O arquivo enviado não é um SVG válido.', 'on-court-cms' );
		return $upload;
	}

	if ( 'svg' !== strtolower( $document->documentElement->nodeName ) ) {
		$upload['error'] = __( 'O arquivo enviado não é um SVG válido.', 'on-court-cms' );
		return $upload;
	}

	$removed = occ_strip_svg_scripts( $document );

	if ( $removed > 0 ) {
		$sanitized = $document->saveXML();

		if ( false === $sanitized ) {
			$upload['error'] = __( 'Não foi possível higienizar o SVG enviado.', 'on-court-cms' );
			return $upload;
		}

		file_put_contents( $upload['file'], $sanitized ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	}

	return $upload;
}
add_filter( 'wp_handle_upload', 'occ_sanitize_svg_upload' );

/**
 * Remove elementos e atributos executáveis de um documento SVG.
 *
 * @param DOMDocument $document Documento a higienizar.
 * @return int Quantidade de itens removidos.
 */
function occ_strip_svg_scripts( DOMDocument $document ) {
	$removed = 0;

	$blocked_tags = array( 'script', 'foreignObject', 'iframe', 'embed', 'object', 'handler', 'set', 'use' );

	foreach ( $blocked_tags as $tag ) {
		$nodes = $document->getElementsByTagName( $tag );

		// A lista é viva: percorrer de trás para frente evita pular elementos.
		for ( $i = $nodes->length - 1; $i >= 0; $i-- ) {
			$node = $nodes->item( $i );

			if ( $node && $node->parentNode ) {
				$node->parentNode->removeChild( $node );
				++$removed;
			}
		}
	}

	$xpath = new DOMXPath( $document );
	$nodes = $xpath->query( '//*' );

	if ( $nodes ) {
		foreach ( $nodes as $node ) {
			if ( ! $node->attributes ) {
				continue;
			}

			for ( $i = $node->attributes->length - 1; $i >= 0; $i-- ) {
				$attribute = $node->attributes->item( $i );

				if ( ! $attribute ) {
					continue;
				}

				$name  = strtolower( $attribute->nodeName );
				$value = trim( $attribute->nodeValue );

				$is_event   = 0 === strpos( $name, 'on' );
				$is_script  = (bool) preg_match( '/(javascript|data:text\/html)/i', $value );
				$is_dangerous_href = in_array( $name, array( 'href', 'xlink:href' ), true ) && $is_script;

				if ( $is_event || $is_dangerous_href || ( $is_script && 'style' === $name ) ) {
					$node->removeAttribute( $attribute->nodeName );
					++$removed;
				}
			}
		}
	}

	return $removed;
}
