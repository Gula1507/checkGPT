const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

test("ändert den Titel nach DOMContentLoaded", () => {
    // HTML laden
    const html = fs.readFileSync(
        path.resolve(__dirname, "./popup.html"),
        "utf8"
    );

    // DOM erstellen
    const dom = new JSDOM(html, {
        runScripts: "dangerously",
        resources: "usable",
    });

    // window & document für popup.js verfügbar machen
    global.window = dom.window;
    global.document = dom.window.document;

    // JS-Datei laden (führt den Code aus)
    require("./popup.js");

    // DOMContentLoaded auslösen
    document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    // Erwartung
    expect(document.getElementById("title").textContent).toBe("Hello");
});
