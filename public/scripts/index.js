const windowIds = [
    "ga",
    "prox-tools",
    "downloads",
    "bookmarklets",
    "info",
    "settings"
];
/*
ga
Proxies / Tools
Guides / Downloads
Bookmarklets 
Info
Settings
*/
const guideIds = [
    "downloads",
];

const urls = {
    "selenite": "https://mail.adriapartners.net",
    "prism": "https://schoolclassroomcanvacanvacodecom.7879.22web.org/",
    //"interstellar": "https://potato.wwe.ddnss.de", WILL LIKELY BE UP WHEN SCHOOL STARTS, YOU CAN CHECK.
    "frogie": "https://mshjvxae.1vib36z.ddnss.de/",
    "arctic": "https://quizizz.com/_media/arctic/ead256dc-0d87-4534-ad4f-106368554887-v2",

    "suggestions": "https://forms.office.com/r/Q1b91AwsJ1"
};

const splashTexts = [
    "Uga Booga.",
    ":D",
    "Welcome to Stop Codon Gąmes!",
    "Actually, we're the University of Georgia.",
    "I have a normal amount of hours in Cookie Clicker. (trust)",
    "We love piracy and you should too!",
    "How is jsdelivr still online?",
    "Blame gn-math for all the broken gąmes",
    "I spent my time on the themes, so maybe use them."
];

const themes = [
    "purple", "ocean"
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
    presenter.removeChild(iframe);//deletes the old iframe and makes a new one to make sure the inner document is empty.
    iframe = document.createElement("iframe");
    iframe.src = "";
    iframe.allowFullscreen = true;
    presenter.appendChild(iframe);
}

const zonesurls = [
    //'Borrowing' sources. 
    "https://cdn.jsdelivr.net/gh/freebuisness/assets@main/zones.json",
    "https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json",
    "https://cdn.jsdelivr.net/gh/freebuisness/assets@master/zones.json",
    "https://cdn.jsdelivr.net/gh/freebuisness/assets/zones.json",
];
let zonesURL = zonesurls[Math.floor(Math.random() * zonesurls.length)];
let zones = [];

function updatecover() {
    const dropdown = document.getElementById("ga-list-select");
    if (!dropdown) return;
    const coverimg = document.getElementById('cover-img');
    if (!coverimg) return;
    if (dropdown.value != -1) {
        if (!coverimg.style.display || coverimg.style.display == "none") {
            coverimg.style.display = "block";
        }
        coverimg.src = zones[dropdown.value].cover;
    } else {
        coverimg.style.display = "none";
    }
}

async function listZones() {
    const listbtn = document.getElementById('list-btn');
    listbtn.style.display = "none";


    //This function could be a lot cleaner, but it works.
    try {
        //gn math's sha system to get the updated files
        let sharesponse;
        let shajson;
        let sha;
        try {
            sharesponse = await fetch(
                "https://api.github.com/repos/freebuisness/assets/commits?t=" +
                Date.now(),
            );
        } catch (error) { }
        if (sharesponse && sharesponse.status === 200) {
            try {
                shajson = await sharesponse.json();
                sha = shajson[0]["sha"];
                if (sha) {
                    zonesURL = `https://cdn.jsdelivr.net/gh/freebuisness/assets@${sha}/zones.json`;
                }
            } catch (error) {
                try {
                    let secondarysharesponse = await fetch(
                        "https://raw.githubusercontent.com/freebuisness/xml/refs/heads/main/sha.txt?t=" +
                        Date.now(),
                    );
                    if (
                        secondarysharesponse &&
                        secondarysharesponse.status === 200
                    ) {
                        sha = (await secondarysharesponse.text()).trim();
                        if (sha) {
                            zonesURL = `https://cdn.jsdelivr.net/gh/freebuisness/assets@${sha}/zones.json`;
                        }
                    }
                } catch (error) { }
            }
        }
        const response = await fetch(zonesURL + "?t=" + Date.now()); //actually get the data.
        const json = await response.json(); //json
        zones = json;
        zones.splice(0, 1); //Deletes the discord ad :) (it's always at position zero)
    } catch (error) {
        console.error(error);
    }
    const todisplay = document.getElementsByClassName("ga-area-hide");
    for (let i = 0; i < todisplay.length; i++) { todisplay[i].style.display = "block" }
    let newzone = [];
    zones.forEach((file, index) => {
        if (file.name != "[!] COMMENTS") {
            //Remove comments.
            newzone[index] = file;
            newzone[index].url = newzone[index].url.replace(
                "{HTML_URL}",
                "https://cdn.jsdelivr.net/gh/freebuisness/html@main",
            );
            newzone[index].cover = newzone[index].cover.replace(
                "{COVER_URL}",
                "https://cdn.jsdelivr.net/gh/freebuisness/covers@main",
            ); //Replace the url placeholders with the actual url.
        }
    });
    newzone.sort((a, b) => a.name.localeCompare(b.name)); //sort
    zones = newzone;
    updatelist(zones);
}

