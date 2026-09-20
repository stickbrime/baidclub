import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/providers/trpc";
import type { Club } from "@db/schema";
import AnnouncementBoard from "@/components/AnnouncementBoard";
import { Pencil, Trash2, X, QrCode, ImagePlus } from "lucide-react";

const CATEGORIES = [
  "艺术与设计类",
  "科学与技术类",
  "影视与媒体类",
  "人文与社科类",
  "思维与逻辑类",
  "心理与成长类",
  "体育与运动类",
  "商业与实践类",
  "公益与服务类",
];

function resizeImage(file: File, maxW: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ClubCard({ club, adminMode }: { club: Club; adminMode: boolean }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: club.name,
    cat: club.cat,
    leader: club.leader ?? "",
    advisor: club.advisor ?? "",
    time: club.time ?? "",
    room: club.room ?? "",
    intro: club.intro ?? "",
  });
  const posterRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  const updateClub = trpc.clubs.update.useMutation({
    onSuccess: () => utils.clubs.list.invalidate(),
  });
  const deleteClub = trpc.clubs.delete.useMutation({
    onSuccess: () => utils.clubs.list.invalidate(),
  });

  const onPosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await resizeImage(file, 800);
    updateClub.mutate({ id: club.id, poster: data });
    e.target.value = "";
  };

  const onQrChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await resizeImage(file, 400);
    updateClub.mutate({ id: club.id, qr: data });
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      {/* 海报区域 */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center group">
        {club.poster ? (
          <img src={club.poster} alt={club.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={`text-white/80 text-center ${adminMode ? "cursor-pointer hover:text-white" : ""}`}>
            <div className="text-3xl mb-1">＋</div>
            <div className="text-sm">待添加海报</div>
          </div>
        )}
        <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full bg-indigo-600/90 text-white backdrop-blur">
          {club.cat}
        </span>
        {adminMode && (
          <>
            <input ref={posterRef} type="file" accept="image/*" className="hidden" onChange={onPosterChange} />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <button
                onClick={() => posterRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-800 text-sm font-medium hover:bg-white flex items-center gap-1"
              >
                <ImagePlus size={14} />
                {club.poster ? "更换海报" : "添加海报"}
              </button>
              {club.poster && (
                <button
                  onClick={() => updateClub.mutate({ id: club.id, poster: null })}
                  className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-sm font-medium hover:bg-red-500 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-800 leading-snug">{club.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          社长：{club.leader || "待定"}
          {club.time && <span className="text-slate-400"> · {club.time}</span>}
        </p>
        {club.intro && (
          <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-3">{club.intro}</p>
        )}

        {/* 二维码区域 */}
        <div className="mt-3 flex items-center gap-2">
          {adminMode && (
            <>
              <input ref={qrRef} type="file" accept="image/*" className="hidden" onChange={onQrChange} />
              <div className="relative group/qr">
                {club.qr ? (
                  <img src={club.qr} alt="招新群二维码" className="w-10 h-10 rounded border border-slate-200" />
                ) : (
                  <div className="w-10 h-10 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                    <QrCode size={16} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/qr:opacity-100 transition-opacity">
                  <button
                    onClick={() => qrRef.current?.click()}
                    className="w-5 h-5 rounded bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white"
                    title={club.qr ? "更换二维码" : "添加二维码"}
                  >
                    <ImagePlus size={11} />
                  </button>
                  {club.qr && (
                    <button
                      onClick={() => updateClub.mutate({ id: club.id, qr: null })}
                      className="w-5 h-5 rounded bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500"
                      title="删除二维码"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
          {!adminMode && (
            <>
              {club.qr ? (
                <img src={club.qr} alt="招新群二维码" className="w-10 h-10 rounded border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                  <QrCode size={16} />
                </div>
              )}
            </>
          )}
          <span className="text-xs text-slate-400">{club.qr ? "扫码加入招新群" : "待添加群二维码"}</span>
        </div>

        {adminMode && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Pencil size={13} /> 编辑
            </button>
            <button
              onClick={() => {
                if (confirm(`确定删除「${club.name}」吗？其公告也会一并删除。`))
                  deleteClub.mutate({ id: club.id });
              }}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 size={13} /> 删除
            </button>
          </div>
        )}

        <AnnouncementBoard clubId={club.id} clubName={club.name} adminMode={adminMode} />
      </div>

      {editing && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">编辑社团</h3>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="社团名称 *">
                <input
                  className="edit-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="分类">
                <select
                  className="edit-input"
                  value={form.cat}
                  onChange={(e) => setForm({ ...form, cat: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="社长">
                  <input
                    className="edit-input"
                    value={form.leader}
                    onChange={(e) => setForm({ ...form, leader: e.target.value })}
                  />
                </Field>
                <Field label="指导老师">
                  <input
                    className="edit-input"
                    value={form.advisor}
                    onChange={(e) => setForm({ ...form, advisor: e.target.value })}
                  />
                </Field>
                <Field label="活动时间">
                  <input
                    className="edit-input"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </Field>
                <Field label="活动地点">
                  <input
                    className="edit-input"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="社团简介">
                <textarea
                  className="edit-input min-h-[100px]"
                  value={form.intro}
                  onChange={(e) => setForm({ ...form, intro: e.target.value })}
                />
              </Field>
            </div>
            <button
              disabled={!form.name.trim() || updateClub.isPending}
              onClick={() => {
                updateClub.mutate({ id: club.id, ...form, name: form.name.trim() });
                setEditing(false);
              }}
              className="mt-5 w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {updateClub.isPending ? "保存中…" : "保存修改"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
