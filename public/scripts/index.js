const windowIds = [
    "ga-prox",
    "downloads",
    "tools",
    "bookmarklets",
    "info",
    "settings"
];
const guideIds = [
    "downloads",
];

const urls = {
    "selenite": "https://mail.adriapartners.net",
    "prism": "https://schoolclassroomcanvacanvacodecom.7879.22web.org/",
    "interstellar": "https://potato.wwe.ddnss.de",
    "frogie": "https://mshjvxae.1vib36z.ddnss.de/",

    "suggestions": "https://forms.office.com/r/Q1b91AwsJ1"
};

const splashTexts = [
    "Uga Booga.",
    ":D",
    "Welcome to Stop Codon Gąmes!",
    "Actually, we're the University of Georgia.",
    "New update every Monday.",
    "I have a normal amount of hours in Cookie Clicker. (trust)",
    "Free candy in settings*",
];

const themes = [
    "purple"
];

const LastUpdateTime = 0;

let _activeWindow = "";
let _activeGuide = "";

let _settings = {
    "auto_cloak": false,
    "replace_original": false,
    "show_home": false,
    "show_particles": true,
    "theme": "default"
};

let initSettingsApplied = false;

const LogLevel = {
    Info: 0,
    Warn: 1,
    Error: 2
};
function log(msg, lvl = 0, display = false) {
    switch (lvl) {
        case 0:
            console.log(msg);
            break;
        case 1:
            console.warn(msg);
            break;
        case 2:
            console.error(msg);
            break;
    }

    if (display) alert(msg);
}

const _downloadDir = "downloads/";
const GithubUrl = "ddddd-dbase/New-UGA";

