import { useEffect, useState } from "react";
import * as styles from "./App.module.css";

type Props = {
  readonly src: string;
  readonly width: number;
};

type Shown = {
  readonly src: string | null;
  readonly loading: boolean;
  readonly failed: boolean;
};

export const Preview = ({ src, width }: Props) => {
  const [shown, setShown] = useState<Shown>({ src: null, loading: true, failed: false });

  useEffect(() => {
    let live = true;
    const next = new Image();
    setShown((current) => ({ ...current, loading: true, failed: false }));
    next.onload = () => live && setShown({ src, loading: false, failed: false });
    next.onerror = () => live && setShown((current) => ({ ...current, loading: false, failed: true }));
    next.src = src;
    return () => {
      live = false;
      next.onload = null;
      next.onerror = null;
    };
  }, [src]);

  return (
    <div className={styles.preview} data-loading={shown.loading}>
      {shown.src && <img className={styles.card} src={shown.src} alt="card preview" width={width} />}
      {!shown.src && !shown.failed && <p className={styles.empty}>loading card…</p>}
      {shown.failed && <p className={styles.error}>card failed to load</p>}
    </div>
  );
};
