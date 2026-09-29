// ============================================================
// LINK DO FORMULÁRIO: cole aqui o link quando ele existir.
// Todos os botões com data-form usam este link automaticamente.
// ============================================================
var LINK_FORMULARIO = "#formulario-em-breve";

document.querySelectorAll("[data-form]").forEach(function (a) {
  a.href = LINK_FORMULARIO;
});

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
