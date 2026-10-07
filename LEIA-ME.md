# Versão corrigida — configuração antes de publicar

Esta versão melhora o acesso por CPF, mas CPF sozinho não comprova identidade. Para autenticação forte, integrar login corporativo. O HTML e banners continuam públicos; o servidor protege a sessão e o redirecionamento ao formulário.

## Configurar na Vercel

- Runtime Node.js 22 ou superior.
- `SITE_ORIGIN`: origem exata do site, sem barra final. Configurar também a origem própria em ambientes de preview.
- `AUTHORIZED_CPFS`: CPFs reais elegíveis, separados por vírgula. Nenhum CPF de exemplo foi mantido. Atualizar a lista não revoga sessões já abertas; elas duram no máximo 30 minutos.
- Criar banco Redis Upstash e configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`. O contador é compartilhado entre instâncias: 10 tentativas por IP em 15 minutos. Funcionários atrás do mesmo IP compartilham o limite. Falhas no banco bloqueiam novos acessos.
- `FORM_URL`: link do formulário Microsoft Forms.
- No Microsoft Forms, restringir respostas a contas da organização (ou pessoas específicas), registrar nome e conferir elegibilidade antes de aprovar pedidos. Só depois configurar `FORM_ACCESS_RESTRICTED=true`. Essa variável é uma confirmação operacional, não verifica a configuração da Microsoft automaticamente.

Sem as variáveis, novos logins ficam indisponíveis. O formulário fica indisponível até a confirmação acima. Sessões usam token aleatório sem CPF em cookie HttpOnly/Secure/SameSite, expiram em 30 minutos e são revogadas no servidor pelo botão Sair.

## Conteúdo pendente

O PDF não veio no material. O download quebrado foi substituído por aviso. Incluir o documento oficial e restaurar o link antes da campanha. Ajustar também o texto que descreve o documento. Nunca armazenar segredos ou listas de CPFs no front-end ou logs.

## Validação e publicação

Executar `node tests/security.cjs`. Os testes usam Redis simulado, não acessam produção. Antes de liberar, testar integração real na Vercel: cookies HTTPS, API, Redis, contador, expiração, logout e restrição do Microsoft Forms. Testar responsividade e carrossel visualmente. As alterações não foram publicadas automaticamente.
