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

// Bookshelves: READ holds every book; each Goodreads shelf opens the same way.
// Books are drawn as spines, and clicking one shows its details.
const library = document.getElementById("library");

if (library && window.LIBRARY) {
  const { books, updated } = window.LIBRARY;
  const stamp = document.getElementById("books-updated");
  stamp.dateTime = updated;
  stamp.textContent = new Date(`${updated}T12:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const el = (tag, props = {}, ...children) => {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  };
  const label = (shelf) => {
    const text = shelf.replace(/-/g, " ");
    return text[0].toUpperCase() + text.slice(1);
  };

  const counts = {};
  books.forEach((b) => b.s.forEach((s) => (counts[s] = (counts[s] || 0) + 1)));
  const groupOf = (s) =>
    /^\d+s$/.test(s) ? "Decades"
    : s.startsWith("set-in-") ? "Places"
    : /-(literature|authors)$/.test(s) ? "Literatures"
    : s.startsWith("explores-") ? "Themes"
    : "My shelves";
  const groups = ["My shelves", "Themes", "Literatures", "Places", "Decades"];

  const SPINE_COLORS = ["#dcd6e8", "#d8dde6", "#e8dde3", "#d9e3de", "#e6e2d6", "#cfcfd6", "#c9c3da", "#bcc6d6", "#efe9f3", "#b9b4c4"];
  const hash = (text) => [...text].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const spineTitle = (title) => title.replace(/\s*\(.*\)\s*$/, "").split(/:\s/)[0];

  let card = null;
  const closeCard = () => {
    if (card) card.remove();
    card = null;
    library.querySelectorAll(".spine.on").forEach((s) => s.classList.remove("on"));
  };

  const showBook = (book, spine) => {
    closeCard();
    spine.classList.add("on");
    const facts = [];
    if (book.r) facts.push(`${book.r}/5`);
    if (book.d) {
      const [y, m] = book.d.split("-").map(Number);
      facts.push(`Read ${new Date(y, m - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`);
    }
    if (book.p) facts.push(`${book.p} pages`);
    if (book.y) facts.push(`Published ${book.y}`);
    card = el("aside", { className: "book-card" },
      el("button", { className: "book-close", type: "button", textContent: "×", ariaLabel: "Close", onclick: closeCard }),
      el("h3", { textContent: book.t }),
      el("p", { textContent: book.a }),
      el("p", { textContent: facts.join(" · ") }),
      el("div", { className: "chips" }, ...book.s.map((s) =>
        el("button", { className: "chip", type: "button", textContent: label(s), onclick: () => openShelf(s) }))),
      el("a", { href: `https://www.goodreads.com/book/show/${book.i}`, target: "_blank", rel: "noopener", textContent: "See on Goodreads" }));
    document.body.append(card);
  };

  const drawSpines = (holder, list) => {
    holder.replaceChildren(...list.map((book) => {
      const h = hash(book.i);
      const spine = el("button", { className: "spine", type: "button", title: `${book.t}, ${book.a}`, ariaLabel: `${book.t} by ${book.a}` },
        el("span", { textContent: spineTitle(book.t) }));
      spine.style.setProperty("--w", `${26 + Math.round((Math.min(book.p || 300, 800) / 800) * 20)}px`);
      spine.style.setProperty("--h", `${148 + (h % 40)}px`);
      spine.style.setProperty("--c", SPINE_COLORS[h % SPINE_COLORS.length]);
      spine.onclick = () => showBook(book, spine);
      return spine;
    }));
  };

  const openShelf = (shelf) => {
    closeCard();
    const shelfBooks = shelf ? books.filter((b) => b.s.includes(shelf)) : books;
    const holder = el("div", { className: "spines" });
    const count = el("span", { className: "shelf-count" });
    const search = el("input", { className: "shelf-search", type: "search", placeholder: "Search this shelf", ariaLabel: "Search this shelf" });
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const list = shelfBooks.filter((b) => !q || `${b.t} ${b.a}`.toLowerCase().includes(q));
      count.textContent = `${list.length} ${list.length === 1 ? "book" : "books"}`;
      closeCard();
      drawSpines(holder, list);
    };
    search.oninput = draw;
    library.replaceChildren(
      el("div", { className: "shelf-head" },
        el("button", { className: "shelf-back", type: "button", textContent: "← All shelves", onclick: showWall }),
        el("span", { className: "shelf-title", textContent: shelf ? label(shelf) : "READ" }),
        count,
        search),
      holder);
    draw();
    document.getElementById("books").scrollIntoView();
  };

  const showWall = () => {
    closeCard();
    library.replaceChildren(
      el("button", { className: "shelf-read", type: "button", onclick: () => openShelf(null) },
        "READ", el("span", { textContent: `all ${books.length} books` })),
      ...groups.map((group) => {
        const shelves = Object.keys(counts).filter((s) => groupOf(s) === group);
        shelves.sort(group === "Decades"
          ? (a, b) => parseInt(b, 10) - parseInt(a, 10)
          : (a, b) => counts[b] - counts[a] || a.localeCompare(b));
        return el("div", { className: "shelf-group" },
          el("h3", { textContent: group }),
          el("div", { className: "shelf-list" }, ...shelves.map((s) =>
            el("button", { className: "shelf-btn", type: "button", onclick: () => openShelf(s) }, label(s), el("small", { textContent: counts[s] })))));
      }));
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCard();
  });
  showWall();
}
