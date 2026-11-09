<?php
/**
 * Página de configurações (anúncios e revalidação).
 *
 * @package OnCourtCMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Slug da página de configurações.
 */
const OCC_SETTINGS_PAGE  = 'on-court-cms';
const OCC_SETTINGS_GROUP = 'occ_settings_group';

/**
 * Adiciona o menu de topo do plugin.
 *
 * @return void
 */
function occ_add_admin_menu() {
	add_menu_page(
		__( 'On Court CMS', 'on-court-cms' ),
		__( 'On Court CMS', 'on-court-cms' ),
		'manage_options',
		OCC_SETTINGS_PAGE,
		'occ_render_settings_page',
		'dashicons-megaphone',
		20
	);
}
add_action( 'admin_menu', 'occ_add_admin_menu' );

/**
 * Registra a opção, as seções e os campos via Settings API.
 *
 * @return void
 */
function occ_register_settings() {
	register_setting(
		OCC_SETTINGS_GROUP,
		OCC_OPTION_KEY,
		array(
			'type'              => 'array',
			'description'       => __( 'Configurações de anúncios e revalidação do On Court CMS.', 'on-court-cms' ),
			'sanitize_callback' => 'occ_sanitize_settings',
			'default'           => occ_get_default_settings(),
			'show_in_rest'      => false,
		)
	);

	add_settings_section(
		'occ_section_ads',
		__( 'Anúncios', 'on-court-cms' ),
		'occ_render_ads_section_intro',
		OCC_SETTINGS_PAGE
	);

	foreach ( occ_get_ad_slots() as $slot => $label ) {
		add_settings_field(
			'occ_field_' . $slot,
			$label,
			'occ_render_ad_slot_field',
			OCC_SETTINGS_PAGE,
			'occ_section_ads',
			array(
				'slot'      => $slot,
				'label'     => $label,
				'label_for' => 'occ-' . $slot . '-code',
			)
		);
	}

	add_settings_section(
		'occ_section_revalidate',
		__( 'Revalidação do site (Next.js)', 'on-court-cms' ),
		'occ_render_revalidate_section_intro',
		OCC_SETTINGS_PAGE
	);

	add_settings_field(
		'occ_field_revalidate_url',
		__( 'URL do site', 'on-court-cms' ),
		'occ_render_text_field',
		OCC_SETTINGS_PAGE,
		'occ_section_revalidate',
		array(
			'key'         => 'revalidate_url',
			'placeholder' => 'https://oncourt.com.br',
			'hint'        => __( 'Endereço do front-end Next.js, sem barra no final.', 'on-court-cms' ),
			'label_for'   => 'occ-revalidate_url',
		)
	);

	add_settings_field(
		'occ_field_revalidate_secret',
		__( 'Segredo compartilhado', 'on-court-cms' ),
		'occ_render_text_field',
		OCC_SETTINGS_PAGE,
		'occ_section_revalidate',
		array(
			'key'       => 'revalidate_secret',
			'hint'      => __( 'Mesmo valor da variável REVALIDATE_SECRET no Next.js.', 'on-court-cms' ),
			'label_for' => 'occ-revalidate_secret',
		)
	);
}
add_action( 'admin_init', 'occ_register_settings' );

/**
 * Texto introdutório da seção de anúncios.
 *
 * @return void
 */
function occ_render_ads_section_intro() {
	echo '<p>' . esc_html__( 'Cole aqui os blocos de anúncio do Google AdSense. O código é entregue ao front-end exatamente como foi salvo.', 'on-court-cms' ) . '</p>';
}

/**
 * Texto introdutório da seção de revalidação.
 *
 * @return void
 */
function occ_render_revalidate_section_intro() {
	echo '<p>' . esc_html__( 'Ao publicar, atualizar ou excluir uma notícia ou torneio, o WordPress avisa o Next.js para regerar as páginas.', 'on-court-cms' ) . '</p>';
}

/**
 * Renderiza os campos de um slot de anúncio.
 *
 * @param array<string, string> $args Argumentos do campo.
 * @return void
 */
