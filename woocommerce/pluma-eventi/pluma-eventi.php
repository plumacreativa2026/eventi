<?php
/**
 * Plugin Name: plūma eventi
 * Description: Collega eventi.plumacreativa.it al negozio: porta nel carrello inviti, menu e segnaposti personalizzati e avvisa l'app quando l'ordine è pagato.
 * Version: 1.0.0
 * Author: plūmacreativa
 * Requires Plugins: woocommerce
 * Requires PHP: 7.4
 * WC requires at least: 8.0
 */

if (!defined('ABSPATH')) exit;

const PLUMA_EV_OPT = 'pluma_eventi';

// Prodotti creati all'attivazione. Prezzi IVA esclusa: poi si cambiano da WooCommerce come qualsiasi prodotto.
function pluma_ev_prodotti() {
    return [
        'EVENTI-INVITO'       => ['Invito stampato · eventi', '2.00', false],
        'EVENTI-BUSTA'        => ['Busta · eventi', '1.00', false],
        'EVENTI-MENU'         => ['Menu stampato · eventi', '1.20', false],
        'EVENTI-SEGNAPOSTO'   => ['Segnaposto · eventi', '0.80', false],
        'EVENTI-CAVALIERINO'  => ['Segnaposto a cavalierino · eventi', '1.00', false],
        'EVENTI-IMPOSTAZIONE' => ['Impostazione grafica · eventi', '15.00', true],
    ];
}

function pluma_ev_opt($k, $def = '') {
    $o = get_option(PLUMA_EV_OPT, []);
    return isset($o[$k]) && $o[$k] !== '' ? $o[$k] : $def;
}

add_action('before_woocommerce_init', function () {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', __FILE__, true);
    }
});

// ---------- attivazione: segreto e prodotti ----------
register_activation_hook(__FILE__, function () {
    $o = get_option(PLUMA_EV_OPT, []);
    if (empty($o['secret'])) $o['secret'] = bin2hex(random_bytes(24));
    if (empty($o['app'])) $o['app'] = 'https://eventi.plumacreativa.it';
    update_option(PLUMA_EV_OPT, $o);
    update_option('pluma_eventi_crea_prodotti', 1);
});

add_action('woocommerce_init', function () {
    if (!get_option('pluma_eventi_crea_prodotti')) return;
    delete_option('pluma_eventi_crea_prodotti');
    pluma_ev_crea_prodotti();
});

function pluma_ev_crea_prodotti() {
    $creati = 0;
    foreach (pluma_ev_prodotti() as $sku => [$nome, $prezzo, $virtuale]) {
        if (wc_get_product_id_by_sku($sku)) continue;
        $p = new WC_Product_Simple();
        $p->set_name($nome);
        $p->set_sku($sku);
        $p->set_regular_price($prezzo);
        $p->set_catalog_visibility('hidden');
        $p->set_status('publish');
        $p->set_tax_status('taxable');
        $p->set_virtual($virtuale);
        $p->set_manage_stock(false);
        $p->set_short_description('Prodotto usato da eventi.plumacreativa.it: non va acquistato direttamente.');
        $p->update_meta_data('_pluma_eventi', 1);
        $p->save();
        $creati++;
    }
    return $creati;
}

// ---------- impostazioni: WooCommerce → plūma eventi ----------
add_action('admin_menu', function () {
    add_submenu_page('woocommerce', 'plūma eventi', 'plūma eventi', 'manage_woocommerce', 'pluma-eventi', 'pluma_ev_pagina');
});

