import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

/**
 * React Compiler 作用范围（环境变量 REACT_COMPILER_SCOPE，整数字符串）：
 *
 * | 值 | 含义 | 构建 | 运行时 |
 * |---|------|------|--------|
 * | 0 | 关闭 Compiler | 最快、最省 CPU/内存 | 无编译器带来的「少无效渲染」优化 |
 * | 1 | 仅买家端等：`src/` 下排除 `src/admin/` | 中等 | 商城侧源码参与优化（默认） |
 * | 2 | 全站含后台：整个 `src/` | 最慢 | admin + C 端源码都优化 |
 *
 * 未设置时默认 **1**（本地 `npm run build`）。发版脚本会传入 `REACT_COMPILER_SCOPE`（见 voyage `release.sh`）。
 *
 * 兼容旧变量（不推荐）：`FAST_BUILD=1` → 等价于 0；`REACT_COMPILER_ALL_SRC=1` → 等价于 2。
 */
const SRC_TS_RE = /[\\/]src[\\/].*\.[jt]sx?$/
/** 值 1：买家端等，排除 `src/admin/` */
const SRC_NON_ADMIN_TS_RE = /[\\/]src[\\/](?!admin[\\/]).*\.[jt]sx?$/

function resolveReactCompilerScope(): 0 | 1 | 2 {
  const raw = process.env.REACT_COMPILER_SCOPE?.trim()
  if (raw === '0' || raw === '1' || raw === '2') {
    return Number(raw) as 0 | 1 | 2
  }
  if (process.env.FAST_BUILD === '1') {
    return 0
  }
  if (process.env.REACT_COMPILER_ALL_SRC === '1') {
    return 2
  }
  return 1
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const prodBuild = command === 'build' && mode === 'production'
  const scope = resolveReactCompilerScope()
  const useCompiler = scope !== 0
  const compilerInclude = scope === 2 ? SRC_TS_RE : SRC_NON_ADMIN_TS_RE

  return {
    plugins: [
      react(),
      ...(useCompiler
        ? [
            babel({
              include: compilerInclude,
              exclude: /[\\/]node_modules[\\/]/,
              // 生产构建关闭 Babel source map，减轻耗时与内存
              sourceMap: !prodBuild,
              presets: [reactCompilerPreset()],
            }),
          ]
        : []),
    ],
    // 生产构建仅走 Vite（esbuild/rollup），不跑 ESLint、不跑 tsc；校验请单独 npm run lint / npm run typecheck。
    build: {
      reportCompressedSize: false,
    },
  }
})
