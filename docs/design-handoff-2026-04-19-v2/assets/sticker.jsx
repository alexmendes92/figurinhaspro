// Sticker component — procedural, colorful, not a copy of any real trading card
const { useMemo } = React;

function teamColors(teamCode) {
  const t = window.FP_DATA.teams.find((t) => t.code === teamCode) || window.FP_DATA.teams[0];
  return { c1: t.c1, c2: t.c2, name: t.name };
}

function Sticker({
  s,
  qty = 0,
  size = "md",
  selected = false,
  onClick,
  showBadge = true,
  tallied = false,
}) {
  const { c1, c2 } = useMemo(() => teamColors(s.team), [s.team]);
  const own = qty > 0;
  const sizeCls = size === "lg" ? "sticker lg" : size === "sm" ? "sticker sm" : "sticker";
  return (
    <div
      className={`${sizeCls} ${own ? "own" : ""} ${tallied ? "tallied" : ""} ${selected ? "selected" : ""}`}
      data-have={own ? "1" : "0"}
      data-rarity={s.rarity}
      style={{ "--s1": c1, "--s2": c2 }}
      onClick={onClick}
      title={`#${String(s.num).padStart(3, "0")} · ${s.label}`}
    >
      <div className="s-bg" />
      <span className="s-num">{String(s.num).padStart(3, "0")}</span>
      <span className="s-team">{s.team}</span>
      <div className="s-body">
        {s.type === "logo" && <Shield c1={c1} c2={c2} />}
        {s.type === "team" && <TeamPhoto />}
        {s.type === "player" && <div className="s-silhouette" />}
      </div>
      <div className="s-foot">
        <div className="s-name">{s.label}</div>
        {s.role && <div className="s-role">{s.role}</div>}
      </div>
      {own && <div className="s-qty">×{qty}</div>}
      {showBadge && s.rarity !== "common" && (
        <div
          className="s-badge"
          style={{
            background:
              s.rarity === "holo"
                ? "linear-gradient(135deg,#F9C846,#E8571C,#7A1E75)"
                : s.rarity === "legend"
                  ? "#F9C846"
                  : "#60A5FA",
            color: s.rarity === "holo" ? "#fff" : "#111",
          }}
        >
          {s.rarity === "holo" ? "HOLO" : s.rarity === "legend" ? "LEND" : "RARE"}
        </div>
      )}
    </div>
  );
}

function Shield({ c1, c2 }) {
  return (
    <svg viewBox="0 0 40 50" width="60%" height="80%">
      <path
        d="M20 2 L38 10 L38 26 C38 38, 28 46, 20 48 C12 46, 2 38, 2 26 L2 10 Z"
        fill="rgba(255,255,255,.95)"
        stroke="rgba(0,0,0,.15)"
      />
      <path d="M20 6 L34 12 L34 26 C34 36, 26 42, 20 44 C14 42, 6 36, 6 26 L6 12 Z" fill={c1} />
      <circle cx="20" cy="24" r="5" fill={c2} />
    </svg>
  );
}
function TeamPhoto() {
  return (
    <svg viewBox="0 0 60 40" width="80%" height="80%">
      <rect width="60" height="40" rx="3" fill="rgba(0,0,0,.2)" />
      {[6, 16, 26, 36, 46].map((x, i) => (
        <circle key={i} cx={x} cy={16} r="3.2" fill="rgba(255,255,255,.4)" />
      ))}
      {[11, 21, 31, 41].map((x, i) => (
        <circle key={i} cx={x} cy={26} r="3" fill="rgba(255,255,255,.35)" />
      ))}
    </svg>
  );
}

window.Sticker = Sticker;
window.teamColors = teamColors;
