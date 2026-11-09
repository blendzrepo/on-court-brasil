<?php
/**
 * Webhook de revalidação do front-end Next.js.
 *
 * @package OnCourtCMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tipos de conteúdo que disparam a revalidação.
 *
 * @return string[]
 */
function occ_get_revalidated_post_types() {
	return array( 'post', 'torneio' );
}

/**
 * Dispara o POST não bloqueante para o endpoint de revalidação.
 *
 * Sai em silêncio se a URL ou o segredo não estiverem configurados.
 *
 * @param string $type Tipo de conteúdo.
 * @param string $slug Slug do conteúdo.
 * @return void
 */
function occ_trigger_revalidate( $type, $slug ) {
	$url    = occ_get_setting( 'revalidate_url' );
	$secret = occ_get_setting( 'revalidate_secret' );

	if ( '' === $url || '' === $secret ) {
		return;
	}

	$endpoint = add_query_arg(
		array( 'secret' => rawurlencode( $secret ) ),
		untrailingslashit( $url ) . '/api/revalidate'
	);

	wp_remote_post(
		$endpoint,
		array(
			'blocking' => false,
			'timeout'  => 2,
			'headers'  => array( 'Content-Type' => 'application/json' ),
			'body'     => wp_json_encode(
				array(
					'type' => (string) $type,
					'slug' => (string) $slug,
				)
			),
		)
	);
}

/**
 * Revalida ao salvar uma notícia ou torneio.
 *
 * @param int     $post_id ID do post.
 * @param WP_Post $post    Objeto do post.
 * @return void
 */
function occ_revalidate_on_save( $post_id, $post = null ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}

	if ( ! $post instanceof WP_Post ) {
		$post = get_post( $post_id );
	}

	if ( ! $post instanceof WP_Post ) {
		return;
	}

	if ( ! in_array( $post->post_type, occ_get_revalidated_post_types(), true ) ) {
		return;
	}

	if ( 'auto-draft' === $post->post_status ) {
		return;
	}

	occ_trigger_revalidate( $post->post_type, $post->post_name );
}
add_action( 'save_post', 'occ_revalidate_on_save', 20, 2 );

/**
 * Revalida ao excluir definitivamente uma notícia ou torneio.
 *
 * @param int $post_id ID do post.
 * @return void
 */
function occ_revalidate_on_delete( $post_id ) {
	$post = get_post( $post_id );

	if ( ! $post instanceof WP_Post ) {
		return;
	}

	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}

	if ( ! in_array( $post->post_type, occ_get_revalidated_post_types(), true ) ) {
		return;
	}

	occ_trigger_revalidate( $post->post_type, $post->post_name );
}
add_action( 'delete_post', 'occ_revalidate_on_delete', 10, 1 );