function updatelist(list) {
    const dropdown = document.getElementById("ga-list-select");
    dropdown.options.length = 1;
    for (i in list) {
        if (list[i]) {
            const option = document.createElement("option");
            option.value = i;
            option.innerText = list[i].name;
            dropdown.append(option);
        }
    }
    updatecover()
}

function searchgalist() {
    const box = document.getElementById("ga-search-box");
    if (!box) return;
    let tempzones = {};
    for (let i = 0; i < zones.length; i++) {
        if (zones[i] && zones[i].name.toLowerCase().includes(box.value)) {
            tempzones[i] = zones[i];
        }
    }
    //add a sorting thing later to make this feel better

    //Something like sort for shortest would work, it's just the sorting kinda gets overridden by the layout of the object.
    updatelist(tempzones);
}

async function downloadZone() {
    const dropdown = document.getElementById("ga-list-select");
    if (dropdown.value == -1) {
        return;
    }
    const file = zones[dropdown.value];
    const url = file.url;
    fetch(url + "?t=" + Date.now()).then(res => res.text()).then(text => {
        const blob = new Blob([text], {
            type: "text/plain;charset=utf-8"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name + ".html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function openZone(mode) {
    //Very badly written function as it was basically patched onto the gn-math one.
    let home = document.getElementById("esc-wrapper");
    if (!home) return;
    home.classList.remove("hide");


    let url;
    if (mode == 'featured') {
        url = "https://cdn.jsdelivr.net/gh/freebuisness/html@main/723.html"//Put the url of the featured ga here.
    } else {
        const dropdown = document.getElementById("ga-list-select");
        const filepath = dropdown.value;

        if (dropdown.value == -1) {
            return;
        }
        const file = zones[filepath];
        url = file.url;
    }
    fetch(url + "?t=" + Date.now())
        .then((response) => response.text())
        .then((html) => {
            writeIframeDocument(html, "html")
            setTimeout(() => {//Remove ads
                let presenter = document.getElementById("content-presenter");
                if (!presenter) return;
                presenter.classList.remove("hidden");
                let iframe = presenter.querySelector("iframe");
                if (!iframe) return;
                let ad1 = iframe.contentDocument.getElementById("sidebarad1");
                let ad2 = iframe.contentDocument.getElementById("sidebarad2");
                if (ad1 || ad2) {
                    ad1.innerHTML = "";
                    ad2.innerHTML = "";
                    ad1.remove();
                    ad2.remove();
                }
            }, 400);
        })
        .catch((error) => alert("Failed to load: " + error));
}

async function writeIframeDocument(content, mode) {
    let home = document.getElementById("esc-wrapper");
    if (!home) return;
    home.classList.remove("hide");
    let presenter = document.getElementById("content-presenter");
    if (!presenter) return;
    presenter.classList.remove("hidden");

    let iframe = presenter.querySelector("iframe");
    if (!iframe) return;

    if (mode == "html") {
        iframe.contentDocument.open();
        iframe.contentDocument.write(content);
        iframe.contentDocument.close();
    } else if (mode == "path") {
        let contentlink = joinPath(GithubUrl, content);
        contentlink = `https://cdn.jsdelivr.net/gh/${contentlink}`;
        console.log(contentlink)
        fetch(contentlink).then(response => response.text()).then((textresponse) => {
            iframe.contentDocument.open();
            iframe.contentDocument.write(textresponse);
            iframe.contentDocument.close();
        });
    }
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
    let input = document.querySelector("#window-prox-tools .right .input-div .cloak-input");
    if (!input || input.value.trim() == "") return;

    let url = input.value;
    if (!(url.includes("https://") || url.includes("http://"))) { url = "https://" + url }//appends https:// to urls where it isn't specified.

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

    let winBox = getBoundingRect(`#window-${active} .tab-window`);
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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

const styles = window.getComputedStyle(document.documentElement);//Get the root styles. (currently used to set particle settings through css.)

const defaultstyle = {//defaults for the particle styling.
    "--particle-animation-speed": 2,
    "--particle-animation": true,
    "--particle-node-color": "#fff",
    "--particle-line-color": "#fff",
    "--particle-line-distance": 180,
    "--particle-line-width": 1,
    "--particle-node-size": 3,
    "--particle-random-node-size": true,
    "--particle-random-color-mode": false,
    "--particle-count": 140,
    "--particle-node-animate-opacity": true,
    "--particle-node-opacity": 0.7,
    "--particle-line-animate-opacity": true,
    "--particle-line-opacity": 0.5,
    "--particle-click-interactivity": true,
    "--particle-interactivity": true,
    "--particle-resize-interactivity": true,
    "--particle-link": true
};

function getcssstyle(style) {
    let data = styles.getPropertyValue(style);
    data = !data ? defaultstyle[style] : data;
    data = data == "true" ? true : data;//cleaning the data a bit to let the js understand it.
    data = data == "false" ? false : data;
    return data;
}

setTimeout(() => {//give it a bit of time for the theme to load.
    particlesJS("particles-js", {
        particles: {
            color: getcssstyle("--particle-node-color"),
            color_random: getcssstyle("--particle-random-color-mode"),
            shape: "circle", // "circle", "edge" or "triangle"
            opacity: {
                opacity: getcssstyle('--particle-node-opacity'),
                anim: {
                    enable: getcssstyle("--particle-node-animate-opacity"),
                    speed: 3,
                    opacity_min: 0,
                    sync: false,
                },
            },
            size: getcssstyle("--particle-node-size"),
            size_random: getcssstyle("--particle-random-node-size"),
            nb: getcssstyle('--particle-count'),
            line_linked: {
                enable_auto: getcssstyle('--particle-link'),
                distance: getcssstyle("--particle-line-distance"),
                color: getcssstyle("--particle-line-color"),
                opacity: getcssstyle("--particle-line-opacity"),
                width: getcssstyle("--particle-line-width"),
                condensed_mode: {
                    enable: getcssstyle("--particle-line-animate-opacity"),
                    rotateX: 600,
                    rotateY: 600,
                },
            },
            anim: {
                enable: getcssstyle("--particle-animation"),
                speed: getcssstyle('--particle-animation-speed'),
            },
        },
        interactivity: {
            enable: getcssstyle('--particle-interactivity'),
            mouse: {
                distance: 300,
            },
            detect_on: "window", // "canvas" or "window"
            mode: "grab",
            line_linked: {
                opacity: 0.4,
            },
            events: {
                onclick: {
                    enable: getcssstyle("--particle-click-interactivity"),
                    mode: "push", // "push" or "remove"
                    nb: 3,
                },
                onresize: {
                    enable: getcssstyle("--particle-resize-interactivity"),
                    mode: "out", // "out" or "bounce"
                    density_auto: false,
                    density_area: 400, // nb_particles = particles.nb * (canvas width *  canvas height / 1000) / density_area
                },
            },
        },
        /* Retina Display Support */
        retina_detect: true,
    });
}, 250)
