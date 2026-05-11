import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { hasError: boolean }

/**
 * 捕获子树渲染期错误，避免整页白屏；API 失败本身不应抛到此处（由 React Query 处理）。
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-fallback" role="alert" style={{ padding: '2rem', maxWidth: 520, margin: '10vh auto', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: 12 }}>页面渲染出现异常</h1>
          <p style={{ color: '#555', lineHeight: 1.6, marginBottom: 20 }}>
            接口异常时商城仍可浏览基础内容。若为脚本错误，请刷新页面或返回首页重试。
          </p>
          <button type="button" className="btn btn--primary" onClick={() => window.location.assign('/')}>
            返回首页
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ marginLeft: 12 }}
            onClick={() => window.location.reload()}
          >
            刷新
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
