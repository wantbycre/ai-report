export async function getReports() {
  await new Promise((res) => setTimeout(res, 1500));

  return [
    { id: 1, title: "AI Market Analysis", createdAt: "2026-02-24" },
    { id: 2, title: "Startup Risk Report", createdAt: "2026-02-23" },
    { id: 3, title: "Crypto Trend Summary", createdAt: "2026-02-22" },
  ];
}
