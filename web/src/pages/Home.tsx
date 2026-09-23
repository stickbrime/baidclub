import { useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import AdBar from "@/components/AdBar";
import ClubCard from "@/components/ClubCard";
import { Search, Wrench } from "lucide-react";

const CATEGORIES = [
  "全部",
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

export default function Home() {
  const { data: clubs, isLoading } = trpc.clubs.list.useQuery();
  const [cat, setCat] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [adminMode, setAdminMode] = useState(false);

  const filtered = useMemo(() => {
    let list = clubs ?? [];
    if (cat !== "全部") list = list.filter((c) => c.cat === cat);
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          (c.leader ?? "").toLowerCase().includes(kw) ||
          (c.intro ?? "").toLowerCase().includes(kw),
      );
    }
    return list;
  }, [clubs, cat, keyword]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部导航 */}
      <header className="bg-[#191b3f] text-white z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-3 flex flex-wrap items-center gap-4">
          <div className="shrink-0">
            <h1 className="text-xl font-bold tracking-wide">
              北中国际部<span className="text-violet-300">社团网</span>
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-slate-400">
              BAID CLUB HUB · 2026-2027
            </p>
          </div>
          <div className="flex-1 min-w-[200px] max-w-xl relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full bg-white/10 border border-white/15 rounded-full pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="搜索社团名称 / 社长 / 关键词…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <button
            onClick={() => setAdminMode((v) => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              adminMode
                ? "bg-amber-400 text-slate-900"
                : "bg-white/10 border border-white/15 hover:bg-white/20"
            }`}
          >
            <Wrench size={14} />
            {adminMode ? "退出管理模式" : "管理模式"}
          </button>
        </div>

        {/* 分类导航 */}
        <nav className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm transition-colors ${
                cat === c
                  ? "bg-violet-500 text-white font-medium"
                  : "bg-white text-slate-700 hover:bg-violet-100"
              }`}
            >
              {c}
            </button>
          ))}
        </nav>

        {/* 广告发布栏 */}
        <AdBar adminMode={adminMode} />
      </header>

      {/* 社团卡片 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <p className="text-center text-slate-400 py-20">加载中…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-20">没有找到匹配的社团</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((club) => (
              <ClubCard key={club.id} club={club} adminMode={adminMode} />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 pb-8">
        北中国际部社团网 · BAID ClubHub · 2026-2027 学年
      </footer>
    </div>
  );
}
