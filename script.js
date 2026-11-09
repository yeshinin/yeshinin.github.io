// Coin-flip sound, synthesised (no audio file): a few quick metallic pings
// while the coin spins, then a short ring as it lands
let audio = null;

const ping = (at, level, decay, freqs) => {
  const out = audio.createGain();
  out.gain.setValueAtTime(level, at);
  out.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  out.connect(audio.destination);
  freqs.forEach((freq) => {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(out);
    osc.start(at);
    osc.stop(at + decay);
  });
};

const coinSound = () => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audio = audio || new Ctx();
  audio.resume();
  const now = audio.currentTime;
  [0, 0.07, 0.15, 0.24].forEach((offset, i) =>
    ping(now + offset, 0.05 - i * 0.008, 0.09, [3100 + i * 120, 4700, 6900])
  );
  ping(now + 0.36, 0.05, 0.4, [2450, 5230, 7900]);
};

// Flip card: click, Enter or Space. The hidden face is inert so its links
// can't be tabbed to.
const card = document.getElementById("card");
const front = card.querySelector(".front");
const back = card.querySelector(".back");

const flip = () => {
  const flipped = card.classList.toggle("flipped");
  card.setAttribute("aria-pressed", String(flipped));
  front.inert = flipped;
  back.inert = !flipped;
  coinSound();
};

card.addEventListener("click", (e) => {
  if (!e.target.closest("a")) flip();
});
card.addEventListener("keydown", (e) => {
  if (e.target === card && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    flip();
  }
});

// Dock: buttons are plain links to each section; the one on screen stays lit
const keys = [...document.querySelectorAll(".key")];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      keys.forEach((k) => k.classList.toggle("on", k.dataset.key === entry.target.id));
    });
  },
  { rootMargin: "-50% 0px -50% 0px" }
);
document.querySelectorAll(".view").forEach((view) => observer.observe(view));

// Folder browser, shared by Books and Sketches. A node has a name and either
// children (more folders), books (a list) or images (a gallery).
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const sizeOf = (node) =>
  node.books ? `${node.books.length} ${node.books.length === 1 ? "book" : "books"}`
  : node.images ? `${node.images.length} ${node.images.length === 1 ? "sketch" : "sketches"}`
  : `${node.children.length} folders`;

const browseFolders = (mount, rootName, topLevel) => {
  const section = mount.closest(".view");
  const open = (path, scroll = true) => {
    const node = path[path.length - 1];
    const contents = node.children ? folderView(node, path)
      : node.books ? bookView(node)
      : galleryView(node);
    const crumbs = path.length === 1 ? [] : [el("nav", { className: "crumbs", ariaLabel: "Folder path" },
      ...path.flatMap((step, i) => {
        const last = i === path.length - 1;
        const item = last
          ? el("strong", { textContent: step.name })
          : el("button", { type: "button", textContent: step.name, onclick: () => open(path.slice(0, i + 1)) });
        return last ? [item] : [item, " / "];
      }))];
    mount.replaceChildren(...crumbs, contents);
    if (scroll) section.scrollIntoView();
  };

  const folderView = (node, path) =>
    el("div", { className: node.list ? "folder-rows" : "folders" }, ...node.children.map((child) => {
      const go = () => open([...path, child]);
      return node.list
        ? el("button", { className: "row", type: "button", onclick: go }, child.name, el("small", { textContent: sizeOf(child) }))
        : el("button", { className: "folder", type: "button", onclick: go }, child.name, el("small", { textContent: sizeOf(child) }));
    }));

  const bookView = (node) =>
    el("ul", { className: "book-list" }, ...node.books.map((book) =>
      el("li", {},
        el("b", { textContent: book.title }),
        el("span", { textContent: `, ${book.author}` }),
        ...(book.awards.length ? [" ", el("em", { textContent: book.awards.join(", ") })] : []))));

  const galleryView = (node) => {
    const strip = el("div", { className: "gallery", tabIndex: 0, ariaLabel: `${node.name} sketches` },
      ...node.images.map((image) =>
        el("figure", {},
          el("img", { src: image.src, alt: `${image.caption}, sketch by Yeshi Dolma` }),
          el("figcaption", {}, image.caption,
            el("a", { href: image.link, target: "_blank", rel: "noopener", textContent: "Instagram" })))));
    if (node.images.length < 2) return strip;
    const step = (dir) => strip.scrollBy({ left: dir * strip.firstChild.offsetWidth, behavior: "smooth" });
    return el("div", {}, strip,
      el("div", { className: "gallery-nav" },
        el("button", { type: "button", textContent: "←", ariaLabel: "Previous sketch", onclick: () => step(-1) }),
        el("button", { type: "button", textContent: "→", ariaLabel: "Next sketch", onclick: () => step(1) })));
  };

  open([{ name: rootName, children: topLevel }], false);
};

// Books: READ holds every book, then Goodreads shelves grouped into folders
const library = document.getElementById("library");

if (library && window.LIBRARY) {
  const { books, updated } = window.LIBRARY;
  const stamp = document.getElementById("books-updated");
  stamp.dateTime = updated;
  stamp.textContent = new Date(`${updated}T12:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const AWARDS = {
    "nobel-prize-winning-authors": "Nobel laureate",
    "pulitzer-prize": "Pulitzer Prize",
    "booker-prize-winners": "Booker Prize",
    "booker-short-long-list": "Booker shortlist or longlist",
  };
  const entries = books.map((b) => ({
    title: b.t.replace(/\s*\(.*\)\s*$/, ""),
    author: b.a,
    shelves: b.s,
    awards: b.s.filter((s) => AWARDS[s]).map((s) => AWARDS[s]),
  }));

  const label = (shelf) => {
    const text = shelf.replace(/-/g, " ");
    return text[0].toUpperCase() + text.slice(1);
  };
  const groupOf = (s) =>
    /^\d+s$/.test(s) ? "Decades"
    : s.startsWith("set-in-") ? "Places"
    : /-(literature|authors)$/.test(s) ? "Literatures"
    : s.startsWith("explores-") ? "Themes"
    : "My shelves";

  const shelves = [...new Set(entries.flatMap((b) => b.shelves))].map((s) => ({
    id: s,
    name: label(s),
    books: entries.filter((b) => b.shelves.includes(s)),
  }));
  const group = (name) => {
    const inGroup = shelves.filter((s) => groupOf(s.id) === name);
    inGroup.sort(name === "Decades"
      ? (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10)
      : (a, b) => b.books.length - a.books.length || a.name.localeCompare(b.name));
    return { name, children: inGroup };
  };

  browseFolders(library, "Books", [
    { name: "READ", books: entries },
    ...["My shelves", "Themes", "Literatures", "Places", "Decades"].map(group),
  ]);
}

const sketchFiles = document.getElementById("sketch-files");
if (sketchFiles && window.SKETCHES) browseFolders(sketchFiles, "Sketches", window.SKETCHES);
