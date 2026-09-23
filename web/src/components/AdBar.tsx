import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/providers/trpc";
import { Megaphone, Plus, X, Trash2, ImagePlus, Pencil } from "lucide-react";

export default function AdBar({ adminMode }: { adminMode: boolean }) {
  const utils = trpc.useUtils();
  const { data: ads } = trpc.ads.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createAd = trpc.ads.create.useMutation({
    onSuccess: () => {
      utils.ads.list.invalidate();
      closeForm();
    },
    onError: (err) => console.error("广告发布失败:", err),
  });
  const updateAd = trpc.ads.update.useMutation({
    onSuccess: () => {
      utils.ads.list.invalidate();
      closeForm();
    },
    onError: (err) => console.error("广告更新失败:", err),
  });
  const deleteAd = trpc.ads.delete.useMutation({
    onSuccess: () => utils.ads.list.invalidate(),
  });

  const items = ads ?? [];
  const scrolling = items.length > 1;
  const imageAds = items.filter((a: any) => a.image);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setLink("");
    setAuthor("");
    setImage(null);
    setEditingId(null);
  };

  const closeForm = () => {
    resetForm();
    setOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (ad: any) => {
    setEditingId(ad.id);
    setTitle(ad.title ?? "");
    setContent(ad.content ?? "");
    setLink(ad.link ?? "");
    setAuthor(ad.author ?? "");
    setImage(ad.image ?? null);
    setOpen(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        let { width, height } = img;
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        setImage(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const isEditing = editingId !== null;
  const isPending = createAd.isPending || updateAd.isPending;
  const canSubmit = ((title.trim() || content.trim() || image) && !isPending);

  const handleSubmit = () => {
    const payload = {
      title: title.trim() || undefined,
      content: content.trim() || undefined,
      link: link.trim() || undefined,
      author: author.trim() || undefined,
      image: image || undefined,
    };
    if (isEditing) {
      updateAd.mutate({ id: editingId!, ...payload });
    } else {
      createAd.mutate(payload);
    }
  };

  const actionError = isEditing ? updateAd.error : createAd.error;

  return (
    <div className="bg-gradient-to-r from-amber-400/15 via-yellow-300/10 to-amber-400/15 border-b border-amber-300/20">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-amber-300 text-sm font-semibold shrink-0">
          <Megaphone size={16} />
          广告栏
        </span>

        <div className="flex-1 overflow-hidden relative min-h-[24px]">
          {items.length === 0 ? (
            <span className="text-sm text-slate-400">
              暂无广告，点击右侧「点此发布」发布第一条广告～
            </span>
          ) : (
            <div className={scrolling ? "ad-marquee" : ""}>
              <div className={scrolling ? "ad-marquee-track" : "flex items-center gap-8"}>
                {(scrolling ? [...items, ...items] : items).map((ad: any, i: number) => (
                  <span
                    key={`${ad.id}-${i}`}
                    className="inline-flex items-center gap-2 text-sm text-amber-100 whitespace-nowrap mr-10"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {ad.link ? (
                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline font-medium"
                      >
                        {ad.title}
                      </a>
                    ) : (
                      <span className="font-medium">{ad.title}</span>
                    )}
                    {ad.content && <span className="text-amber-200/70">{ad.content}</span>}
                    {ad.author && <span className="text-xs text-slate-400">— {ad.author}</span>}
                    {adminMode && i < items.length && (
                      <span className="inline-flex items-center gap-1 ml-1">
                        <button
                          className="text-amber-300 hover:text-amber-200"
                          title="编辑广告"
                          onClick={() => openEdit(ad)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300"
                          title="删除广告"
                          onClick={() => deleteAd.mutate({ id: ad.id })}
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300 transition-colors"
        >
          <Plus size={14} />
          点此发布
        </button>
      </div>

      {/* 图片广告展示区 */}
      {imageAds.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-2 space-y-2">
          {imageAds.map((ad: any) => (
            <div key={ad.id} className="relative group">
              {ad.link ? (
                <a href={ad.link} target="_blank" rel="noreferrer">
                  <img
                    src={ad.image}
                    alt={ad.title || "广告图片"}
                    className="w-full rounded-lg"
                    style={{ height: "auto" }}
                  />
                </a>
              ) : (
                <img
                  src={ad.image}
                  alt={ad.title || "广告图片"}
                  className="w-full rounded-lg"
                  style={{ height: "auto" }}
                />
              )}
              {adminMode && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70"
                    title="编辑广告"
                    onClick={() => openEdit(ad)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="bg-black/50 text-white p-1.5 rounded-lg hover:bg-red-600"
                    title="删除广告"
                    onClick={() => deleteAd.mutate({ id: ad.id })}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={closeForm}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? "编辑广告" : "发布广告"}
              </h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">广告标题</label>
                <input
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
                  placeholder="例如：xx社团招新宣讲会"
                  value={title}
                  maxLength={60}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">补充说明</label>
                <input
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
                  placeholder="例如：本周五中午 12:30 阶梯教室"
                  value={content}
                  maxLength={120}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">链接（选填）</label>
                <input
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
                  placeholder="https://…"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">发布人 / 社团（选填）</label>
                <input
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
                  placeholder="署名"
                  value={author}
                  maxLength={30}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">上传图片（选填）</label>
                <div className="mt-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                  />
                  {image ? (
                    <div className="relative">
                      <img src={image} alt="预览" className="w-full rounded-lg max-h-48 object-contain bg-slate-100" />
                      <button
                        onClick={() => setImage(null)}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-lg hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-6 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors flex flex-col items-center gap-1.5"
                    >
                      <ImagePlus size={24} />
                      <span className="text-sm">点击上传图片</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="mt-5 w-full py-2.5 rounded-lg bg-amber-400 text-slate-900 font-semibold text-sm hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {isPending ? "保存中…" : isEditing ? "保存修改" : "确认发布"}
            </button>
            {actionError && (
              <p className="mt-2 text-xs text-red-500 text-center">
                {isEditing ? "更新" : "发布"}失败：{actionError.message || "请稍后重试"}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
