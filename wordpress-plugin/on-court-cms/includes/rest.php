<?php
/**
 * Campos e rotas da REST API.
 *
 * @package OnCourtCMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Namespace das rotas do plugin.
 */
const OCC_REST_NAMESPACE = 'occ/v1';

/**
 * Registra os campos agrupados na REST API.
 *
 * @return void
 */
function occ_register_rest_fields() {
	register_rest_field(
		'torneio',
		'occ_tournament',
		array(
			'get_callback'    => 'occ_get_tournament_rest_field',
			'update_callback' => null,
			'schema'          => array(
				'description' => __( 'Dados do torneio agrupados.', 'on-court-cms' ),
				'type'        => 'object',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
				'properties'  => array(
					'location'   => array( 'type' => 'string' ),
					'country'    => array( 'type' => 'string' ),
					'start_date' => array( 'type' => 'string' ),
					'end_date'   => array( 'type' => 'string' ),
					'surface'    => array( 'type' => 'string' ),
					'category'   => array( 'type' => 'string' ),
					'prize'      => array( 'type' => 'string' ),
				),
			),
		)
	);

	register_rest_field(
		'post',
		'occ_meta',
		array(
			'get_callback'    => 'occ_get_post_rest_field',
			'update_callback' => null,
			'schema'          => array(
				'description' => __( 'Campos editoriais e de SEO da matéria.', 'on-court-cms' ),
				'type'        => 'object',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
				'properties'  => array(
					'subtitle'        => array( 'type' => 'string' ),
					'seo_title'       => array( 'type' => 'string' ),
					'seo_description' => array( 'type' => 'string' ),
					'featured'        => array( 'type' => 'boolean' ),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'occ_register_rest_fields' );

/**
 * Retorna o objeto occ_tournament.
 *
 * @param array<string, mixed> $post Post serializado.
 * @return array<string, string>
 */
function occ_get_tournament_rest_field( $post ) {
	$post_id = isset( $post['id'] ) ? (int) $post['id'] : 0;

	return array(
		'location'   => (string) get_post_meta( $post_id, 'occ_location', true ),
		'country'    => (string) get_post_meta( $post_id, 'occ_country', true ),
		'start_date' => (string) get_post_meta( $post_id, 'occ_start_date', true ),
		'end_date'   => (string) get_post_meta( $post_id, 'occ_end_date', true ),
		'surface'    => (string) get_post_meta( $post_id, 'occ_surface', true ),
		'category'   => (string) get_post_meta( $post_id, 'occ_category', true ),
		'prize'      => (string) get_post_meta( $post_id, 'occ_prize', true ),
	);
}

/**
 * Retorna o objeto occ_meta.
 *
 * @param array<string, mixed> $post Post serializado.
 * @return array<string, mixed>
 */
function occ_get_post_rest_field( $post ) {
	$post_id = isset( $post['id'] ) ? (int) $post['id'] : 0;

	return array(
		'subtitle'        => (string) get_post_meta( $post_id, 'occ_subtitle', true ),
		'seo_title'       => (string) get_post_meta( $post_id, 'occ_seo_title', true ),
		'seo_description' => (string) get_post_meta( $post_id, 'occ_seo_description', true ),
		'featured'        => '1' === (string) get_post_meta( $post_id, 'occ_featured', true ),
	);
}

/**
 * Registra as rotas públicas do plugin.
 *
 * @return void
 */
function occ_register_rest_routes() {
	register_rest_route(
		OCC_REST_NAMESPACE,
		'/settings',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'occ_rest_get_settings',
			'permission_callback' => '__return_true',
		)
	);
}
add_action( 'rest_api_init', 'occ_register_rest_routes' );

/**
 * Resposta de GET /occ/v1/settings.
 *
 * Nunca expõe o segredo de revalidação.
 *
 * @return WP_REST_Response
 */
function occ_rest_get_settings() {
	$settings = occ_get_settings();
	$ads      = array();

	foreach ( array_keys( occ_get_ad_slots() ) as $slot ) {
		$ads[ $slot ] = array(
			'enabled' => '1' === (string) $settings[ $slot . '_enabled' ],
			'code'    => (string) $settings[ $slot . '_code' ],
		);
	}

	return rest_ensure_response(
		array(
			'ads'  => $ads,
			'site' => array(
				'title'       => get_bloginfo( 'name' ),
				'description' => get_bloginfo( 'description' ),
			),
		)
	);
}

/**
 * Libera CORS para o front-end Next.js.
 *
 * Envia Access-Control-Allow-Origin: * nas rotas do namespace occ/v1 e em
 * qualquer requisição GET da REST API.
 *
 * @param bool             $served  Se a resposta já foi enviada.
 * @param WP_HTTP_Response $result  Resultado da requisição.
 * @param WP_REST_Request  $request Requisição atual.
 * @return bool
 */
function occ_rest_send_cors_headers( $served, $result, $request ) {
	if ( ! $request instanceof WP_REST_Request ) {
		return $served;
	}

	$route     = (string) $request->get_route();
	$method    = strtoupper( (string) $request->get_method() );
	$is_occ    = 0 === strpos( ltrim( $route, '/' ), OCC_REST_NAMESPACE );
	$is_public = 'GET' === $method;

	if ( ( $is_occ || $is_public ) && ! headers_sent() ) {
		header( 'Access-Control-Allow-Origin: *' );
		header( 'Access-Control-Allow-Methods: GET, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce' );
		header( 'Vary: Origin', false );
	}

	return $served;
}

/**
 * Registra o filtro de CORS depois dos headers padrão do core.
 *
 * @return void
 */
function occ_init_cors() {
	add_filter( 'rest_pre_serve_request', 'occ_rest_send_cors_headers', 10, 3 );
}
add_action( 'rest_api_init', 'occ_init_cors', 15 );
