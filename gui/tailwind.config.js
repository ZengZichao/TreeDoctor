/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        treedoc: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        // Semantic tokens (mapped to CSS variables)
        td: {
          primary: "var(--td-primary)",
          "primary-hover": "var(--td-primary-hover)",
          "primary-active": "var(--td-primary-active)",
          // 文本/链接专用绿 — 与填充面分离（UX-03）
          "primary-text": "var(--td-primary-text)",
          brand: "var(--td-brand)",
          success: "var(--td-success)",
          warning: "var(--td-warning)",
          error: "var(--td-error)",
          info: "var(--td-info)",
          canvas: "var(--td-canvas)",
          "canvas-soft": "var(--td-canvas-soft)",
          "canvas-soft-2": "var(--td-canvas-soft-2)",
          "bg-base": "var(--td-bg-base)",
          "bg-layout": "var(--td-bg-layout)",
          "bg-container": "var(--td-bg-container)",
          "bg-elevated": "var(--td-bg-elevated)",
          text: "var(--td-text)",
          "text-secondary": "var(--td-text-secondary)",
          "text-tertiary": "var(--td-text-tertiary)",
          "text-quaternary": "var(--td-text-quaternary)",
          border: "var(--td-border)",
          "border-secondary": "var(--td-border-secondary)",
          "border-strong": "var(--td-border-strong)",
          fill: "var(--td-fill)",
          "fill-secondary": "var(--td-fill-secondary)",
          "fill-tertiary": "var(--td-fill-tertiary)",
          // 图表分类色（非文本对比度 ≥3:1，UX-13）
          "chart-1": "var(--td-chart-1)",
          "chart-2": "var(--td-chart-2)",
          "chart-3": "var(--td-chart-3)",
          "chart-4": "var(--td-chart-4)",
          "chart-5": "var(--td-chart-5)",
          "chart-neutral": "var(--td-chart-neutral)",
        },
      },
      borderRadius: {
        "td-xs": "4px",
        "td-sm": "6px",
        "td": "8px",
        "td-lg": "12px",
        "td-xl": "16px",
      },
      boxShadow: {
        "td-xs": "var(--td-shadow-xs)",
        "td-sm": "var(--td-shadow-sm)",
        "td": "var(--td-shadow)",
        "td-lg": "var(--td-shadow-lg)",
      },
      fontFamily: {
        sans: ['var(--td-font-sans)'],
        mono: ['var(--td-font-mono)'],
      },
      fontSize: {
        "td-xs": ["12px", "18px"],
        "td-sm": ["14px", "22px"],
        "td-lg": ["16px", "24px"],
        "td-xl": ["20px", "28px"],
        "td-2xl": ["24px", "32px"],
        "td-h1": ["28px", "36px"],
        "td-3xl": ["30px", "38px"],
      },
      letterSpacing: {
        "td-tight": "-0.02em",
        "td-tighter": "-0.04em",
      },
      transitionTimingFunction: {
        "td-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "td-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      // 注意：入场动画统一由 index.css 的 .td-fade-in-* / .td-stagger-* 提供
      // （此处不再重复定义 keyframes，避免两套同类动画并存 — UX-30）
    },
  },
  plugins: [],
};
