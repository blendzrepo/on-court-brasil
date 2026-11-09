================================================================================
MIGRAÇÃO DE CONTEÚDO: NEXT.JS  ->  WORDPRESS
On Court Brasil
================================================================================

Este arquivo explica como usar o script scripts/migrate-to-wordpress.mjs, que
envia o conteúdo hoje guardado dentro do repositório para o WordPress headless
(plugin "On Court CMS"), através da REST API.

Leia até o fim antes do primeiro envio. O script tem um modo de simulação
(--dry-run) que não altera nada: comece sempre por ele.


--------------------------------------------------------------------------------
1. O QUE O SCRIPT FAZ
--------------------------------------------------------------------------------

Na ordem, o script migra quatro coisas:

  1) CATEGORIAS
     Garante que existam no WordPress as cinco categorias usadas pelo site:
     Grand Slam, ATP, WTA, Brasil e Internacional. As que já existirem são
     reaproveitadas; apenas as que faltarem são criadas.

  2) IMAGENS
     Envia para a Biblioteca de Mídia cada imagem distinta referenciada pelas
     notícias (campo mainImage), lida de public/images/. Uma imagem que já
     esteja na biblioteca com o mesmo slug não é enviada de novo.

  3) NOTÍCIAS (37 itens, lidos de data/articles.json)
     Cria um post padrão para cada notícia, com:
       - título, conteúdo HTML, slug e data de publicação originais;
       - status "publicado" quando published = true, "rascunho" quando false;
       - a categoria correspondente;
       - a imagem destacada (featured_media) apontando para a mídia enviada;
       - os metadados do plugin: occ_subtitle, occ_seo_title,
         occ_seo_description e occ_featured ('1' para destaque, '0' para não).
     Observação: occ_seo_title e occ_seo_description são enviados vazios, pois
     o conteúdo de origem ainda não tem esses campos. Preencha depois, no
     painel do WordPress.

  4) TORNEIOS (25 itens, lidos de lib/mockData.ts)
     Cria um item do tipo de conteúdo "torneio" para cada torneio, com os
     metadados occ_location, occ_country, occ_start_date, occ_end_date,
     occ_surface, occ_category e occ_prize. O slug é derivado do nome
     (minúsculas, sem acentos, espaços viram hifens).

O script é IDEMPOTENTE: antes de criar qualquer item, ele procura um post com o
mesmo slug. Se encontrar, ATUALIZA o que já existe em vez de criar um
duplicado. Por isso rodar o script duas vezes é seguro — e é justamente assim
que se reenvia o conteúdo depois de corrigir alguma falha.


--------------------------------------------------------------------------------
2. PRÉ-REQUISITOS
--------------------------------------------------------------------------------

  - Node.js 18 ou superior (o script usa o fetch nativo). Verifique com:
        node --version

  - Nenhuma dependência extra precisa ser instalada.

  - O plugin "On Court CMS" precisa estar ATIVO no WordPress (Plugins ->
    Plugins instalados). Sem ele não existem o tipo de conteúdo "torneio" nem
    os campos occ_*.

  - Os links permanentes do WordPress precisam estar em "Nome do post"
    (Configurações -> Links permanentes). Com a opção "Simples", a rota
    /wp-json/ não funciona e a REST API fica inacessível.

  - O usuário usado na migração precisa ser administrador ou editor.


--------------------------------------------------------------------------------
3. COMO CRIAR UMA SENHA DE APLICATIVO NO WORDPRESS
--------------------------------------------------------------------------------

A autenticação NÃO usa a sua senha normal de login. Use uma Senha de
Aplicativo, que pode ser revogada a qualquer momento sem mexer na sua senha
pessoal.

  1. Entre no painel do WordPress (/wp-admin).
  2. Vá em Usuários -> Perfil (ou Usuários -> Todos os usuários e clique no seu
     usuário).
  3. Role a página até a seção "Senhas de aplicativo".
  4. Em "Nome da nova senha de aplicativo", escreva algo que identifique o uso,
     por exemplo: migracao-nextjs
  5. Clique em "Adicionar nova senha de aplicativo".
  6. O WordPress mostra a senha UMA ÚNICA VEZ, no formato:
        abcd EFGH ijkl MNOP qrst UVWX
     Copie imediatamente. Depois de sair da página ela não pode mais ser vista,
     apenas revogada e recriada.
  7. Use esse valor em WP_APP_PASSWORD. Os espaços podem ser mantidos, desde
     que o valor fique entre aspas.

