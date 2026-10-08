# Versão corrigida — configuração antes de publicar

O acesso usa os códigos da planilha `Códigos Site Vendas Internas.xlsx`. Os códigos são conferidos no servidor e guardados como variável secreta na Vercel. A página inicial contém somente a tela de login; o programa, a página de pedido e os quatro banners são protegidos antes de a Vercel entregar os arquivos. A lista de códigos não é enviada ao navegador.

## Configurar na Vercel

- Runtime Node.js 22 ou superior.
- `SITE_ORIGIN`: origem exata do site, sem barra final. Configurar também a origem própria em ambientes de preview.
- `AUTHORIZED_CODES`: códigos alfanuméricos de 7 caracteres, separados por vírgula. Configure como variável Secret apenas em Production. Atualizar a lista não revoga sessões já abertas; elas duram no máximo 30 minutos.
- Criar banco Redis Upstash e configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`. O contador é compartilhado entre instâncias: 10 tentativas por IP em 15 minutos. Funcionários atrás do mesmo IP compartilham o limite. Falhas no banco bloqueiam novos acessos.
- `FORM_URL`: link do formulário Microsoft Forms.
- O acesso ao Microsoft Forms segue as configurações atuais do próprio Forms. Qualquer pessoa que obtenha um código válido pode entrar, então trate os códigos como senhas e compartilhe-os somente com os colaboradores elegíveis.

Sem as variáveis, novos logins ficam indisponíveis. Sessões usam token aleatório em cookie HttpOnly/Secure/SameSite, expiram em 30 minutos e são revogadas no servidor pelo botão Sair. Cada acesso a uma página ou banner protegido valida a sessão no Redis e usa `Cache-Control: private, no-store`; isso acrescenta uma leitura no Redis e uma execução do Routing Middleware por arquivo protegido solicitado. O helper e os arquivos de testes/configuração são negados como rotas públicas.

## Políticas do programa

- `regras-programa-vendas.pdf` é o guia do colaborador fornecido pela empresa. Ele é servido somente após validação da sessão.
- `privacidade.html` apresenta a Política de Privacidade fornecida pela empresa, também protegida pelo login do portal.
- Os dois documentos são acessados pela seção “Políticas e orientações” da página do programa. Ao substituir qualquer política, confira a versão e a data de atualização com a área responsável antes de publicar.

Nunca armazenar códigos de acesso no front-end, no repositório ou em logs.

## Validação e publicação

Executar `node tests/security.cjs`. Os testes usam Redis simulado, não acessam produção. Antes de liberar, testar integração real na Vercel: o middleware deve redirecionar as páginas protegidas sem sessão, retornar 404 para os banners, o PDF e os caminhos internos, e entregar tudo com sessão válida; também conferir cookies HTTPS, APIs, Redis, contador, expiração, logout e Microsoft Forms. Testar responsividade e carrossel visualmente.
