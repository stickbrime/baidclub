import { useEffect, useRef, useState } from "react";
import { cleanPastedHtml, htmlToText } from "@/lib/richtext";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
  Undo2,
  Redo2,
  Heading2,
} from "lucide-react";

const FONT_SIZES = [
  { label: "小", value: "2" },
  { label: "标准", value: "3" },
  { label: "大", value: "5" },
  { label: "特大", value: "6" },
];

export type RichTextEditorHandle = {
  getHtml: () => string;
  isEmpty: () => boolean;
  clear: () => void;
};

export default function RichTextEditor({
  placeholder = "在此输入公告内容，支持直接从 Word 复制粘贴（保留字体、颜色、加粗、列表、表格等排版）…",
  minHeight = 140,
  onChange,
  initialValue = "",
}: {
  placeholder?: string;
  minHeight?: number;
  onChange?: (html: string) => void;
  initialValue?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    if (initialValue && ref.current) {
      ref.current.innerHTML = initialValue;
      setEmpty(htmlToText(initialValue).length === 0);
    }
  }, [initialValue]);

  const sync = () => {
    const html = ref.current?.innerHTML ?? "";
    setEmpty(htmlToText(html).length === 0);
    onChange?.(html);
  };

  const exec = (cmd: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    sync();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    const cleaned = html
      ? cleanPastedHtml(html)
      : text
          .split(/\n{2,}/)
          .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
          .join("");
    ref.current?.focus();
    document.execCommand("insertHTML", false, cleaned);
    sync();
  };

  const btn =
    "p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-40";

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-400">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        <button type="button" className={btn} title="加粗" onClick={() => exec("bold")}>
          <Bold size={15} />
        </button>
        <button type="button" className={btn} title="斜体" onClick={() => exec("italic")}>
          <Italic size={15} />
        </button>
        <button type="button" className={btn} title="下划线" onClick={() => exec("underline")}>
          <Underline size={15} />
        </button>
        <span className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" className={btn} title="标题" onClick={() => exec("formatBlock", "h3")}>
          <Heading2 size={15} />
        </button>
        <select
          className="text-xs border border-slate-300 rounded px-1 py-0.5 bg-white text-slate-600 mx-0.5"
          title="字号"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) exec("fontSize", e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            字号
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="color"
          className="w-6 h-6 p-0 border border-slate-300 rounded cursor-pointer mx-0.5"
          title="文字颜色"
          defaultValue="#1e293b"
          onChange={(e) => exec("foreColor", e.target.value)}
        />
        <span className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" className={btn} title="无序列表" onClick={() => exec("insertUnorderedList")}>
          <List size={15} />
        </button>
        <button type="button" className={btn} title="有序列表" onClick={() => exec("insertOrderedList")}>
          <ListOrdered size={15} />
        </button>
        <span className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" className={btn} title="左对齐" onClick={() => exec("justifyLeft")}>
          <AlignLeft size={15} />
        </button>
        <button type="button" className={btn} title="居中" onClick={() => exec("justifyCenter")}>
          <AlignCenter size={15} />
        </button>
        <button type="button" className={btn} title="右对齐" onClick={() => exec("justifyRight")}>
          <AlignRight size={15} />
        </button>
        <span className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" className={btn} title="撤销" onClick={() => exec("undo")}>
          <Undo2 size={15} />
        </button>
        <button type="button" className={btn} title="重做" onClick={() => exec("redo")}>
          <Redo2 size={15} />
        </button>
        <button
          type="button"
          className={btn}
          title="清除格式"
          onClick={() => {
            exec("removeFormat");
            exec("formatBlock", "p");
          }}
        >
          <Eraser size={15} />
        </button>
      </div>
      <div className="relative">
        {empty && (
          <div className="absolute top-2.5 left-3 text-sm text-slate-400 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className="announcement-editor px-3 py-2.5 text-sm text-slate-800 outline-none overflow-y-auto"
          style={{ minHeight, maxHeight: 320 }}
          onInput={sync}
          onPaste={onPaste}
          onBlur={sync}
        />
      </div>
    </div>
  );
}
