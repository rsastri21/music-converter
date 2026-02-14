import { Schema } from "effect";
import { Album, Artist, SpotifyHref, Track } from "./models.js";

export class BaseResponse extends Schema.Class<BaseResponse>("BaseResponse")({
  href: SpotifyHref,
  limit: Schema.Number,
  next: Schema.optionalWith(SpotifyHref, { nullable: true }),
  offset: Schema.Number,
  previous: Schema.optionalWith(SpotifyHref, { nullable: true }),
  total: Schema.Number,
}) {}

export class TrackResponse extends BaseResponse.extend<TrackResponse>(
  "TrackResponse",
)({
  items: Schema.Array(Track),
}) {}

export class ArtistResponse extends BaseResponse.extend<ArtistResponse>(
  "ArtistResponse",
)({
  items: Schema.Array(Artist),
}) {}

export class AlbumResponse extends BaseResponse.extend<AlbumResponse>(
  "AlbumResponse",
)({
  items: Schema.Array(Album),
}) {}

/**
 * The Spotify search response model.
 * The API returns more keys here, but this class models
 * the supported search functionality only.
 *
 * See: https://developer.spotify.com/documentation/web-api/reference/search
 */
export class SpotifySearchResponse extends Schema.Class<SpotifySearchResponse>(
  "SpotifySearchResponse",
)({
  tracks: TrackResponse,
  artists: ArtistResponse,
  albums: AlbumResponse,
}) {}
