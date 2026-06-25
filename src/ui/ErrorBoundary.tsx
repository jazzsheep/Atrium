import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

// 3D（World）が失敗しても白画面にしないための安全網。
// 失敗時でも 2D の文字メニュー・パネルで情報サイトとして機能する（実用の経路は生きる）。
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Atrium: 描画に失敗しました（2D表示で継続します）。', error, info);
  }

  render() {
    return this.state.hasError ? this.props.fallback ?? null : this.props.children;
  }
}
