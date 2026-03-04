/**
 * converter.js
 * HTML → Markdown converter for Coursera/Astro-based article pages.
 *
 * Expected HTML structure:
 *   <main>
 *     <article>
 *       <header><h1>Title</h1></header>
 *       <hr>
 *       <!-- content: p, h2, h3, ol, ul, blockquote, pre, hr … -->
 *     </article>
 *   </main>
 */

/* =========================================================
   Inline-level converter
   ========================================================= */

/**
 * Recursively converts the inline content of an element to Markdown text.
 * Handles: text nodes, <strong>, <em>, <code>, <a>, <span>.
 * @param {Node} node
 * @returns {string}
 */
function inlineToMd(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    // Collapse excessive whitespace but preserve intentional spaces
    return node.textContent.replace(/\s+/g, " ");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();
  const inner = Array.from(node.childNodes).map(inlineToMd).join("");

  switch (tag) {
    case "strong":
    case "b":
      return `**${inner.trim()}**`;
    case "em":
    case "i":
      return `*${inner.trim()}*`;
    case "code":
      return `\`${inner}\``;
    case "a": {
      const href = node.getAttribute("href") || "#";
      return `[${inner}](${href})`;
    }
    default:
      return inner;
  }
}

/**
 * Returns the trimmed inline Markdown of all child nodes.
 * @param {Element} el
 * @returns {string}
 */
function getInlineContent(el) {
  return Array.from(el.childNodes).map(inlineToMd).join("").trim();
}

/* =========================================================
   Block-level converter
   ========================================================= */

/**
 * Converts a single block-level DOM element to a Markdown string.
 * Returns null for elements that should be skipped (e.g., <header>, <hr> after header).
 * @param {Element} el
 * @param {{ skipHr: boolean }} state
 * @returns {string|null}
 */
function blockToMd(el, state) {
  const tag = el.tagName ? el.tagName.toLowerCase() : null;

  // Skip non-element nodes (whitespace text, comments)
  if (!tag) return null;

  switch (tag) {
    case "header":
      // The <header> holds the <h1> used for frontmatter; skip it in body
      return null;

    case "hr":
      // The first <hr> right after <header> is decorative; skip it once
      if (!state.hrSeen) {
        state.hrSeen = true;
        return null;
      }
      return "---";

    case "h1":
      return `# ${getInlineContent(el)}`;

    case "h2":
      return `## ${getInlineContent(el)}`;

    case "h3":
      return `### ${getInlineContent(el)}`;

    case "h4":
      return `#### ${getInlineContent(el)}`;

    case "h5":
      return `##### ${getInlineContent(el)}`;

    case "h6":
      return `###### ${getInlineContent(el)}`;

    case "p":
      return getInlineContent(el);

    case "ol":
      return listToMd(el, "ordered");

    case "ul":
      return listToMd(el, "unordered");

    case "blockquote": {
      const lines = Array.from(el.children)
        .map((child) => blockToMd(child, state))
        .filter((s) => s !== null)
        .join("\n\n");
      return lines
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
    }

    case "pre": {
      const codeEl = el.querySelector("code");
      const lang =
        codeEl
          ? (codeEl.className.match(/language-(\S+)/) || [])[1] || ""
          : "";
      const text = (codeEl || el).textContent;
      return `\`\`\`${lang}\n${text}\n\`\`\``;
    }

    case "figure":
    case "div":
    case "section":
      // Recurse into generic wrappers
      return childrenToMd(el, state).join("\n\n") || null;

    default:
      return null;
  }
}

/**
 * Converts <ol> or <ul> to Markdown list lines.
 * @param {Element} listEl
 * @param {"ordered"|"unordered"} type
 * @returns {string}
 */
