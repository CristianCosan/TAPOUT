import { Component, type ReactNode } from 'react';
import { CRASH_TEXT } from '@tapout/content';
import { canOpenSaveFolder, logError, openSaveFolder } from '../crash.ts';

/** If a screen throws, log it and show a calm card instead of a blank window. */
export class CrashScreen extends Component<{ children: ReactNode }, { broken: boolean; logged: boolean }> {
  override state = { broken: false, logged: false };

  static getDerivedStateFromError() {
    return { broken: true };
  }

  override componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    const logged = logError('screen', error instanceof Error ? Object.assign(error, { stack: `${error.stack ?? ''}\n${info.componentStack ?? ''}` }) : error);
    this.setState({ logged });
  }

  override render() {
    if (!this.state.broken) return this.props.children;
    return (
      <div className="title-card">
        <h2 className="confirm-title">{CRASH_TEXT.title}</h2>
        <p className="sub">{CRASH_TEXT.body}</p>
        {this.state.logged && <p className="sub">{CRASH_TEXT.logged}</p>}
        <div className="title-buttons">
          {canOpenSaveFolder() && (
            <button className="big-btn" onClick={openSaveFolder}>
              {CRASH_TEXT.folder}
            </button>
          )}
          <button className="big-btn primary" onClick={() => window.location.reload()}>
            {CRASH_TEXT.restart}
          </button>
        </div>
      </div>
    );
  }
}