function choose(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Small helper fn
String.prototype.removePrefix = function (s) {
    let pre = this.slice(0, s.length);
    if (pre === s)
        return this.slice(s.length, this.length);
    return this;
}

async function cdnDownload(file) {
    try {
        let downloadUrl = `https://cdn.jsdelivr.net/gh/${GithubUrl}@main/${file}`;
        let res = await fetch(downloadUrl, { cache: "no-store" });
        if (!res.ok) {
            log(`Failed to fetch ${file} from CDN: ${res.status} ${res.statusText}`, LogLevel.Error);
            return undefined;
        }
        let content = await res.text();
        return content;
    } catch (e) {
        log(`Failed to fetch ${file} from CDN: ${e}`);
    }
    return undefined;
}

async function showUpdatePrompt() {
    try {
        let upd = await cdnDownload("dist/LATESTUPDATE");
        if (!upd) {
            log(`Failed to get latest update timestamp: CDN returned invalid timestamp`, LogLevel.Warn);
            return;
        }

        let ts = new Date(upd);
        if (ts > new Date(LastUpdateTime)) {
            log(`Client version out of date!`, LogLevel.Warn);
        }
    } catch (e) {
        log(`Failed to get latest update timestamp: ${e}`, LogLevel.Warn);
    }
}

function joinPath(p1, p2) {
    if (p1.endsWith("/")) {
        return p1 + p2;
    } else {
        return p1 + "/" + p2;
    }
}

function getFilename(fp) {
    return fp.replace(/^.*[\\/]/, '');
}

function getStorageContext() {
    return window.opener ? window.opener.localStorage : localStorage;
}

function getSettings() {
    let storageSource = getStorageContext();

    let settings = JSON.parse(storageSource.getItem("settings"));
    if (settings == undefined) {
        settings = _settings;
        storageSource.setItem("settings", JSON.stringify(settings));
    }

    return settings;
}

function getSetting(k) {
    if (!Object.hasOwn(_settings, k)) return undefined;

    return _settings[k];
}

function setSelectorValue(sel, v) {
    if ((sel instanceof HTMLInputElement) &&
        (sel.type == "checkbox") &&
        (typeof v == "boolean")) {
        sel.checked = v;
    } else if (
        (sel instanceof HTMLSelectElement) &&
        (typeof v == "string")) {
        let optionExists =
            Array.from(sel.options).some(option => option.value == v);
        if (!optionExists) return;

        sel.value = v;
    }
}

function getSelectorValue(sel) {
    if ((sel instanceof HTMLInputElement) &&
        (sel.type == "checkbox")) {
        return sel.checked;
    }
    else if (sel.value) {
        return sel.value;
    }
}

function updateSetting(k, v) {
    if (!Object.hasOwn(_settings, k)) {
        console.warn(`Failed to apply setting {${k} = ${v}}. ${k} not found`);
        return;
    }

    let storageSource = getStorageContext();

    let currentSettings = JSON.parse(storageSource.getItem("settings")) || _settings;
    currentSettings[k] = v;
    _settings[k] = v;

    storageSource.setItem("settings", JSON.stringify(currentSettings));

    applySettings();
}

function updateOptionElements() {
    let opts = document.querySelector("#window-settings .settings");
    if (!opts) return;

    let settings = getSettings();
    for (let opt of opts.children) {
        if (!opt.classList.contains("option")) {
            console.log("Not an option");
            continue;
        }

        let selector = opt.querySelector(".selector");
        let option = opt.id.removePrefix("opt-").replaceAll("-", "_");
        if (!selector || !Object.hasOwn(settings, option)) {
            console.log("Can't apply option", option);
            continue;
        }

        setSelectorValue(selector, settings[option]);
    }
}

function updateOption(opt) {
    let elementId = `opt-${opt.replaceAll("_", "-")}`;
    let element = document.getElementById(elementId);
    if (!element) return;

    let selector = element.querySelector(".selector");
    if (!selector) return;
    updateSetting(opt, getSelectorValue(selector));
}

function applyTheme(theme) {
    if (theme == "default" || !themes.includes(theme)) return;

    let themesDir = `https://cdn.jsdelivr.net/gh/${GithubUrl}/public/styles/themes`;
    let themeFile = `${themesDir}/${theme}.theme.css`;

    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = themeFile;

    document.head.appendChild(link);
}

function applySettings() {
    updateOptionElements();
    applySettingsVisuals();
}

function applySettingsVisuals() {
    let settings = getSettings();

    if (settings.auto_cloak == true && initSettingsApplied == false) cloakSelf();
    if (settings.show_home == true) {
        let region = document.getElementById("esc-region");
        if (!region) return;
        region.classList.add("show-always");
    } else {
        let region = document.getElementById("esc-region");
        if (!region) return;
        region.classList.remove("show-always");
    }
    if (settings.show_particles == false) {
        let particles = document.getElementById("particles-js");
        if (!particles) return;
        particles.classList.add("hide");
    } else {
        let particles = document.getElementById("particles-js");
        if (!particles) return;
        particles.classList.remove("hide");
    }
    if (!initSettingsApplied) applyTheme(settings.theme);
}

function openUrl(id) {
    if (!Object.hasOwn(urls, id))
        return;

    openIframe(urls[id]);
}

function openIframe(url) {
    let presenter = document.getElementById("content-presenter");
    if (!presenter) return;
    presenter.classList.remove("hidden");

    let iframe = presenter.querySelector("iframe");
    if (!iframe) return;
    iframe.src = url;

    let home = document.getElementById("esc-wrapper");
    if (!home) return;
    home.classList.remove("hide");

    return;
}

function closeIframe() {
    let presenter = document.getElementById("content-presenter");
    if (!presenter) return;
    presenter.classList.add("hidden");

    let iframe = presenter.querySelector("iframe");
    if (!iframe) return;
    iframe.src = "";

    let home = document.getElementById("esc-wrapper");
    if (!home) return;
    home.classList.add("hide");
}

function setActiveWindow(winId) {
    let storageSource = getStorageContext();
    _activeWindow = winId;
    storageSource.setItem("activeWindow", winId);
}

function getActiveWindow() {
    let storageSource = getStorageContext();
    let active = storageSource.getItem("activeWindow");
    if (active == undefined) {
        active = "";
        storageSource.setItem("activeWindow", "");
    }

    return active;
}

function updateWindows() {
    let active = getActiveWindow();
    for (const win of windowIds) {
        if (active == win) {
            toggleWindow(win, true);
        } else {
            toggleWindow(win, false);
        }
    }
}

function toggleWindow(id, state) {
    let winId = `window-${id}`;
    let tabId = `tab-${id}`;

    let win = document.getElementById(winId);
    let tab = document.getElementById(tabId);

    if (!win || !tab) return;

    if (state == true) {
        win.classList.remove("inactive");
        win.classList.add("active");
        tab.classList.add("active");
    } else {
        win.classList.add("inactive");
        win.classList.remove("active");
        tab.classList.remove("active");
    }
}

function updateTimeDisplay() {
    const timeDisplay = document.getElementById("current-time");
    if (!timeDisplay) return;

    let currentTime = new Date().toLocaleString();

    timeDisplay.textContent = currentTime;
}

function makeActive(winId) {
    let win = getActiveWindow();
    if (win == winId) {
        setActiveWindow("");
    } else {
        setActiveWindow(winId);
    }
    updateWindows();
}

function openGuide(guideId) {
    if (_activeGuide == guideId) {
        let g = document.getElementById(`guide-${guideId}`);
        if (!g) return;

        g.classList.add("inactive");
        _activeGuide = "";
        return;
    }
    if (_activeGuide === "") {
        let g = document.getElementById(`guide-${guideId}`);
        if (!g) return;

        g.classList.remove("inactive");
        _activeGuide = guideId;
    } else {
        let a = document.getElementById(`guide-${_activeGuide}`);
        if (a) a.classList.add("inactive");

        let g = document.getElementById(`guide-${guideId}`);
        if (!g) return;

        g.classList.remove("inactive");
        _activeGuide = guideId;
    }
}

function cloaxerPrompt() {
    let input = document.querySelector("#window-tools .cloak-input");
    if (!input || input.value.trim() == "") return;
    let url = input.value;

    openCloaked(url);
    input.value = "";
}

function cloakSelf() {
    let inFrame;
    try {
        inFrame = (window !== top);
    } catch {
        inFrame = true;
    }
    if (!inFrame) openCloaked(window.location.href);
}

function openCloaked(url) {
    if (!URL.canParse(url) || url == "https://null") {
        log(
            "Improper URL. (ex: https://example.com)",
            LogLevel.Error
        );
        cloakError("Improper URL. (ex: https://example.com)");
        return;
    }

    // Whether we're currently in an iframe
    let inFrame = false;
    try {
        inFrame = (window !== top);
    } catch {
        inFrame = true;
    }

    let storageSource = getStorageContext();
    let ab = storageSource.getItem("ab") || true;
    storageSource.setItem("ab", ab);

    if (inFrame || !ab) {
        openIframe(url);
        return;
    }

    let popup = open("about:blank", "_blank");
    if (!popup || popup.closed) {
        log("Popups are required for UGA self-cloaking. Please enable them :)",
            LogLevel.Warn, true
        )
        return;
    }

    let doc = popup.document;
    let iframe = doc.createElement("iframe");
    let link = doc.createElement("link");
    doc.title = "My Drive - Google Drive";
    link.rel = "icon";
    link.href = "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png";

    let toLoad = url ? decodeURIComponent(url) : location.href;

    iframe.src = toLoad;
    iframe.style = `
            position: absolute;
            top: 0px;
            left: 0px;
            width: 100vw;
            height: 100vh;
            border: none;
            padding: 0px;
            margin: 0px;
        `;

    doc.head.appendChild(link);
    doc.body.appendChild(iframe);

    let settings = getSettings();
    if (settings.replace_original == true)
        location.replace("https://google.com/");

    let script = document.createElement("script");
    script.textContent = `
        window.onbeforeunload = (ev) => {
            let conf = "Leave Site?";
            (event || window.event).returnValue = conf;
            return conf;
        }
    `;

    // doc.body.appendChild(script);
}

function isIframeOpen() {
    let iframe = document.querySelector("#content-presenter iframe");
    if (!iframe || iframe.src.trim() == "") return false;
    return true;
}

function cloakError(msg) {
    let display = document.querySelector("#window-tools .err-display");
    if (!display) return;

    display.classList.remove("hidden");
    display.textContent = msg;
    setTimeout(() => {
        if (display)
            display.classList.add("hidden");
    }, 2000);
}

function getBoundingRect(selector) {
    let el = document.querySelector(selector);
    if (!el) return undefined;

    return el.getBoundingClientRect();
}

function inRect(x, y, rect) {
    return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    );
}