Se a seção "Senhas de aplicativo" não aparecer, quase sempre é porque o site
não está em HTTPS: o WordPress desativa esse recurso em conexões não seguras.

Para encerrar o acesso depois da migração, volte nessa mesma tela e clique em
"Revogar".


--------------------------------------------------------------------------------
4. VARIÁVEIS DE AMBIENTE
--------------------------------------------------------------------------------

As três são obrigatórias. O script para com uma mensagem clara se faltar
alguma, dizendo exatamente qual.

  WP_URL
      URL base do WordPress, SEM barra no final.
      Exemplos:  https://cms.oncourt.com.br
                 http://localhost:8080

  WP_USER
      Nome de usuário (login) do WordPress. Não é o e-mail.
      Exemplo:  admin

  WP_APP_PASSWORD
      A Senha de Aplicativo gerada na seção 3. Sempre entre aspas, porque ela
      contém espaços.
      Exemplo:  "abcd EFGH ijkl MNOP qrst UVWX"

Essas variáveis não são lidas do .env.local: passe-as na própria linha de
comando ou exporte-as no terminal antes de rodar. Nunca faça commit da senha.


--------------------------------------------------------------------------------
5. COMANDOS
--------------------------------------------------------------------------------

5.1 Ver a ajuda

    node scripts/migrate-to-wordpress.mjs --help


5.2 Simulação (FAÇA ISTO PRIMEIRO)

Mostra exatamente o que seria criado ou atualizado, e não altera NADA no
WordPress:

    WP_URL=https://cms.oncourt.com.br \
    WP_USER=admin \
    WP_APP_PASSWORD="abcd EFGH ijkl MNOP qrst UVWX" \
    node scripts/migrate-to-wordpress.mjs --dry-run

Confira na saída: as contagens (37 notícias, 25 torneios), as categorias, as
imagens e o resumo final. Só siga adiante se estiver tudo como o esperado.


5.3 Migração de verdade

O mesmo comando, sem --dry-run:

    WP_URL=https://cms.oncourt.com.br \
    WP_USER=admin \
    WP_APP_PASSWORD="abcd EFGH ijkl MNOP qrst UVWX" \
    node scripts/migrate-to-wordpress.mjs


5.4 Migrar só uma parte

    node scripts/migrate-to-wordpress.mjs --only=categories
    node scripts/migrate-to-wordpress.mjs --only=posts
    node scripts/migrate-to-wordpress.mjs --only=tournaments

  --only=categories    só as cinco categorias
  --only=posts         só as notícias (junto com as categorias e as imagens das
                       quais elas dependem)
  --only=tournaments   só os torneios

Qualquer uma delas pode ser combinada com --dry-run.


5.5 Pelo npm

    npm run migrate:wp -- --dry-run
    npm run migrate:wp -- --only=tournaments
    npm run migrate:wp

Repare nos dois hifens (--) antes das opções: eles fazem o npm repassar os
argumentos ao script em vez de consumi-los.


5.6 Exportando as variáveis uma vez por terminal

    export WP_URL=https://cms.oncourt.com.br
    export WP_USER=admin
    export WP_APP_PASSWORD="abcd EFGH ijkl MNOP qrst UVWX"

    node scripts/migrate-to-wordpress.mjs --dry-run
    node scripts/migrate-to-wordpress.mjs


--------------------------------------------------------------------------------
6. COMO LER A SAÍDA
--------------------------------------------------------------------------------

Cada item vira uma linha:

    ✓ criado         o item foi criado agora
    ↻ atualizado     já existia com o mesmo slug e foi atualizado
    ⨯ falhou         algo deu errado; a linha traz o código e a mensagem de
                     erro devolvidos pelo próprio WordPress
    → criaria        aparece no modo --dry-run: seria criado
    → atualizaria    aparece no modo --dry-run: seria atualizado

No fim aparece uma tabela com criados / atualizados / falhas por tipo, seguida
da lista de falhas, quando houver.

Código de saída:
    0  tudo certo
    1  houve pelo menos uma falha, ou a configuração / autenticação estava
       errada

Uma falha em um item não interrompe a migração: o script registra o erro e
continua no próximo. Depois de corrigir a causa, rode o script de novo — os
itens já migrados serão apenas atualizados, nunca duplicados.

Entre cada gravação o script espera cerca de 150 ms, de propósito, para não
levar bloqueio (429 / throttle) em hospedagem compartilhada. Por isso a
migração completa leva alguns minutos.


