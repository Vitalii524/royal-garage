"use strict";
// Royal Garage partners category listing (public data only).
(function () {
  async function loadCategories() {
    const container = document.getElementById("businessCategories");
    const empty = document.getElementById("businessEmptyState");
    if (!container) return;
    container.replaceChildren();
    if (empty) empty.hidden = true;
    try {
      const response = await fetch("/api/businesses/categories", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.ok || !Array.isArray(data.categories)) throw new Error("Invalid categories response");
      const categories = data.categories.filter(item => item && typeof item.code === "string" && item.code.trim());
      if (!categories.length) {
        if (empty) empty.hidden = false;
        return;
      }
      for (const category of categories) {
        const card = document.createElement("a");
        card.className = "business-category-card";
        card.href = `business-list.html?type=${encodeURIComponent(category.code)}`;
        const icon = document.createElement("span");
        icon.className = "business-category-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = category.code === "car_service" ? "🔧" : "🏢";
        const details = document.createElement("span");
        details.className = "business-category-details";
        const name = document.createElement("strong");
        name.textContent = category.name || category.code;
        const count = document.createElement("span");
        const n = Number(category.businessCount);
        count.textContent = `Активні бізнеси: ${Number.isFinite(n) ? n : 0}`;
        details.append(name, count);
        const arrow = document.createElement("span");
        arrow.className = "business-category-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "›";
        card.append(icon, details, arrow);
        container.append(card);
      }
    } catch (error) {
      console.error("Failed to load business categories:", error);
      const message = document.createElement("p");
      message.className = "business-category-error";
      message.textContent = "Не вдалося завантажити категорії. Оновіть сторінку пізніше.";
      container.append(message);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCategories, { once: true });
  } else {
    loadCategories();
  }
})();
