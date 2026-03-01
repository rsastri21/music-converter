import type { Effect } from "effect";
import { Context, Schema } from "effect";
import { AlbumDao, ArtistDao, TrackDao, type AVAILABLE_PROVIDERS } from "./search-contract.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProviderSearchResponse = Schema.Struct({
  tracks: Schema.Array(TrackDao),
  artists: Schema.Array(ArtistDao),
  albums: Schema.Array(AlbumDao),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProviderGetResponse = Schema.Union(TrackDao, ArtistDao, AlbumDao);

export interface MusicServiceProviderShape {
  providerId: typeof AVAILABLE_PROVIDERS.Type;
  search: (query: string) => Effect.Effect<typeof ProviderSearchResponse.Type, never>;
  get: (type: string, id: string) => Effect.Effect<typeof ProviderGetResponse.Type, never>;
}

export class MusicServiceProvider extends Context.Tag("music-converter/domain/provider-shape/MusicServiceProvider")<
  MusicServiceProvider,
  MusicServiceProviderShape
>() { }
