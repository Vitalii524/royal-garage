// Separate navigation from the homepage hero so sticky positioning lasts the whole page.
(() => {
    function pinNavigation() {
        const header = document.querySelector('.site-header');
        const row = header?.querySelector('.top-line');
        if (!row || document.querySelector('.rg-sticky-header')) return;
        const pinned = document.createElement('header');
        pinned.className = 'rg-sticky-header';
        header.parentNode.insertBefore(pinned, header);
        pinned.append(row);
        if (!header.children.length) header.remove();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pinNavigation, { once: true });
    else pinNavigation();
})();
