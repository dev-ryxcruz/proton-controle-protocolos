/**
 * PROTON v1.4 - Aprimoramentos de UX (Efeito Ripple, Animações e Scroll to Top)
 */

export const setupUX = () => {
  // 1. Efeito Ripple em todos os botões da aplicação
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (
      !btn ||
      btn.classList.contains("scroll-to-top") ||
      btn.classList.contains("sort-btn")
    ) {
      return;
    }

    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  // 2. IntersectionObserver para animações suaves de entrada
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("animate-in");
          }, i * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));

  // 3. Botão flutuante de Scroll to Top
  const scrollBtn = document.getElementById("scrollToTopBtn");
  if (scrollBtn) {
    window.addEventListener(
      "scroll",
      () => {
        scrollBtn.classList.toggle("visible", window.scrollY > 300);
      },
      { passive: true }
    );

    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
};