function pluma_ev_pagina() {
    if (!current_user_can('manage_woocommerce')) return;
    $msg = '';
    if (isset($_POST['pluma_ev_salva']) && check_admin_referer('pluma_ev')) {
        $o = get_option(PLUMA_EV_OPT, []);
        $o['app'] = esc_url_raw(trim(wp_unslash($_POST['app'] ?? '')));
        $s = sanitize_text_field(wp_unslash($_POST['secret'] ?? ''));
        if (strlen($s) >= 24) $o['secret'] = $s;
        update_option(PLUMA_EV_OPT, $o);
        $msg = 'Impostazioni salvate.';
    }
    if (isset($_POST['pluma_ev_prodotti']) && check_admin_referer('pluma_ev')) {
        $msg = sprintf('Prodotti creati: %d (quelli già presenti non vengono toccati).', pluma_ev_crea_prodotti());
    }
    ?>
    <div class="wrap">
        <h1>plūma eventi</h1>
        <?php if ($msg): ?><div class="notice notice-success"><p><?php echo esc_html($msg); ?></p></div><?php endif; ?>
        <?php if (get_option('woocommerce_prices_include_tax') === 'yes'): ?>
            <div class="notice notice-warning"><p>Il negozio è impostato con prezzi <b>IVA inclusa</b>, ma i prezzi dei prodotti eventi sono IVA esclusa: aggiornali sui prodotti oppure scrivici.</p></div>
        <?php endif; ?>
        <form method="post">
            <?php wp_nonce_field('pluma_ev'); ?>
            <table class="form-table">
                <tr><th>Indirizzo dell'app</th><td><input class="regular-text" name="app" value="<?php echo esc_attr(pluma_ev_opt('app')); ?>"></td></tr>
                <tr><th>Chiave segreta</th><td>
                    <input class="large-text code" name="secret" value="<?php echo esc_attr(pluma_ev_opt('secret')); ?>" readonly onclick="this.select()">
                    <p class="description">Copiala su Vercel nella variabile <code>WOO_SECRET</code> dell'app eventi. Deve essere identica nei due posti.</p>
                </td></tr>
            </table>
            <p><button class="button button-primary" name="pluma_ev_salva" value="1">Salva</button>
               <button class="button" name="pluma_ev_prodotti" value="1">Ricrea i prodotti mancanti</button></p>
        </form>
        <h2>Prodotti</h2>
        <ul>
        <?php foreach (pluma_ev_prodotti() as $sku => $p):
            $id = wc_get_product_id_by_sku($sku); ?>
            <li><code><?php echo esc_html($sku); ?></code> ·
            <?php echo $id ? '<a href="' . esc_url(get_edit_post_link($id)) . '">' . esc_html(get_the_title($id)) . '</a> · ' . wp_kses_post(wc_get_product($id)->get_price_html()) : '<b>mancante</b>'; ?></li>
        <?php endforeach; ?>
        </ul>
        <p class="description">I prezzi qui devono coincidere con quelli dell'app (file lib/catalog.ts).</p>
    </div>
    <?php
}

// ---------- link dall'app: riempie il carrello ----------
function pluma_ev_b64($s) {
    return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4));
}

add_action('template_redirect', function () {
    if (empty($_GET['pluma_eventi']) || !function_exists('WC') || !WC()->cart) return;
    $token = sanitize_text_field(wp_unslash($_GET['pluma_eventi']));
    $parti = explode('.', $token, 2);
    $secret = pluma_ev_opt('secret');
    if (count($parti) !== 2 || !$secret || !hash_equals(hash_hmac('sha256', $parti[0], $secret), $parti[1])) {
        wc_add_notice('Il link del progetto non è valido. Torna nell\'app e premi di nuovo «Ordina la stampa».', 'error');
        wp_safe_redirect(wc_get_cart_url());
        exit;
    }
    $p = json_decode(pluma_ev_b64($parti[0]), true);
    if (!is_array($p) || empty($p['c']) || empty($p['r']) || abs(time() - intval($p['t'] ?? 0)) > 2 * DAY_IN_SECONDS) {
        wc_add_notice('Il link del progetto è scaduto. Torna nell\'app e premi di nuovo «Ordina la stampa».', 'error');
        wp_safe_redirect(wc_get_cart_url());
        exit;
    }
    if (!WC()->session->has_session()) WC()->session->set_customer_session_cookie(true);

    // via le righe dello stesso progetto (se il cliente torna a ordinare dopo una modifica)
    foreach (WC()->cart->get_cart() as $key => $item) {
        if (!empty($item['pluma_eventi']['codice']) && $item['pluma_eventi']['codice'] === $p['c']) WC()->cart->remove_cart_item($key);
    }
    $dati = ['pluma_eventi' => [
        'codice' => sanitize_text_field($p['c']),
        'id'     => sanitize_text_field($p['id'] ?? ''),
        'app'    => esc_url_raw($p['a'] ?? pluma_ev_opt('app')),
    ]];
    $ok = true;
    foreach ($p['r'] as $sku => $qta) {
        $pid = wc_get_product_id_by_sku(sanitize_text_field($sku));
        $qta = max(0, min(2000, intval($qta)));
        if (!$pid || !$qta) { $ok = $ok && $qta === 0; continue; }
        if (!WC()->cart->add_to_cart($pid, $qta, 0, [], $dati)) $ok = false;
    }
    if (!$ok) wc_add_notice('Non siamo riusciti ad aggiungere tutto al carrello. Contattaci citando il codice ' . esc_html($p['c']) . '.', 'error');
    wp_safe_redirect(wc_get_cart_url());
    exit;
});