function inCurrentWindow(x, y) {
    let active = getActiveWindow();
    if (!active || active.trim() == "") return true;

    let winBox = getBoundingRect(`#window-${active} .window-bound`);
    let tabBox = getBoundingRect(`#tab-${active}`);
    if (!winBox || !tabBox) return true;

    return inRect(x, y, winBox) || inRect(x, y, tabBox);
}

function inCurrentGuide(x, y) {
    if (!_activeGuide || _activeGuide.trim() === "") return true;

    let gBox = getBoundingRect(`#guide-${_activeGuide}`);
    let btnBox = getBoundingRect(`#section-guides .guides .${_activeGuide}`);
    if (!gBox || !btnBox) return true;

    return inRect(x, y, gBox) || inRect(x, y, btnBox);
}

function isGuideOpen() {
    return !(_activeGuide.trim() === "");
}

function isWindowOpen() {
    let current = getActiveWindow();
    return !(current.trim() === "");
}

async function downloadFile(rp, use_direct = false) {
    let fp = _downloadDir + rp;
    let downloadUrl = "";
    let fullPath = joinPath(GithubUrl, fp);

    if (use_direct)
        downloadUrl = `https://github.com/${fullPath}`;
    else
        downloadUrl = `https://cdn.jsdelivr.net/gh/${fullPath}`;

    let name = getFilename(rp);

    let res = await fetch(downloadUrl);
    let blob = await res.blob();
    let link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = name;
    link.click();
}

(() => {
    setInterval(updateTimeDisplay, 100);
    _activeWindow = getActiveWindow();
    updateWindows();
    applySettings();
    initSettingsApplied = true;

    window.addEventListener("click", (ev) => {
        if (!isWindowOpen())
            return;

        if (!inCurrentWindow(ev.x, ev.y))
            makeActive("");
    })
    window.addEventListener("click", (ev) => {
        if (isWindowOpen() && !inCurrentWindow(ev.x, ev.y)) {
            makeActive("");
        }

        if (isGuideOpen() && !inCurrentGuide(ev.x, ev.y)) {
            openGuide(_activeGuide);
        }
    });

    window.addEventListener("beforeunload", (ev) => {
        if (isIframeOpen()) {
            ev.preventDefault();
            ev.returnValue = '';
            return '';
        }
    });

    let cloakInput = document.querySelector("#window-tools .cloak-input");
    if (cloakInput) {
        cloakInput.addEventListener("keyup", (ev) => {
            ev.preventDefault();
            if (ev.key == "Enter")
                cloaxerPrompt();
        });
    }

    let splashText = document.getElementById("splash-text");
    if (splashText) {
        splashText.textContent = choose(splashTexts);
    }
})();