--------------------------------------------------------------------------------
7. PROBLEMA MAIS COMUM: ERRO 401 MESMO COM A SENHA CORRETA
--------------------------------------------------------------------------------

Sintoma: o script mostra

    A autenticação não chegou ao PHP.

e o WordPress responde HTTP 401 com o código "rest_not_logged_in", mesmo com
WP_USER e WP_APP_PASSWORD corretos. Gerar uma senha nova não resolve.

Causa: o Apache está removendo o cabeçalho Authorization antes de entregá-lo ao
PHP. Como a credencial nunca chega ao WordPress, ele trata a requisição como
anônima. Isso é muito comum em hospedagem compartilhada e em imagens Docker do
Apache com PHP em modo CGI/FastCGI.

SOLUÇÃO (Apache): adicione a linha abaixo ao arquivo .htaccess na raiz da
instalação do WordPress, logo ACIMA do bloco "# BEGIN WordPress":

    SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1

O arquivo deve ficar mais ou menos assim:

    SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1

    # BEGIN WordPress
    <IfModule mod_rewrite.c>
    RewriteEngine On
    ...
    </IfModule>
    # END WordPress

Não coloque a linha dentro do bloco entre "# BEGIN WordPress" e
"# END WordPress": o WordPress reescreve esse trecho sozinho e a alteração
seria perdida.

Alternativa, também no .htaccess:

    <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTP:Authorization} ^(.*)
    RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]
    </IfModule>

SOLUÇÃO (Nginx + PHP-FPM): no bloco location que processa PHP, adicione:

    fastcgi_param HTTP_AUTHORIZATION $http_authorization;

Depois de aplicar a correção, confirme com:

    node scripts/migrate-to-wordpress.mjs --dry-run

O preflight deve passar a mostrar "Autenticado como ...".


--------------------------------------------------------------------------------
8. OUTROS ERROS FREQUENTES
--------------------------------------------------------------------------------

"não devolveu JSON" / a resposta veio em HTML
    Os links permanentes estão em "Simples". Vá em Configurações -> Links
    permanentes, escolha "Nome do post" e salve.

"Rota occ/v1/settings NÃO encontrada"
    O plugin "On Court CMS" está desativado ou não instalado. Ative em
    Plugins -> Plugins instalados. Sem ele, os torneios e os campos occ_* não
    existem no WordPress.

"incorrect_password" ou "invalid_username"
    Dessa vez a credencial chegou ao servidor e foi recusada. Confira WP_USER
    (é o login, não o e-mail) e gere uma nova Senha de Aplicativo.

A seção "Senhas de aplicativo" não aparece no perfil
    O site não está em HTTPS. O WordPress desativa o recurso fora de conexões
    seguras.

Falha ao enviar os arquivos .svg
    O WordPress bloqueia o envio de SVG por padrão, por questão de segurança.
    Duas saídas: liberar o tipo image/svg+xml no WordPress (por plugin ou pelo
    filtro upload_mimes), ou converter as imagens para PNG/WebP antes de
    migrar. O script avisa sobre isso durante o --dry-run.

"rest_cannot_create" ou "rest_forbidden"
    O usuário não tem permissão suficiente. Use um administrador ou editor.

Erro 429 ou "Too Many Requests"
    A hospedagem está limitando as requisições. Aumente o valor de
    WRITE_DELAY_MS no topo de scripts/migrate-to-wordpress.mjs (de 150 para
    400, por exemplo) e rode de novo — os itens já migrados serão só
    atualizados.

Dois torneios com o mesmo nome
    Nomes iguais geram o mesmo slug e, portanto, o mesmo item no WordPress (o
    último sobrescreve o anterior). O script avisa quando isso acontece.
    Renomeie em lib/mockData.ts se os dois precisarem existir separadamente.


--------------------------------------------------------------------------------
9. DEPOIS DA MIGRAÇÃO
--------------------------------------------------------------------------------

  1. Confira no painel do WordPress: Posts (37), Torneios (25), Mídia e
     Categorias.
  2. Abra duas ou três notícias e verifique subtítulo, destaque e imagem
     destacada.
  3. Aponte o site Next.js para o WordPress ajustando WORDPRESS_API_URL no
     .env.local (ou nas variáveis de ambiente da hospedagem).
  4. Revogue a Senha de Aplicativo usada na migração, em Usuários -> Perfil ->
     Senhas de aplicativo, se ela não for mais necessária.

================================================================================
