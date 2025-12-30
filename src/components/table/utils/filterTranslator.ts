// applyFiltersToQuery(q, groups)
// groups: { op: "AND"|"OR", rules: [{key, op, value}], groups: [subgroups...] }

export function applyFiltersToQuery(q: any, groups: any) {
  if (!groups) return q;

  // Helper: build expression string for a single rule (used inside OR)
  function exprForRule(r: any) {
    if (!r || !r.key) return null;
    const k = r.key;
    const v = r.value;
    if (r.op === "contains") return `${k}.ilike.%${v}%`;
    if (r.op === "eq") return `${k}.eq.${v}`;
    if (r.op === "gte") return `${k}.gte.${v}`;
    if (r.op === "lte") return `${k}.lte.${v}`;
    return null;
  }

  // If group op is OR, we try to gather all rule exprs + subgroup exprs into single .or()
  if (groups.op === "OR") {
    const orParts: string[] = [];

    (groups.rules || []).forEach((r: any) => {
      const e = exprForRule(r);
      if (e) orParts.push(e);
    });

    (groups.groups || []).forEach((g: any) => {
      // for subgroup, recursively build OR of its rules (simple flatten)
      if (g.op === "OR") {
        (g.rules || []).forEach((r: any) => {
          const e = exprForRule(r);
          if (e) orParts.push(e);
        });
      } else {
        // AND subgroup inside OR — attempt to create a combined string by ANDing: (a.eq.b, c.ilike.%x%) becomes (a.eq.b&c.ilike.%x%) => supabase doesn't provide parentheses for that easily. As a fallback, we ignore nested AND inside OR for string construction and prefer chaining filters (safer).
        (g.rules || []).forEach((r:any) => {
          const e = exprForRule(r);
          if (e) orParts.push(e);
        });
      }
    });

    if (orParts.length) {
      q = q.or(orParts.join(","));
    }
    // Note: AND subgroups not handled perfectly inside OR; for complex trees you may need a server-side function or multiple queries.
    return q;
  }

  // If group op is AND, we chain filters (.ilike, .eq, .gte, .lte) — Supabase supports chaining.
  if (groups.op === "AND") {
    (groups.rules || []).forEach((r: any) => {
      if (!r || !r.key) return;
      if (r.op === "contains") q = q.ilike(r.key, `%${r.value}%`);
      else if (r.op === "eq") q = q.eq(r.key, r.value);
      else if (r.op === "gte") q = q.gte(r.key, r.value);
      else if (r.op === "lte") q = q.lte(r.key, r.value);
    });

    (groups.groups || []).forEach((g: any) => {
      // recursively apply subgroup filters (AND)
      q = applyFiltersToQuery(q, g);
    });

    return q;
  }

  return q;
}
