<?php
/**
 * Funções auxiliares compartilhadas.
 *
 * @package OnCourtCMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Verificação de permissão usada por todos os metadados expostos na REST API.
 *
 * @return bool
 */
function occ_meta_auth_callback() {
	return current_user_can( 'edit_posts' );
}

/**
 * Superfícies de quadra aceitas.
 *
 * @return string[]
 */
function occ_get_surfaces() {
	return array( 'Saibro', 'Duro', 'Grama', 'Carpete' );
}

/**
 * Categorias de torneio aceitas.
 *
 * @return string[]
 */
function occ_get_categories() {
	return array(
		'Grand Slam',
		'ATP Masters 1000',
		'ATP 500',
		'ATP 250',
		'WTA 1000',
		'WTA 500',
		'WTA 250',
		'Davis Cup',
		'Copa Billie Jean King',
	);
}

/**
 * Chaves de metadados do torneio e seus rótulos/tipos de campo.
 *
 * @return array<string, array<string, mixed>>
 */
function occ_get_tournament_fields() {
	return array(
		'occ_location'   => array(
			'label' => __( 'Cidade', 'on-court-cms' ),
			'type'  => 'text',
		),
		'occ_country'    => array(
			'label' => __( 'País', 'on-court-cms' ),
			'type'  => 'text',
		),
		'occ_start_date' => array(
			'label' => __( 'Data de início', 'on-court-cms' ),
			'type'  => 'date',
		),
		'occ_end_date'   => array(
			'label' => __( 'Data de término', 'on-court-cms' ),
			'type'  => 'date',
		),
		'occ_surface'    => array(
			'label'   => __( 'Piso', 'on-court-cms' ),
			'type'    => 'select',
			'options' => occ_get_surfaces(),
		),
		'occ_category'   => array(
			'label'   => __( 'Categoria', 'on-court-cms' ),
			'type'    => 'select',
			'options' => occ_get_categories(),
		),
		'occ_prize'      => array(
			'label' => __( 'Premiação', 'on-court-cms' ),
			'type'  => 'text',
		),
	);
}

/**
 * Chaves de metadados extras das notícias (post).
 *
 * @return string[]
 */
function occ_get_post_meta_keys() {
	return array( 'occ_subtitle', 'occ_seo_title', 'occ_seo_description', 'occ_featured' );
}

/**
 * Slots de anúncio e seus rótulos.
 *
 * @return array<string, string>
 */
function occ_get_ad_slots() {
	return array(
		'leaderboard'     => __( 'Banner topo (728×90)', 'on-court-cms' ),
		'rectangle'       => __( 'Banner meio (300×250)', 'on-court-cms' ),
		'large_rectangle' => __( 'Banner rodapé (336×280)', 'on-court-cms' ),
	);
}

/**
 * Valores padrão da opção occ_settings.
 *
 * @return array<string, string>
 */
function occ_get_default_settings() {
	$defaults = array(
		'revalidate_url'    => '',
		'revalidate_secret' => '',
	);

	foreach ( array_keys( occ_get_ad_slots() ) as $slot ) {
		$defaults[ $slot . '_enabled' ] = '0';
		$defaults[ $slot . '_code' ]    = '';
	}

	return $defaults;
}

/**
 * Lê a opção occ_settings já mesclada com os padrões.
 *
 * @return array<string, string>
 */
function occ_get_settings() {
	$stored = get_option( OCC_OPTION_KEY, array() );

	if ( ! is_array( $stored ) ) {
		$stored = array();
	}

	return array_merge( occ_get_default_settings(), $stored );
}

/**
 * Lê um único valor da opção occ_settings.
 *
 * @param string $key     Chave desejada.
 * @param string $default Valor padrão.
 * @return string
 */
function occ_get_setting( $key, $default = '' ) {
	$settings = occ_get_settings();

	if ( ! isset( $settings[ $key ] ) || '' === $settings[ $key ] ) {
		return $default;
	}

	return (string) $settings[ $key ];
}

/**
 * Normaliza uma data no formato YYYY-MM-DD. Retorna string vazia se inválida.
 *
 * @param string $value Valor cru.
 * @return string
 */
function occ_sanitize_date( $value ) {
	$value = sanitize_text_field( (string) $value );

	if ( '' === $value ) {
		return '';
	}

	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value ) ) {
		return '';
	}

	return $value;
}

/**
 * Garante que o valor pertença a uma lista de opções permitidas.
 *
 * @param string   $value   Valor cru.
 * @param string[] $allowed Opções permitidas.
 * @return string
 */
function occ_sanitize_choice( $value, $allowed ) {
	$value = sanitize_text_field( (string) $value );

	return in_array( $value, $allowed, true ) ? $value : '';
}

/**
 * Normaliza um valor de checkbox para '1' ou '0'.
 *
 * @param mixed $value Valor cru.
 * @return string
 */
function occ_sanitize_bool_string( $value ) {
	return ( '1' === (string) $value || 1 === $value || true === $value ) ? '1' : '0';
}
