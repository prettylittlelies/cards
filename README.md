# cards

Live presence cards for your README, rendered as self-contained SVG.

```md
![discord](https://discord.bhoppi.ng/cards/discord?jwt=<token>)
```

Build a card at [discord.bhoppi.ng](https://discord.bhoppi.ng) and copy the snippet. You need to be in the [Lanyard](https://discord.gg/lanyard) server.

## how it works

- **presence** comes from [Lanyard](https://github.com/Phineas/lanyard), cached for 10s
- **badges, bio, pronouns, accent** come from [dcdn.dstn.to](https://dcdn.dstn.to), cached for 12h in memory and on disk, served stale for up to 14 days, with 2 concurrent requests max
- **images** are inlined as `data:` URIs so the card renders inside GitHub's camo proxy
- **the config** is a protobuf message (hand-rolled codec, defaults omitted, flags packed into varints), prefixed with a version and kind byte and signed with a truncated HMAC-SHA256. A typical token is about 40 characters.

## options

v1 is a port of the discord member row on [bhoppi.ng](https://bhoppi.ng): avatar with decoration and status cutout, platform icons, profile badges, an activity summary, and nameplate art colour-graded to the accent.

| field | values |
| --- | --- |
| theme | dark · light |
| font | poppins (embedded) · system |
| accent | auto (nameplate colour) or any hex |
| width / scale / radius | 220–640 / 1–4× / 0–21 |
| show | avatar, decoration, status, platforms, badges, activity, custom status, nameplate, surface |
| motion | animated avatar, animated decoration, animated nameplate |

## api

```
POST /x/cards/discord/token     json config → { token, url, bytes, tracked }
GET  /x/cards/discord/defaults  default config
GET  /cards/discord?jwt=…       image/svg+xml
```

## run

```sh
bun install
bun dev                 # hot builder + api
bun run build && bun serve
```

Set `CARDS_SECRET` (≥32 bytes, base64) in production. Without it, a `.cardkey` file is generated, and tokens signed with one key don't verify under another.
