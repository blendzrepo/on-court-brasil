<?php
/**
 * Caixas de metadados do editor.
 *
 * @package OnCourtCMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra as caixas de metadados.
 *
 * @return void
 */
function occ_add_meta_boxes() {
	add_meta_box(
		'occ_tournament_box',
		__( 'On Court — Dados do torneio', 'on-court-cms' ),
		'occ_render_tournament_meta_box',
		'torneio',
		'normal',
		'high'
	);

	add_meta_box(
		'occ_post_box',
		__( 'On Court — Detalhes e SEO', 'on-court-cms' ),
		'occ_render_post_meta_box',
		'post',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'occ_add_meta_boxes' );

/**
 * CSS mínimo compartilhado pelas caixas de metadados.
 *
 * @return void
 */
function occ_meta_box_styles() {
	static $printed = false;

	if ( $printed ) {
		return;
	}

	$printed = true;
	?>
	<style>
		.occ-field { margin: 0 0 16px; }
		.occ-field > label { display: block; font-weight: 600; margin-bottom: 4px; }
		.occ-field input[type="text"], .occ-field textarea, .occ-field select { width: 100%; max-width: 100%; }
		.occ-field input[type="date"] { max-width: 220px; }
		.occ-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
		.occ-hint { color: #646970; font-size: 12px; margin: 4px 0 0; }
		.occ-counter { font-variant-numeric: tabular-nums; font-weight: 600; }
		.occ-counter.occ-over { color: #d63638; }
		@media (max-width: 782px) { .occ-grid { grid-template-columns: 1fr; } }
	</style>
	<?php
}

/**
 * Renderiza a caixa de metadados do torneio.
 *
 * @param WP_Post $post Post atual.
 * @return void
 */
function occ_render_tournament_meta_box( $post ) {
	wp_nonce_field( 'occ_save_tournament_meta', 'occ_tournament_nonce' );
	occ_meta_box_styles();

	$fields = occ_get_tournament_fields();
	?>
	<div class="occ-grid">
		<?php
		foreach ( $fields as $key => $field ) :
			$value = (string) get_post_meta( $post->ID, $key, true );
			$id    = 'occ-field-' . sanitize_html_class( $key );
			?>
			<div class="occ-field">
				<label for="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $field['label'] ); ?></label>
				<?php if ( 'select' === $field['type'] ) : ?>
					<select id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $key ); ?>">
						<option value=""><?php esc_html_e( '— Selecione —', 'on-court-cms' ); ?></option>
						<?php foreach ( $field['options'] as $option ) : ?>
							<option value="<?php echo esc_attr( $option ); ?>" <?php selected( $value, $option ); ?>>
								<?php echo esc_html( $option ); ?>
							</option>
						<?php endforeach; ?>
					</select>
				<?php elseif ( 'date' === $field['type'] ) : ?>
					<input type="date" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( $value ); ?>" />
					<p class="occ-hint"><?php esc_html_e( 'Formato AAAA-MM-DD.', 'on-court-cms' ); ?></p>
				<?php else : ?>
					<input type="text" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( $value ); ?>" />
				<?php endif; ?>
			</div>
		<?php endforeach; ?>
	</div>
	<?php
}

/**
 * Renderiza a caixa de metadados das notícias.
 *
 * @param WP_Post $post Post atual.
 * @return void
 */
function occ_render_post_meta_box( $post ) {
	wp_nonce_field( 'occ_save_post_meta', 'occ_post_nonce' );
	occ_meta_box_styles();

	$subtitle        = (string) get_post_meta( $post->ID, 'occ_subtitle', true );
	$seo_title       = (string) get_post_meta( $post->ID, 'occ_seo_title', true );
	$seo_description = (string) get_post_meta( $post->ID, 'occ_seo_description', true );
	$featured        = '1' === (string) get_post_meta( $post->ID, 'occ_featured', true );
	?>
	<div class="occ-field">
		<label for="occ-field-subtitle"><?php esc_html_e( 'Subtítulo', 'on-court-cms' ); ?></label>
		<input type="text" id="occ-field-subtitle" name="occ_subtitle" value="<?php echo esc_attr( $subtitle ); ?>" />
		<p class="occ-hint"><?php esc_html_e( 'Linha de apoio exibida abaixo do título na home e na matéria.', 'on-court-cms' ); ?></p>
	</div>

	<div class="occ-field">
		<label for="occ-field-featured">
			<input type="checkbox" id="occ-field-featured" name="occ_featured" value="1" <?php checked( $featured ); ?> />
			<?php esc_html_e( 'Marcar como destaque na home', 'on-court-cms' ); ?>
		</label>
		<p class="occ-hint"><?php esc_html_e( 'A matéria em destaque aparece como manchete principal.', 'on-court-cms' ); ?></p>
	</div>

	<hr />

	<div class="occ-field">
		<label for="occ-field-seo-title"><?php esc_html_e( 'SEO: Título para o Google', 'on-court-cms' ); ?></label>
		<input type="text" id="occ-field-seo-title" name="occ_seo_title" value="<?php echo esc_attr( $seo_title ); ?>" data-occ-counter="occ-counter-seo-title" data-occ-limit="60" />
		<p class="occ-hint">
			<?php esc_html_e( 'recomendado até 60 caracteres', 'on-court-cms' ); ?>
			— <span class="occ-counter" id="occ-counter-seo-title"><?php echo esc_html( (string) mb_strlen( $seo_title ) ); ?></span>/60
		</p>
	</div>

	<div class="occ-field">
		<label for="occ-field-seo-description"><?php esc_html_e( 'SEO: Meta descrição', 'on-court-cms' ); ?></label>
		<textarea id="occ-field-seo-description" name="occ_seo_description" rows="3" data-occ-counter="occ-counter-seo-description" data-occ-limit="155"><?php echo esc_textarea( $seo_description ); ?></textarea>
		<p class="occ-hint">
			<?php esc_html_e( 'recomendado até 155 caracteres', 'on-court-cms' ); ?>
			— <span class="occ-counter" id="occ-counter-seo-description"><?php echo esc_html( (string) mb_strlen( $seo_description ) ); ?></span>/155
		</p>
	</div>

	<script>
	( function () {
		var fields = document.querySelectorAll( '[data-occ-counter]' );
		Array.prototype.forEach.call( fields, function ( field ) {
			var target = document.getElementById( field.getAttribute( 'data-occ-counter' ) );
			var limit = parseInt( field.getAttribute( 'data-occ-limit' ), 10 ) || 0;
			if ( ! target ) {
				return;
			}
			var update = function () {
				var length = field.value.length;
				target.textContent = String( length );
				if ( limit && length > limit ) {
					target.classList.add( 'occ-over' );
				} else {
					target.classList.remove( 'occ-over' );
				}
			};
			field.addEventListener( 'input', update );
			update();
		} );
	}() );
	</script>
	<?php
}

/**
 * Salva os metadados das caixas do editor.
 *
 * @param int     $post_id ID do post.
 * @param WP_Post $post    Objeto do post.
 * @return void
 */
function occ_save_meta_boxes( $post_id, $post = null ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}

	$post_type = $post instanceof WP_Post ? $post->post_type : get_post_type( $post_id );

	if ( ! in_array( $post_type, array( 'post', 'torneio' ), true ) ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	if ( 'torneio' === $post_type ) {
		if ( ! isset( $_POST['occ_tournament_nonce'] ) ) {
			return;
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['occ_tournament_nonce'] ) );

		if ( ! wp_verify_nonce( $nonce, 'occ_save_tournament_meta' ) ) {
			return;
		}

		foreach ( array_keys( occ_get_tournament_fields() ) as $key ) {
			$raw   = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : '';
			$value = occ_sanitize_meta( $raw, $key, 'post' );

			if ( '' === $value ) {
				delete_post_meta( $post_id, $key );
			} else {
				update_post_meta( $post_id, $key, $value );
			}
		}

		return;
	}

	if ( ! isset( $_POST['occ_post_nonce'] ) ) {
		return;
	}

	$nonce = sanitize_text_field( wp_unslash( $_POST['occ_post_nonce'] ) );

	if ( ! wp_verify_nonce( $nonce, 'occ_save_post_meta' ) ) {
		return;
	}

	foreach ( array( 'occ_subtitle', 'occ_seo_title', 'occ_seo_description' ) as $key ) {
		$raw   = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : '';
		$value = occ_sanitize_meta( $raw, $key, 'post' );

		if ( '' === $value ) {
			delete_post_meta( $post_id, $key );
		} else {
			update_post_meta( $post_id, $key, $value );
		}
	}

	$featured = isset( $_POST['occ_featured'] ) ? occ_sanitize_bool_string( wp_unslash( $_POST['occ_featured'] ) ) : '0';
	update_post_meta( $post_id, 'occ_featured', $featured );
}
add_action( 'save_post', 'occ_save_meta_boxes', 10, 2 );
