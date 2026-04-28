type NameSource = {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

export function displayName(u: NameSource | null | undefined): string {
  if (!u) return "";
  const first = u.first_name?.trim();
  const last = u.last_name?.trim();
  return [first, last].filter(Boolean).join(" ");
}

export function initials(u: NameSource | null | undefined): string {
  const name = displayName(u);
  if (!name) return "U";
  return (
    name
      .split(/[\s._-]+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || name[0]?.toUpperCase() || "U"
  );
}
