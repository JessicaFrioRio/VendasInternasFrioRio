# Versão corrigida — configuração antes de publicar

O acesso usa os códigos da planilha `Códigos Site Vendas Internas.xlsx`. Os códigos são conferidos no servidor e guardados como variável secreta na Vercel. O HTML e banners continuam públicos; a lista de códigos não é enviada ao navegador.

## Configurar na Vercel

- Runtime Node.js 22 ou superior.
- `SITE_ORIGIN`: origem exata do site, sem barra final. Configurar também a origem própria em ambientes de preview.
- `AUTHORIZED_CODES`: códigos alfanuméricos de 7 caracteres, separados por vírgula. Configure como variável Secret apenas em Production. Atualizar a lista não revoga sessões já abertas; elas duram no máximo 30 minutos.
- Criar banco Redis Upstash e configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`. O contador é compartilhado entre instâncias: 10 tentativas por IP em 15 minutos. Funcionários atrás do mesmo IP compartilham o limite. Falhas no banco bloqueiam novos acessos.
- `FORM_URL`: link do formulário Microsoft Forms.
- O acesso ao Microsoft Forms segue as configurações atuais do próprio Forms. Qualquer pessoa que obtenha um código válido pode entrar, então trate os códigos como senhas e compartilhe-os somente com os colaboradores elegíveis.

Sem as variáveis, novos logins ficam indisponíveis. Sessões usam token aleatório em cookie HttpOnly/Secure/SameSite, expiram em 30 minutos e são revogadas no servidor pelo botão Sair.

## Conteúdo pendente

O PDF não veio no material. O download quebrado foi substituído por aviso. Incluir o documento oficial e restaurar o link antes da campanha. Ajustar também o texto que descreve o documento. Nunca armazenar códigos de acesso no front-end, no repositório ou em logs.

## Validação e publicação

Executar `node tests/security.cjs`. Os testes usam Redis simulado, não acessam produção. Antes de liberar, testar integração real na Vercel: cookies HTTPS, API, Redis, contador, expiração, logout e restrição do Microsoft Forms. Testar responsividade e carrossel visualmente. As alterações não foram publicadas automaticamente.
