<?php
/**
 * Tipos de conteúdo e metadados registrados.
 *
 * @package OnCourtCMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra o CPT "torneio".
 *
 * @return void
 */
function occ_register_post_types() {
	$labels = array(
		'name'                  => __( 'Torneios', 'on-court-cms' ),
		'singular_name'         => __( 'Torneio', 'on-court-cms' ),
		'menu_name'             => __( 'Torneios', 'on-court-cms' ),
		'name_admin_bar'        => __( 'Torneio', 'on-court-cms' ),
		'add_new'               => __( 'Adicionar novo', 'on-court-cms' ),
		'add_new_item'          => __( 'Adicionar novo torneio', 'on-court-cms' ),
		'new_item'              => __( 'Novo torneio', 'on-court-cms' ),
		'edit_item'             => __( 'Editar torneio', 'on-court-cms' ),
		'view_item'             => __( 'Ver torneio', 'on-court-cms' ),
		'view_items'            => __( 'Ver torneios', 'on-court-cms' ),
		'all_items'             => __( 'Todos os torneios', 'on-court-cms' ),
		'search_items'          => __( 'Buscar torneios', 'on-court-cms' ),
		'parent_item_colon'     => __( 'Torneio superior:', 'on-court-cms' ),
		'not_found'             => __( 'Nenhum torneio encontrado.', 'on-court-cms' ),
		'not_found_in_trash'    => __( 'Nenhum torneio na lixeira.', 'on-court-cms' ),
		'featured_image'        => __( 'Imagem do torneio', 'on-court-cms' ),
		'set_featured_image'    => __( 'Definir imagem do torneio', 'on-court-cms' ),
		'remove_featured_image' => __( 'Remover imagem do torneio', 'on-court-cms' ),
		'use_featured_image'    => __( 'Usar como imagem do torneio', 'on-court-cms' ),
		'archives'              => __( 'Arquivo de torneios', 'on-court-cms' ),
		'insert_into_item'      => __( 'Inserir no torneio', 'on-court-cms' ),
		'uploaded_to_this_item' => __( 'Enviado para este torneio', 'on-court-cms' ),
		'filter_items_list'     => __( 'Filtrar lista de torneios', 'on-court-cms' ),
		'items_list_navigation' => __( 'Navegação da lista de torneios', 'on-court-cms' ),
		'items_list'            => __( 'Lista de torneios', 'on-court-cms' ),
		'item_published'        => __( 'Torneio publicado.', 'on-court-cms' ),
		'item_updated'          => __( 'Torneio atualizado.', 'on-court-cms' ),
	);

	$args = array(
		'labels'             => $labels,
		'description'        => __( 'Torneios do calendário ATP, WTA e demais competições.', 'on-court-cms' ),
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'show_in_nav_menus'  => true,
		'show_in_admin_bar'  => true,
		'show_in_rest'       => true,
		'rest_base'          => 'torneio',
		'menu_position'      => 21,
		'menu_icon'          => 'dashicons-calendar-alt',
		'capability_type'    => 'post',
		'hierarchical'       => false,
		'has_archive'        => false,
		'rewrite'            => array(
			'slug'       => 'torneio',
			'with_front' => false,
		),
		'query_var'          => true,
		/*
		 * 'custom-fields' é obrigatório para que os metadados registrados com
		 * show_in_rest apareçam (e possam ser gravados) no campo "meta" da
		 * REST API deste CPT.
		 */
		'supports'           => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
	);

	register_post_type( 'torneio', $args );
}
add_action( 'init', 'occ_register_post_types' );

/**
 * Sanitiza os metadados do plugin de acordo com a chave.
 *
 * @param mixed  $meta_value  Valor cru.
 * @param string $meta_key    Chave do metadado.
 * @param string $object_type Tipo de objeto.
 * @return string
 */
function occ_sanitize_meta( $meta_value, $meta_key = '', $object_type = '' ) {
	unset( $object_type );

	switch ( $meta_key ) {
		case 'occ_start_date':
		case 'occ_end_date':
			return occ_sanitize_date( $meta_value );

		case 'occ_surface':
			return occ_sanitize_choice( $meta_value, occ_get_surfaces() );

		case 'occ_category':
			return occ_sanitize_choice( $meta_value, occ_get_categories() );

		case 'occ_featured':
			return occ_sanitize_bool_string( $meta_value );

		case 'occ_seo_description':
			return sanitize_textarea_field( (string) $meta_value );

		default:
			return sanitize_text_field( (string) $meta_value );
	}
}

/**
 * Registra os metadados de torneios e notícias para a REST API.
 *
 * @return void
 */
function occ_register_meta() {
	$base = array(
		'single'            => true,
		'type'              => 'string',
		'show_in_rest'      => true,
		'sanitize_callback' => 'occ_sanitize_meta',
		'auth_callback'     => 'occ_meta_auth_callback',
	);

	foreach ( occ_get_tournament_fields() as $key => $field ) {
		register_post_meta(
			'torneio',
			$key,
			array_merge(
				$base,
				array(
					'description' => $field['label'],
					'default'     => '',
				)
			)
		);
	}

	$post_descriptions = array(
		'occ_subtitle'        => __( 'Subtítulo da matéria', 'on-court-cms' ),
		'occ_seo_title'       => __( 'Título para o Google', 'on-court-cms' ),
		'occ_seo_description' => __( 'Meta descrição', 'on-court-cms' ),
		'occ_featured'        => __( 'Destaque na home', 'on-court-cms' ),
	);

	foreach ( occ_get_post_meta_keys() as $key ) {
		register_post_meta(
			'post',
			$key,
			array_merge(
				$base,
				array(
					'description' => isset( $post_descriptions[ $key ] ) ? $post_descriptions[ $key ] : '',
					'default'     => 'occ_featured' === $key ? '0' : '',
				)
			)
		);
	}
}
add_action( 'init', 'occ_register_meta' );
