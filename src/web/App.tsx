import { cardPath, CARD_KINDS } from "@/cards/paths";
import * as styles from "./App.module.css";
import { CATALOG } from "./catalog";
import { Segmented } from "./controls";
import { Editor } from "./Editor";
import { Output } from "./Output";
import { Preview } from "./Preview";
import { useBuilder } from "./state";
import { mintedOf, useToken } from "./useToken";

export const App = () => {
  const [{ kind, configs }, dispatch] = useBuilder();
  const entry = CATALOG[kind];
  const config = configs[kind];
  const state = useToken(kind, entry.identity, config);
  const minted = mintedOf(state);

  return (
    <main className={styles.shell}>
      <header className={styles.top}>
        <h1 className={styles.title}>cards</h1>
        <div className={styles.kinds}>
          <Segmented options={CARD_KINDS} value={kind} onChange={(next) => dispatch({ type: "kind", kind: next })} />
        </div>
        <button type="button" className={styles.reset} onClick={() => dispatch({ type: "reset" })}>
          reset
        </button>
      </header>

      <div className={styles.grid}>
        <aside className={styles.panel}>
          <Editor key={kind} entry={entry} config={config} onChange={(patch) => dispatch({ type: "set", patch })} />
        </aside>

        <section className={styles.stage} aria-live="polite">
          <div className={styles.canvas} data-pending={state.status === "pending"}>
            {minted ? (
              <Preview src={`${cardPath(kind)}?jwt=${minted.token}`} width={Number(config.width)} />
            ) : (
              <p className={styles.empty}>{state.status === "error" ? state.message : `enter a ${entry.identity.label} to start`}</p>
            )}
          </div>
          {state.status === "error" && minted && <p className={styles.error}>{state.message}</p>}
          {minted && <Output minted={minted} />}
        </section>
      </div>
    </main>
  );
};
