const { JSDOM } = require("jsdom");
const fs = require("fs");

test("zeigt Hello CI", () => {
    const html = fs.readFileSync("./popup.html", "utf8");
    const dom = new JSDOM(html);

    expect(dom.window.document.querySelector("h1").textContent)
        .toBe("Hello CI");
});
