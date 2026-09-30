// ============================================================
// TRAVA POR CPF
// A lista de CPFs e o link do formulário ficam em api/_dados.js
// ============================================================
(function () {
  var CHAVE = "friorio_cpf";

  function digitos(v) { return v.replace(/\D/g, ""); }

  function mascara(v) {
    var d = digitos(v).slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  function cpfValido(v) {
    var c = digitos(v);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    function dv(n) {
      var s = 0;
      for (var i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
      var r = (s * 10) % 11;
      return r === 10 ? 0 : r;
    }
    return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
  }

  function consultar(cpf) {
    return fetch("/api/verificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: cpf })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        return { ok: r.ok && d.ok === true, link: d.link };
      });
    });
  }

  function liberar(cpf, link) {
    try { sessionStorage.setItem(CHAVE, cpf); } catch (e) {}
    document.body.classList.remove("travado");
    var t = document.getElementById("trava");
    if (t) t.remove();
    document.querySelectorAll("[data-form]").forEach(function (a) { a.href = link || "#"; });
  }

  var guardado = null;
  try { guardado = sessionStorage.getItem(CHAVE); } catch (e) {}

  var trava = document.createElement("section");
  trava.id = "trava";
  trava.className = "trava";
  trava.style.display = guardado ? "none" : "";
  trava.innerHTML =
    '<div class="trava-caixa">' +
      '<h1>Acesso exclusivo para colaboradores</h1>' +
      '<p>Digite o seu CPF para acessar o programa de vendas.</p>' +
      '<label for="trava-cpf">CPF</label>' +
      '<input id="trava-cpf" type="text" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00">' +
      '<p id="trava-erro" class="trava-erro" role="alert" hidden></p>' +
      '<button id="trava-botao" class="botao botao-grande" type="button">Entrar</button>' +
    '</div>';
  document.querySelector("header").insertAdjacentElement("afterend", trava);

  var campo = document.getElementById("trava-cpf");
  var erro = document.getElementById("trava-erro");
  var botao = document.getElementById("trava-botao");

  function mostrarErro(msg) { erro.textContent = msg; erro.hidden = false; }

  function entrar() {
    erro.hidden = true;
    if (!cpfValido(campo.value)) return mostrarErro("CPF inválido. Confira os números digitados.");
    botao.disabled = true; botao.textContent = "Verificando...";
    var cpf = digitos(campo.value);
    consultar(cpf).then(function (r) {
      if (r.ok) return liberar(cpf, r.link);
      mostrarErro("Este CPF não está autorizado a acessar o programa. Se acha que é um engano, fale com o time responsável.");
    }).catch(function () {
      mostrarErro("Não foi possível verificar agora. Tente novamente em instantes.");
    }).then(function () {
      botao.disabled = false; botao.textContent = "Entrar";
    });
  }

  campo.addEventListener("input", function () { campo.value = mascara(campo.value); });
  campo.addEventListener("keydown", function (e) { if (e.key === "Enter") entrar(); });
  botao.addEventListener("click", entrar);

  // Quem já entrou nesta aba é conferido de novo em segundo plano
  if (guardado) {
    consultar(guardado).then(function (r) {
      if (r.ok) return liberar(guardado, r.link);
      try { sessionStorage.removeItem(CHAVE); } catch (e) {}
      trava.style.display = "";
    }).catch(function () { trava.style.display = ""; });
  }
})();

// ---------- Carrossel (funciona em qualquer .carousel) ----------
document.querySelectorAll(".carousel").forEach(function (carousel) {
  var faixa = carousel.querySelector(".carousel-faixa");
  var slides = carousel.querySelectorAll(".slide");
  var bolinhas = carousel.querySelector(".bolinhas");
  var atual = 0;
  var pausado = false;
  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ir(i) {
    atual = (i + slides.length) % slides.length;
    faixa.style.transform = "translateX(-" + atual * 100 + "%)";
    bolinhas.querySelectorAll("button").forEach(function (b, n) {
      b.classList.toggle("ativo", n === atual);
    });
  }

  slides.forEach(function (_, n) {
    var b = document.createElement("button");
    b.setAttribute("aria-label", "Ir para o banner " + (n + 1));
    b.onclick = function () { ir(n); };
    bolinhas.appendChild(b);
  });

  carousel.querySelector(".anterior").onclick = function () { ir(atual - 1); };
  carousel.querySelector(".proximo").onclick = function () { ir(atual + 1); };
  carousel.onmouseenter = function () { pausado = true; };
  carousel.onmouseleave = function () { pausado = false; };

  var x0 = null;
  carousel.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) ir(dx < 0 ? atual + 1 : atual - 1);
    x0 = null;
  });

  if (!reduzir) {
    setInterval(function () { if (!pausado) ir(atual + 1); }, 6000);
  }
  ir(0);
});
