"use client";

/**
 * 루트 레이아웃 자체가 실패했을 때의 최후 경계. 레이아웃·전역 CSS가 없으므로 인라인 스타일만 쓴다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF9",
          color: "#1C1B22",
          fontFamily: "Pretendard, system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>페이지를 잠시 불러올 수 없어요</h1>
          <p style={{ color: "#6B6A75", marginTop: 12 }}>잠시 후 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "10px 20px",
              borderRadius: 10,
              border: 0,
              background: "#5B4FD6",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
          {error.digest && (
            <p style={{ color: "#6B6A75", fontSize: 12, marginTop: 24 }}>오류 ID {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
