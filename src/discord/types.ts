export type DiscordStatus = "online" | "idle" | "dnd" | "offline";

export type ActivityTimestamps = {
  readonly start?: number;
  readonly end?: number;
};

export type ActivityAssets = {
  readonly large_image?: string;
  readonly large_text?: string;
  readonly small_image?: string;
  readonly small_text?: string;
};

export type ActivityEmoji = {
  readonly id?: string | null;
  readonly name: string;
  readonly animated?: boolean;
};

export type Activity = {
  readonly id: string;
  readonly name: string;
  readonly type: number;
  readonly state?: string;
  readonly details?: string;
  readonly application_id?: string;
  readonly timestamps?: ActivityTimestamps;
  readonly assets?: ActivityAssets;
  readonly emoji?: ActivityEmoji;
  readonly created_at?: number;
  readonly sync_id?: string;
};

export type AvatarDecoration = {
  readonly asset: string;
  readonly sku_id: string | null;
};

export type DiscordUser = {
  readonly id: string;
  readonly username: string;
  readonly global_name: string | null;
  readonly avatar: string | null;
  readonly avatar_decoration_data: AvatarDecoration | null;
  readonly primary_guild?: { readonly tag: string | null; readonly identity_guild_id: string | null; readonly badge: string | null } | null;
  readonly collectibles?: { readonly nameplate?: NameplateData | null } | null;
};

export type SpotifyTrack = {
  readonly track_id: string | null;
  readonly timestamps: ActivityTimestamps;
  readonly album: string | null;
  readonly album_art_url: string | null;
  readonly artist: string | null;
  readonly song: string;
};

export type Presence = {
  readonly discord_user: DiscordUser;
  readonly discord_status: DiscordStatus;
  readonly active_on_discord_desktop?: boolean;
  readonly active_on_discord_mobile?: boolean;
  readonly active_on_discord_web?: boolean;
  readonly active_on_discord_embedded?: boolean;
  readonly active_on_discord_vr?: boolean;
  readonly activities: readonly Activity[];
  readonly listening_to_spotify: boolean;
  readonly spotify: SpotifyTrack | null;
};

export type LanyardResponse =
  | { readonly success: true; readonly data: Presence }
  | { readonly success: false; readonly error: { readonly code: string; readonly message: string } };

export type RawBadge = {
  readonly id: string;
  readonly description: string;
  readonly icon: string;
};

export type RawProfile = {
  readonly badges?: readonly RawBadge[];
  readonly premium_type?: number | null;
  readonly user?: { readonly bio?: string | null; readonly accent_color?: number | null; readonly banner_color?: string | null };
  readonly user_profile?: { readonly bio?: string | null; readonly pronouns?: string | null; readonly accent_color?: number | null };
};

export type Badge = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
};

export type Profile = {
  readonly badges: readonly Badge[];
  readonly bio: string;
  readonly pronouns: string;
  readonly accent: number | null;
};

export type NameplatePalette =
  | "crimson"
  | "berry"
  | "sky"
  | "teal"
  | "forest"
  | "bubble_gum"
  | "violet"
  | "cobalt"
  | "clover"
  | "lemon"
  | "white";

export type NameplateData = {
  readonly asset: string;
  readonly palette: NameplatePalette;
  readonly label: string;
};
