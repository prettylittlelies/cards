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

| field | values |
| --- | --- |
| theme | graphite · midnight · paper · mono · tinted |
| layout | stack · compact |
| font | system · geometric · mono · serif |
| accent | auto (profile) or any hex |
| width / radius / padding | 300–640 / 0–40 / 8–40 |
| show | avatar, decoration, status, username, pronouns, badges, bio, custom status, spotify, activities, elapsed, platform, border, glow, dividers |
| motion | progress, equalizer, pulse, animated avatar, animated decoration, fade in |

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
