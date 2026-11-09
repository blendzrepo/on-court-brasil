<?php
/**
 * Plugin Name:       On Court CMS
 * Plugin URI:        https://oncourt.com.br
 * Description:       CMS headless para o On Court Brasil: tipo de conteúdo Torneios, campos extras e SEO nas notícias, gestão de anúncios e revalidação do front-end Next.js.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            On Court Brasil
 * Author URI:        https://oncourt.com.br
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       on-court-cms
 * Domain Path:       /languages
 *
 * @package OnCourtCMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'OCC_VERSION', '1.0.0' );
define( 'OCC_PLUGIN_FILE', __FILE__ );
define( 'OCC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'OCC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'OCC_OPTION_KEY', 'occ_settings' );

require_once OCC_PLUGIN_DIR . 'includes/helpers.php';
require_once OCC_PLUGIN_DIR . 'includes/post-types.php';
require_once OCC_PLUGIN_DIR . 'includes/meta-boxes.php';
require_once OCC_PLUGIN_DIR . 'includes/settings.php';
require_once OCC_PLUGIN_DIR . 'includes/rest.php';
require_once OCC_PLUGIN_DIR . 'includes/revalidate.php';
require_once OCC_PLUGIN_DIR . 'includes/uploads.php';

/**
 * Carrega as traduções do plugin.
 *
 * @return void
 */
function occ_load_textdomain() {
	load_plugin_textdomain( 'on-court-cms', false, dirname( plugin_basename( OCC_PLUGIN_FILE ) ) . '/languages' );
}
add_action( 'init', 'occ_load_textdomain', 1 );

/**
 * Na ativação registra o CPT e atualiza as regras de reescrita.
 *
 * @return void
 */
function occ_activate() {
	occ_register_post_types();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'occ_activate' );

/**
 * Na desativação limpa as regras de reescrita.
 *
 * @return void
 */
function occ_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'occ_deactivate' );
