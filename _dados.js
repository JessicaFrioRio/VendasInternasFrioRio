// ============================================================
// ARQUIVO PARA VOCÊ EDITAR (fica só no servidor, não aparece no site)
// ============================================================

// Link do formulário de pedidos (só é entregue a quem tem CPF liberado)
const FORM_URL = "https://forms.cloud.microsoft/pages/responsepage.aspx?id=f7A4EoqGm0GU0_vnDvsNekFj9K6jn81Cu9qE0aMQCLdUOEhVNTFWR1VVT0JWWVNLWFY5R0UzUFRYMy4u&route=shorturl";

// CPFs liberados: UM POR LINHA, entre aspas e com vírgula no fim.
// Pode colar com ponto e traço ou só números.
// >>> APAGUE o CPF de exemplo abaixo antes de publicar <<<
const CPFS = [
  "529.982.247-25"
  "43692070888", // EXEMPLO - apague
  // "000.000.000-00",
  // "000.000.000-00",
];

module.exports = { FORM_URL, CPFS };
