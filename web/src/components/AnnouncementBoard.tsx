import { useState } from "react";
import { trpc } from "@/providers/trpc";
import RichTextEditor from "@/components/RichTextEditor";
import { sanitizeHtml, htmlToText } from "@/lib/richtext";
import { MessageSquarePlus, ChevronDown, ChevronUp, Trash2, Send, Pencil } from "lucide-react";

export default function AnnouncementBoard({
  clubId,
  clubName,
  adminMode,
}: {
  clubId: number;
  clubName: string;
  adminMode: boolean;
}) {
  const utils = trpc.useUtils();
  const [expanded, setExpanded] = useState(false);
  const [composing, setComposing] = useState(false);
  const [html, setHtml] = useState("");
  const [author, setAuthor] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editHtml, setEditHtml] = useState("");
  const [editAuthor, setEditAuthor] = useState("");

  const { data: items } = trpc.announcements.list.useQuery(
    { clubId },
    { enabled: expanded },
  );
  const createAnn = trpc.announcements.create.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate({ clubId });
      setComposing(false);
      setHtml("");
      setAuthor("");
    },
    onError: (err) => console.error("公告发布失败:", err),
  });
  const updateAnn = trpc.announcements.update.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate({ clubId });
      setEditingId(null);
      setEditHtml("");
      setEditAuthor("");
    },
    onError: (err) => console.error("公告更新失败:", err),
  });
  const deleteAnn = trpc.announcements.delete.useMutation({
    onSuccess: () => utils.announcements.list.invalidate({ clubId }),
  });

  const canSubmit = htmlToText(html).length > 0 && !createAnn.isPending;
  const canSaveEdit = htmlToText(editHtml).length > 0 && !updateAnn.isPending;

  const startEdit = (a: { id: number; author: string | null; contentHtml: string }) => {
    setEditingId(a.id);
    setEditHtml(a.contentHtml);
    setEditAuthor(a.author ?? '');
  };

  return (
    <div className="border-t border-dashed border-slate-200 mt-3 pt-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <MessageSquarePlus size={15} />
          社团公告{items && items.length > 0 ? `（${items.length}）` : ""}
        </span>
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {!composing ? (
            <button
              onClick={() => setComposing(true)}
              className="w-full py-2 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-500 text-sm font-medium hover:bg-indigo-50 transition-colors"
            >
              ＋ 点此发布社团公告
            </button>
          ) : (
            <div className="space-y-2 bg-indigo-50/50 rounded-lg p-3">
              <RichTextEditor onChange={setHtml} />
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="署名（选填），如：社长 张三"
                  value={author}
                  maxLength={30}
                  onChange={(e) => setAuthor(e.target.value)}
                />
                <button
                  disabled={!canSubmit}
                  onClick={() =>
                    createAnn.mutate({
                      clubId,
                      author: author.trim() || undefined,
                      contentHtml: sanitizeHtml(html),
                    })
                  }
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  <Send size={13} />
                  {createAnn.isPending ? "发布中…" : "发布"}
                </button>
                <button
                  onClick={() => setComposing(false)}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  取消
                </button>
              </div>
              {createAnn.isError && (
                <p className="text-xs text-red-500">发布失败：{createAnn.error?.message || "请稍后重试"}</p>
              )}
            </div>
          )}

          {items && items.length > 0 ? (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {items.map((a) => (
                <li key={a.id} className="bg-slate-50 rounded-lg p-3 relative group">
                  {editingId === a.id ? (
                    <div className="space-y-2">
                      <RichTextEditor onChange={setEditHtml} initialValue={editHtml} />
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          placeholder="署名（选填）"
                          value={editAuthor}
                          maxLength={30}
                          onChange={(e) => setEditAuthor(e.target.value)}
                        />
                        <button
                          disabled={!canSaveEdit}
                          onClick={() =>
                            updateAnn.mutate({
                              id: a.id,
                              author: editAuthor.trim() || undefined,
                              contentHtml: sanitizeHtml(editHtml),
                            })
                          }
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                        >
                          {updateAnn.isPending ? "保存中…" : "保存"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                      {updateAnn.isError && (
                        <p className="text-xs text-red-500">保存失败，请稍后重试</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div
                        className="announcement-content text-sm text-slate-700"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.contentHtml) }}
                      />
                      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                        <span>{a.author || clubName}</span>
                        <span>
                          {new Date(a.createdAt).toLocaleString("zh-CN", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {adminMode && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="text-indigo-400 hover:text-indigo-500 p-1"
                            title="编辑公告"
                            onClick={() => startEdit(a)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="text-red-400 hover:text-red-500 p-1"
                            title="删除公告"
                            onClick={() => deleteAnn.mutate({ id: a.id })}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            items && <p className="text-xs text-slate-400 text-center py-1">暂无公告，来发布第一条吧～</p>
          )}
        </div>
      )}
    </div>
  );
}
