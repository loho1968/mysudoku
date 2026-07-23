import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { AppShell } from "@/components/Layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "mysudoku — 数独学习与练习",
  description: "个人学习和练习数独",
  manifest: "/sudoku/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1677ff",
};

/**
 * 首屏前内联脚本：在 React hydrate 之前根据视口计算 --cell-size /
 * --cell-font-size 并写到 documentElement。
 * 这样 SSR 首帧与客户端首帧的 CSS 变量一致，避免棋盘/数字键盘/按钮的布局跳变闪烁。
 * 算法必须与 SudokuGrid.tsx 的 calcCellSize 保持一致。
 */
const cellSizeInitScript = `
(function(){
  try {
    var MIN=40, MAX=160, PAGE_PADDING=48;
    var vw=window.innerWidth, vh=window.innerHeight;
    var fixedV=118, fixedH=PAGE_PADDING+24;
    var availH=vh-fixedV;
    var cellSize=Math.floor(availH/9);
    for(var i=0;i<4;i++){
      var panelW=Math.max(320, cellSize*5+32);
      var availW=vw-fixedH-panelW;
      var maxEdge=Math.min(availW, availH);
      cellSize=Math.floor(maxEdge/9);
    }
    cellSize=Math.max(MIN, Math.min(MAX, cellSize));
    document.documentElement.style.setProperty('--cell-size', cellSize+'px');
    document.documentElement.style.setProperty('--cell-font-size', Math.round(cellSize*0.58)+'px');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // suppressHydrationWarning: next-themes 与 cellSize 内联脚本都会在首屏前改写
  // html 的 class 与内联样式，服务端与客户端首帧不一致，需抑制该处的 hydration 警告。
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: cellSizeInitScript }} />
      </head>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
