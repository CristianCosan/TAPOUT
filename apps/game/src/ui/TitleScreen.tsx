import { P1, SHOW } from '@tapout/content';

export function TitleScreen(props: { canContinue: boolean; onContinue: () => void; onNewRun: () => void }) {
  return (
    <div className="title-card">
      <div className="micro">The Boreal North</div>
      <h1>
        TAP <span className="slash">/</span> OUT
      </h1>
      <p className="sub">
        {SHOW.name} · ten strangers, one shoreline each · {SHOW.prizeLabel}
      </p>
      <div className="title-buttons">
        {props.canContinue && (
          <button className="big-btn primary" onClick={props.onContinue}>
            Continue
          </button>
        )}
        <button className={`big-btn${props.canContinue ? '' : ' primary'}`} onClick={props.onNewRun}>
          New run
        </button>
      </div>
      <p className="build">
        Grey-box build · the full v12 rules, plain screens · you are {P1.fullName}
      </p>
    </div>
  );
}