function occ_render_ad_slot_field( $args ) {
	$slot     = isset( $args['slot'] ) ? $args['slot'] : '';
	$label    = isset( $args['label'] ) ? $args['label'] : '';
	$settings = occ_get_settings();
	$enabled  = '1' === (string) $settings[ $slot . '_enabled' ];
	$code     = (string) $settings[ $slot . '_code' ];
	?>
	<p>
		<label for="occ-<?php echo esc_attr( $slot ); ?>-enabled">
			<input type="checkbox" id="occ-<?php echo esc_attr( $slot ); ?>-enabled"
				name="<?php echo esc_attr( OCC_OPTION_KEY ); ?>[<?php echo esc_attr( $slot ); ?>_enabled]"
				value="1" <?php checked( $enabled ); ?> />
			<?php
			/* translators: %s: nome do slot de anúncio. */
			printf( esc_html__( 'Exibir %s', 'on-court-cms' ), esc_html( $label ) );
			?>
		</label>
	</p>
	<p>
		<textarea id="occ-<?php echo esc_attr( $slot ); ?>-code"
			name="<?php echo esc_attr( OCC_OPTION_KEY ); ?>[<?php echo esc_attr( $slot ); ?>_code]"
			rows="5" class="large-text code"
			placeholder="&lt;script async src=&quot;https://pagead2.googlesyndication.com/...&quot;&gt;&lt;/script&gt;"><?php echo esc_textarea( $code ); ?></textarea>
	</p>
	<p class="description"><?php esc_html_e( 'Código do anúncio (aceita tags <script>).', 'on-court-cms' ); ?></p>
	<?php
}

/**
 * Renderiza um campo de texto simples da opção.
 *
 * @param array<string, string> $args Argumentos do campo.
 * @return void
 */
function occ_render_text_field( $args ) {
	$key         = isset( $args['key'] ) ? $args['key'] : '';
	$hint        = isset( $args['hint'] ) ? $args['hint'] : '';
	$placeholder = isset( $args['placeholder'] ) ? $args['placeholder'] : '';
	$value       = occ_get_setting( $key );
	?>
	<input type="text" id="occ-<?php echo esc_attr( $key ); ?>"
		name="<?php echo esc_attr( OCC_OPTION_KEY ); ?>[<?php echo esc_attr( $key ); ?>]"
		value="<?php echo esc_attr( $value ); ?>"
		placeholder="<?php echo esc_attr( $placeholder ); ?>"
		class="regular-text" />
	<?php if ( '' !== $hint ) : ?>
		<p class="description"><?php echo esc_html( $hint ); ?></p>
	<?php endif; ?>
	<?php
}

/**
 * Sanitiza a opção occ_settings.
 *
 * O código dos anúncios é gravado cru (o AdSense precisa de <script>), por isso
 * a gravação só é permitida para quem tem a capability manage_options.
 *
 * @param mixed $input Valor enviado pelo formulário.
 * @return array<string, string>
 */
function occ_sanitize_settings( $input ) {
	$current = occ_get_settings();

	if ( ! current_user_can( 'manage_options' ) ) {
		add_settings_error(
			OCC_OPTION_KEY,
			'occ_forbidden',
			__( 'Você não tem permissão para alterar estas configurações.', 'on-court-cms' ),
			'error'
		);

		return $current;
	}

	if ( ! is_array( $input ) ) {
		$input = array();
	}

	$output = occ_get_default_settings();

	foreach ( array_keys( occ_get_ad_slots() ) as $slot ) {
		$enabled_key = $slot . '_enabled';
		$code_key    = $slot . '_code';

		$output[ $enabled_key ] = isset( $input[ $enabled_key ] )
			? occ_sanitize_bool_string( $input[ $enabled_key ] )
			: '0';

		// Gravado sem wp_kses: o snippet do AdSense depende de <script>.
		$output[ $code_key ] = isset( $input[ $code_key ] ) ? trim( (string) $input[ $code_key ] ) : '';
	}

	$output['revalidate_url'] = isset( $input['revalidate_url'] )
		? untrailingslashit( esc_url_raw( trim( (string) $input['revalidate_url'] ) ) )
		: '';

	$output['revalidate_secret'] = isset( $input['revalidate_secret'] )
		? sanitize_text_field( (string) $input['revalidate_secret'] )
		: '';

	return $output;
}

/**
 * Renderiza a página de configurações.
 *
 * @return void
 */
function occ_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Você não tem permissão para acessar esta página.', 'on-court-cms' ) );
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html__( 'On Court CMS', 'on-court-cms' ); ?></h1>
		<p><?php esc_html_e( 'Anúncios e integração com o site em Next.js.', 'on-court-cms' ); ?></p>

		<?php settings_errors( OCC_OPTION_KEY ); ?>

		<form action="options.php" method="post">
			<?php
			settings_fields( OCC_SETTINGS_GROUP );
			do_settings_sections( OCC_SETTINGS_PAGE );
			submit_button( __( 'Salvar alterações', 'on-court-cms' ) );
			?>
		</form>

		<hr />

		<h2><?php esc_html_e( 'Endpoint público', 'on-court-cms' ); ?></h2>
		<p>
			<?php esc_html_e( 'O front-end lê as configurações de anúncios em:', 'on-court-cms' ); ?>
			<code><?php echo esc_html( rest_url( 'occ/v1/settings' ) ); ?></code>
		</p>
	</div>
	<?php
}
