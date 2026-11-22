import { createApp } from "../src/server/app";

const { fetch } = await createApp();

export default { fetch };
