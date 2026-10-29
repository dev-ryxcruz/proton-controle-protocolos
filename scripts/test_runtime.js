import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");

// Create minimal DOM mock
class Element {
  constructor(tag, id = "", className = "") {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      add: (c) => {},
      remove: (c) => {},
      toggle: (c, val) => {},
      contains: (c) => false,
    };
    this.style = {};
    this.dataset = {};
    this.children = [];
    this.parentNode = null;
    this.value = "";
    this.textContent = "";
    this.innerHTML = "";
  }
  setAttribute(attr, val) {}
  getAttribute(attr) { return null; }
  addEventListener(event, fn) {}
  removeEventListener(event, fn) {}
  querySelector(sel) { return new Element("div"); }
  querySelectorAll(sel) { return []; }
  appendChild(el) { el.parentNode = this; this.children.push(el); return el; }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(c => c !== this); }
  focus() {}
  blur() {}
  click() {}
  getContext() { return {}; }
}

global.document = {
  readyState: "complete",
  documentElement: new Element("html"),
  body: new Element("body"),
  createElement: (tag) => new Element(tag),
  createTextNode: (text) => new Element("#text"),
  getElementById: (id) => new Element("div", id),
  querySelector: (sel) => new Element("div"),
  querySelectorAll: (sel) => [new Element("div")],
  addEventListener: (event, fn) => {},
  removeEventListener: (event, fn) => {},
};

global.window = {
  document: global.document,
  addEventListener: (event, fn) => {},
  removeEventListener: (event, fn) => {},
  location: { protocol: "http:", href: "http://localhost:5500" },
  localStorage: {
    getItem: (k) => null,
    setItem: (k, v) => {},
    removeItem: (k) => {},
  },
  sessionStorage: {
    getItem: (k) => null,
    setItem: (k, v) => {},
    removeItem: (k) => {},
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  getComputedStyle: () => ({
    getPropertyValue: () => "#000000",
  }),
};

global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;
global.getComputedStyle = global.window.getComputedStyle;
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
};
global.MutationObserver = class {
  constructor() {}
  observe() {}
  disconnect() {}
};

try {
  const { initializeApp } = await import("../js/app.js");
  console.log("Calling initializeApp()...");
  initializeApp();
  console.log("initializeApp() completed successfully!");
} catch (err) {
  console.error("RUNTIME ERROR IN initializeApp():", err);
}

