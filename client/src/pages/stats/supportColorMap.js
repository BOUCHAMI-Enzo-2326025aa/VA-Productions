export function normalizeSupportName(name) {
  return String(name || "").trim().toLowerCase();
}

function generateHslColor(index) {
  // Golden angle to spread hues
  const hue = (index * 137.508) % 360;
  return `hsl(${hue} 70% 45%)`;
}

export function buildSupportColorMap(supportNames, basePalette = []) {
  const unique = Array.from(
    new Set((supportNames || []).map((n) => normalizeSupportName(n)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "fr-FR"));

  const map = {};
  unique.forEach((key, index) => {
    map[key] = basePalette[index] || generateHslColor(index);
  });

  return map;
}

export function getSupportColor(supportName, colorMap, fallback) {
  const key = normalizeSupportName(supportName);
  return (colorMap && key && colorMap[key]) || fallback;
}
