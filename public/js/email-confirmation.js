(() => {
    const encoded = document.currentScript.dataset.session;
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), c => c.charCodeAt(0))));
    if (!payload.token) return;
    const { user } = payload;
    localStorage.setItem("royalGarageCurrentUser", JSON.stringify(user));
    localStorage.setItem("royalGarageToken", payload.token);
    if (user.role === "admin") localStorage.setItem("rgExcludeAnalytics", "1");
    if (payload.completed && user.role !== "admin") sessionStorage.setItem("rgCompletedSignup", "email");
    location.replace(user.accountType === "business" ? "/business-profile.html" : "/profile.html");
})();