function listToMd(listEl, type) {
  const items = Array.from(listEl.querySelectorAll(":scope > li"));
  return items
    .map((li, i) => {
      const prefix = type === "ordered" ? `${i + 1}.` : "-";
      // Inline content of the <li>, excluding nested lists for now
      const inlineNodes = Array.from(li.childNodes).filter(
        (n) =>
          !(
            n.nodeType === Node.ELEMENT_NODE &&
            ["ol", "ul"].includes(n.tagName.toLowerCase())
          )
      );
      const text = inlineNodes.map(inlineToMd).join("").trim();

      // Handle nested lists
      const nestedLists = Array.from(li.children).filter((n) =>
        ["ol", "ul"].includes(n.tagName.toLowerCase())
      );
      const nested = nestedLists
        .map((nl) =>
          listToMd(nl, nl.tagName.toLowerCase() === "ol" ? "ordered" : "unordered")
            .split("\n")
            .map((l) => `  ${l}`)
            .join("\n")
        )
        .join("\n");

      return nested ? `${prefix} ${text}\n${nested}` : `${prefix} ${text}`;
    })
    .join("\n");
}

/**
 * Converts all direct element children of a parent node to Markdown blocks.
 * @param {Element} parent
 * @param {object} state
 * @returns {string[]}
 */
function childrenToMd(parent, state) {
  return Array.from(parent.children)
    .map((child) => blockToMd(child, state))
    .filter((s) => s !== null && s.trim() !== "");
}

/* =========================================================
   Main conversion function
   ========================================================= */

/**
 * Converts the full HTML string to a Markdown document with YAML frontmatter.
 * @param {string} htmlString
 * @returns {{ markdown: string, title: string, filename: string }}
 */
function convertHtmlToMarkdown(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Locate the <article> element (the canonical content root)
  const article = doc.querySelector("article") || doc.body;

  // Extract title from <h1> inside <header>
  const h1 = article.querySelector("header h1") || article.querySelector("h1");
  const title = h1 ? h1.textContent.trim() : "Untitled";

  // Build body blocks
  const state = { hrSeen: false };
  const blocks = childrenToMd(article, state);

  // Build YAML frontmatter
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const frontmatter = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: ${today}\n---`;

  const markdown = `${frontmatter}\n\n${blocks.join("\n\n")}\n`;

  // Build filename from title (slug)
  const filename = slugify(title) + ".md";

  return { markdown, title, filename };
}

/**
 * Converts a string to a URL/file-safe slug.
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* =========================================================
   UI logic
   ========================================================= */

(function initUI() {
  const htmlInput = document.getElementById("html-input");
  const mdOutput = document.getElementById("md-output");
  const convertBtn = document.getElementById("convert-btn");
  const downloadBtn = document.getElementById("download-btn");
  const clearBtn = document.getElementById("clear-btn");
  const filenameLabel = document.getElementById("output-filename");
  const toast = document.getElementById("toast");

  let currentFilename = "";
  let currentMarkdown = "";

  // ── Convert ──────────────────────────────────────────────
  convertBtn.addEventListener("click", () => {
    const raw = htmlInput.value.trim();

    if (!raw) {
      showToast("Pega primero el HTML del artículo.", true);
      return;
    }

    try {
      const { markdown, filename } = convertHtmlToMarkdown(raw);
      currentMarkdown = markdown;
      currentFilename = filename;

      mdOutput.value = markdown;
      filenameLabel.textContent = filename;
      downloadBtn.disabled = false;

      showToast("¡Conversión exitosa!");
    } catch (err) {
      console.error(err);
      showToast("Error al convertir. Verifica el HTML.", true);
    }
  });

  // ── Download ──────────────────────────────────────────────
  downloadBtn.addEventListener("click", () => {
    if (!currentMarkdown) return;

    const blob = new Blob([currentMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFilename;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Descargando ${currentFilename}`);
  });

  // ── Clear ─────────────────────────────────────────────────
  clearBtn.addEventListener("click", () => {
    htmlInput.value = "";
    mdOutput.value = "";
    filenameLabel.textContent = "";
    currentMarkdown = "";
    currentFilename = "";
    downloadBtn.disabled = true;
    htmlInput.focus();
  });

  // ── Toast helper ──────────────────────────────────────────
  let toastTimer;

  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle("toast--error", isError);
    toast.classList.add("toast--visible");

    toastTimer = setTimeout(() => {
      toast.classList.remove("toast--visible");
    }, 2800);
  }
})();
