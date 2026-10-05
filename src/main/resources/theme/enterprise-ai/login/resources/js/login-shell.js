(() => {
  "use strict";

  const initialize = () => {
    document.querySelectorAll('[data-xz-logo-fallback]').forEach((logo) => {
      const fallback = () => {
        logo.src = logo.dataset.xzLogoFallback;
      };
      if (logo.complete && logo.naturalWidth === 0) fallback();
      else logo.addEventListener('error', fallback, { once: true });
    });
    const tabs = document.querySelector("[data-xz-auth-tabs]");
    if (!tabs) return;

    const username = document.querySelector("#username");
    const password = document.querySelector("#password");
    if (username && !username.getAttribute("placeholder")) {
      username.setAttribute("placeholder", "请输入登录账号");
    }
    if (password && !password.getAttribute("placeholder")) {
      password.setAttribute("placeholder", "请输入登录密码");
    }

    const buttons = Array.from(tabs.querySelectorAll("[data-xz-auth-tab]"));
    const panes = Array.from(document.querySelectorAll("[data-xz-auth-pane]"));

    const activate = (name, focus = false) => {
      const activeButton = buttons.find(
        (button) => button.dataset.xzAuthTab === name,
      );
      if (!activeButton) return;

      tabs.dataset.activePane = name;
      buttons.forEach((button) => {
        const active = button === activeButton;
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });
      panes.forEach((pane) => {
        const active = pane.dataset.xzAuthPane === name;
        pane.hidden = !active;
        pane.classList.toggle("is-active", active);
      });
      if (focus) activeButton.focus();
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => {
        activate(button.dataset.xzAuthTab);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (index + direction + buttons.length) % buttons.length;
        activate(buttons[nextIndex].dataset.xzAuthTab, true);
      });
    });

    document
      .querySelector("[data-xz-account-return]")
      ?.addEventListener("click", () => activate("account", true));

    activate("account");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
