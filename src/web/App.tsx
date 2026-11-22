import { CARD_PATH } from "@/cards/discord/path";
import * as styles from "./App.module.css";
import { Editor } from "./Editor";
import { Output } from "./Output";
import { useConfig } from "./state";
import { mintedOf, useToken } from "./useToken";

export const App = () => {
  const [config, dispatch] = useConfig();
  const state = useToken(config);
  const minted = mintedOf(state);

  return (
    <main className={styles.shell}>
      <header className={styles.top}>
        <h1 className={styles.title}>cards</h1>
        <span className={styles.crumb}>/ discord</span>
        <button type="button" className={styles.reset} onClick={() => dispatch({ type: "reset" })}>
          reset
        </button>
      </header>

      <div className={styles.grid}>
        <aside className={styles.panel}>
          <Editor config={config} dispatch={dispatch} />
        </aside>

        <section className={styles.stage} aria-live="polite">
          <div className={styles.canvas} data-pending={state.status === "pending"}>
            {minted ? (
              <img className={styles.card} src={`${CARD_PATH}?jwt=${minted.token}`} alt="card preview" width={config.width} />
            ) : (
              <p className={styles.empty}>{state.status === "error" ? state.message : "enter a discord id to start"}</p>
            )}
          </div>
          {state.status === "error" && minted && <p className={styles.error}>{state.message}</p>}
          {minted && <Output minted={minted} />}
        </section>
      </div>
    </main>
  );
};
