"use strict";
(() => {
    const selector = ".garage-posts article video, .rg-fit-topic-gallery video";
    const videos = new Map();
    let active = null;
    const threshold = 0.5;
    function stop(video) {
        video.pause();
        video.muted = true;
    }
    function start(video) {
        const promise = video.play();
        if (promise && typeof promise.then === "function") {
            promise.then(() => {
                if (active !== video || document.hidden || !video.isConnected) stop(video);
            }).catch(() => {}); // Native controls remain available when autoplay is blocked.
        }
    }
    function choose(preferred) {
        let candidate = null;
        let best = 0;
        if (!document.hidden) {
            for (const [video, state] of videos) {
                if (!video.isConnected || state.ratio < threshold) continue;
                if (video === preferred) { candidate = video; break; }
                if (state.ratio > best || (state.ratio === best && video === active)) {
                    candidate = video;
                    best = state.ratio;
                }
            }
        }
        if (candidate === active) return;
        const previous = active;
        active = candidate;
        if (previous) stop(previous);
        if (candidate && candidate.paused) start(candidate);
    }
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => {
        for (const entry of entries) {
            const state = videos.get(entry.target);
            if (state) state.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
        }
        choose();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] }) : null;
    function register(video) {
        if (videos.has(video)) return;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        const state = { ratio: 0, button: null };
        videos.set(video, state);
        const onPlay = () => {
            if (document.hidden) { stop(video); return; }
            if (!observer) return;
            if (state.ratio < threshold) { stop(video); return; }
            if (active !== video) choose(video);
        };
        video.addEventListener("play", onPlay);
        state.cleanup = () => video.removeEventListener("play", onPlay);
        const parent = video.parentElement;
        if (parent) {
            if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
            const button = document.createElement("button");
            button.type = "button";
            button.style.cssText = "position:absolute;right:8px;top:8px;z-index:2;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,.7);color:white;font-size:20px;cursor:pointer";
            const sync = () => {
                const label = video.muted ? "Увімкнути звук" : "Вимкнути звук";
                button.textContent = video.muted ? "🔇" : "🔊";
                button.title = label;
                button.setAttribute("aria-label", label);
            };
            button.addEventListener("click", event => {
                event.stopPropagation();
                if (observer && state.ratio >= threshold && active !== video) choose(video);
                video.muted = !video.muted;
                if (!video.muted && video.paused) {
                    if (observer) {
                        if (active === video) start(video);
                    } else {
                        const promise = video.play();
                        if (promise) promise.catch(() => {});
                    }
                }
                sync();
            });
            video.addEventListener("volumechange", sync);
            sync();
            parent.append(button);
            state.button = button;
            state.cleanup = () => {
                video.removeEventListener("volumechange", sync);
                video.removeEventListener("play", onPlay);
            };
        }
        observer?.observe(video);
    }
    function scan() {
        for (const [video, state] of videos) {
            if (!video.isConnected || !video.matches(selector)) {
                if (active === video) active = null;
                stop(video);
                observer?.unobserve(video);
                state.cleanup?.();
                state.button?.remove();
                videos.delete(video);
            }
        }
        document.querySelectorAll(selector).forEach(register);
        choose();
    }
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            for (const video of videos.keys()) {
                if (!video.paused) stop(video);
            }
            active = null;
        } else choose();
    });
    function init() {
        scan();
        new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
