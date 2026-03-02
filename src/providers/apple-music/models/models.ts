import { Schema } from "effect";

export const AppleMusicId = Schema.String.pipe(Schema.brand("AppleMusicId"));
export const AppleMusicHref = Schema.String.pipe(Schema.brand("AppleMusicHref"));

export class Artwork extends Schema.Class<Artwork>("Artwork")({
  bgColor: Schema.String,
  height: Schema.Number,
  width: Schema.Number,
  url: Schema.String, // Contains {w} and {h} placeholders to request custom dimensions
  textColor1: Schema.optional(Schema.String),
  textColor2: Schema.optional(Schema.String),
  textColor3: Schema.optional(Schema.String),
  textColor4: Schema.optional(Schema.String),
}) { }

export class Preview extends Schema.Class<Preview>("Preview")({
  artwork: Schema.optional(Artwork),
  url: Schema.String,
  hlsUrl: Schema.optional(Schema.String),
}) { }

class ArtistAttributes extends Schema.Class<ArtistAttributes>("ArtistAttributes")({
  artwork: Schema.optional(Artwork),
  genreNames: Schema.Array(Schema.String),
  name: Schema.String,
  url: Schema.String,
}) { }

export class Artist extends Schema.Class<Artist>("Artist")({
  id: AppleMusicId,
  href: AppleMusicHref,
  type: Schema.Literal("artists"),
  attributes: ArtistAttributes,
}) { }

class AlbumAttributes extends Schema.Class<AlbumAttributes>("AlbumAttributes")({
  artistName: Schema.String,
  artwork: Artwork,
  genreNames: Schema.Array(Schema.String),
  isCompilation: Schema.Boolean,
  isComplete: Schema.Boolean,
  isMasteredForItunes: Schema.Boolean,
  isSingle: Schema.Boolean,
  name: Schema.String,
  trackCount: Schema.Number,
  url: Schema.String,
}) { }

export class Album extends Schema.Class<Album>("Album")({
  id: AppleMusicId,
  href: AppleMusicHref,
  type: Schema.Literal("albums"),
  attributes: AlbumAttributes,
}) { }

class SongAttributes extends Schema.Class<SongAttributes>("SongAttributes")({
  albumName: Schema.String,
  artistName: Schema.String,
  artwork: Artwork,
  durationInMillis: Schema.Number,
  genreNames: Schema.Array(Schema.String),
  name: Schema.String,
  previews: Schema.Array(Preview),
  trackNumber: Schema.optional(Schema.Number),
  url: Schema.String,
}) { }

export class Song extends Schema.Class<Song>("Song")({
  id: AppleMusicId,
  href: AppleMusicHref,
  type: Schema.Literal("songs"),
  attributes: SongAttributes,
}) { }
