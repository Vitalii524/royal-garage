(() => {
    const paths = {
        chat: 'M21 11.5a8.4 8.4 0 0 1-8.5 8.5H4l1.5-4A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0ZM8 11h9m-9 4h5',
        contacts: 'M3 5h18v14H3z M3 6l9 7 9-7',
        route: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
        share: 'M8 11l8-5M8 13l8 5 M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm14-7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
        booking: 'M4 6h16v15H4z M4 10h16M8 3v6m8-6v6m-7 6 2 2 4-4'
    };
    for (const control of document.querySelectorAll('.rg-business-actions [data-action-icon]')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.7');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        const path = document.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', paths[control.dataset.actionIcon]);
        svg.append(path);
        control.prepend(svg);
    }
    for (const menu of document.querySelectorAll('.rg-business-contacts')) {
        document.addEventListener('click', event => {
            if (menu.open && !menu.contains(event.target)) menu.open = false;
        });
        menu.addEventListener('keydown', event => {
            if (menu.open && event.key === 'Escape') {
                menu.open = false;
                menu.querySelector('summary').focus();
            }
        });
    }
})();
