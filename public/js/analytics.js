(() => {
    const measurementId = "G-NS6FGLSFVX";
    let isAdmin = false;
    try {
        isAdmin = JSON.parse(localStorage.getItem("royalGarageCurrentUser") || "null")?.role === "admin";
        if (isAdmin) localStorage.setItem("rgExcludeAnalytics", "1");
    } catch {}
    if (isAdmin || localStorage.getItem("rgExcludeAnalytics") === "1") window[`ga-disable-${measurementId}`] = true;
    const signupMethod = sessionStorage.getItem("rgCompletedSignup");
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    if (window[`ga-disable-${measurementId}`]) return;
    window.gtag("js", new Date());
    window.gtag("config", measurementId);
    if (signupMethod) {
        sessionStorage.removeItem("rgCompletedSignup");
        window.gtag("event", "sign_up", { method: signupMethod });
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
})();
