import DOMPurify from "dompurify";

/**
 * Clean HTML pasted from Word / web pages:
 * - strips Word junk (mso-*, <o:p>, comments, classes)
 * - keeps structure & basic typography (bold/italic/underline/lists/colors/sizes/alignment/tables)
 */
export function cleanPastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Remove Word-only elements and comments
  doc.querySelectorAll("o\\:p, style, script, meta, link, title, xml").forEach((n) => n.remove());
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
  const comments: Node[] = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.parentNode?.removeChild(c));

  doc.body.querySelectorAll("*").forEach((el) => {
    // drop classes / ids / word attributes
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name === "class" || name === "id" || name.startsWith("data-") || name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    }
    // clean inline styles: keep a safe subset
    const style = el.getAttribute("style");
    if (style) {
      const kept: string[] = [];
      const decls = style.split(";");
      for (const d of decls) {
        const [propRaw, ...rest] = d.split(":");
        if (!propRaw || rest.length === 0) continue;
        const prop = propRaw.trim().toLowerCase();
        const value = rest.join(":").trim();
        if (!value || /expression|url\s*\(/i.test(value)) continue;
        if (
          [
            "color",
            "background-color",
            "font-size",
            "font-weight",
            "font-style",
            "text-decoration",
            "text-decoration-line",
            "text-align",
            "font-family",
            "line-height",
            "text-indent",
            "margin-left",
            "padding-left",
          ].includes(prop)
        ) {
          kept.push(`${prop}: ${value}`);
        }
      }
      if (kept.length) el.setAttribute("style", kept.join("; "));
      else el.removeAttribute("style");
    }
    // unwrap images pasted from word (usually huge base64) — replace with placeholder text
    if (el.tagName === "IMG") {
      const span = doc.createElement("span");
      span.textContent = "［图片暂不支持粘贴，请以文字描述］";
      span.setAttribute("style", "color:#94a3b8;font-size:12px");
      el.replaceWith(span);
    }
  });

  return sanitizeHtml(doc.body.innerHTML);
}

/** Final safety pass before rendering / saving. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "b", "strong", "i", "em", "u", "s", "strike", "span", "div",
      "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "hr",
      "table", "thead", "tbody", "tr", "td", "th", "a", "font", "sub", "sup",
    ],
    ALLOWED_ATTR: ["style", "href", "target", "rel", "colspan", "rowspan", "align", "color", "face", "size"],
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  });
}

export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").trim();
}