// riga "Progetto" nel carrello e nel checkout, con il link per tornare a modificare
add_filter('woocommerce_get_item_data', function ($data, $item) {
    if (!empty($item['pluma_eventi']['codice'])) {
        $e = $item['pluma_eventi'];
        $data[] = ['key' => 'Progetto', 'value' => $e['codice'], 'display' => esc_html($e['codice'])];
    }
    return $data;
}, 10, 2);

// le quantità arrivano dall'app: nel carrello non si cambiano
add_filter('woocommerce_cart_item_quantity', function ($html, $key, $item) {
    return !empty($item['pluma_eventi']) ? '<span class="quantity">' . intval($item['quantity']) . '</span>' : $html;
}, 10, 3);
add_filter('woocommerce_store_api_product_quantity_editable', function ($editable, $product, $item) {
    return !empty($item['pluma_eventi']) ? false : $editable;
}, 10, 3);

// il codice del progetto resta sulle righe dell'ordine
add_action('woocommerce_checkout_create_order_line_item', function ($item, $key, $values) {
    if (empty($values['pluma_eventi']['codice'])) return;
    $item->add_meta_data('Progetto eventi', $values['pluma_eventi']['codice'], true);
    $item->add_meta_data('_pluma_eventi_id', $values['pluma_eventi']['id'], true);
}, 10, 3);

function pluma_ev_progetti($order) {
    $out = [];
    foreach ($order->get_items() as $item) {
        $c = $item->get_meta('Progetto eventi');
        if ($c) $out[$c] = $item->get_meta('_pluma_eventi_id');
    }
    return $out;
}

// ---------- avviso all'app quando cambia lo stato dell'ordine ----------
add_action('woocommerce_order_status_changed', function ($order_id, $from, $to, $order) {
    $progetti = pluma_ev_progetti($order);
    if (!$progetti) return;
    $app = untrailingslashit(pluma_ev_opt('app'));
    $secret = pluma_ev_opt('secret');

    if (!$order->get_meta('_pluma_eventi_nota')) {
        $righe = [];
        foreach ($progetti as $c => $id) $righe[] = sprintf('<a href="%s" target="_blank">%s</a>', esc_url("$app/admin/p/$id"), esc_html($c));
        $order->add_order_note('Progetti eventi: ' . implode(', ', $righe) . ' (file di stampa nell\'area riservata).');
        $order->update_meta_data('_pluma_eventi_nota', 1);
        $order->save_meta_data();
    }
    if (!$app || !$secret) return;
    $body = wp_json_encode(['codici' => array_keys($progetti), 'ordine' => (string) $order_id, 'numero' => $order->get_order_number(), 'stato' => $to]);
    $r = wp_remote_post("$app/api/woo", [
        'timeout' => 10,
        'headers' => ['content-type' => 'application/json', 'x-pluma-firma' => hash_hmac('sha256', $body, $secret)],
        'body'    => $body,
    ]);
    if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) {
        $order->add_order_note('Attenzione: l\'app eventi non ha ricevuto lo stato «' . esc_html($to) . '». Il progetto potrebbe restare modificabile dal cliente.');
    }
}, 10, 4);
