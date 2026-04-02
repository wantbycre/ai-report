import ChartDemoClient from "./ChartDemoClient";

export default function Page() {
  return (
    <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
          한국 금거래소 트레이딩 시스템
        </h1>
        <p style={{ color: "#666" }}>Next.js SSR 환경 기반 실시간 차트 시연</p>
      </header>

      <section
        style={{
          border: "1px solid #eaeaea",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "#fff",
        }}
      >
        <ChartDemoClient />
      </section>

      <footer style={{ marginTop: "20px", fontSize: "13px", color: "#999" }}>
        © 2026 한국 금거래소 시뮬레이션 - TradingView Lightweight Charts 적용
      </footer>
    </main>
  );
}
