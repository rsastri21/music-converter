import type { Effect } from "effect";
import { Context, Schema } from "effect";
import { SpotifySearchResponse } from "src/providers/spotify/models/api-contract.js";
import type { AVAILABLE_PROVIDERS } from "./search-contract.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProviderSearchResponse = Schema.Union(SpotifySearchResponse);

export interface MusicServiceProviderShape {
  providerId: typeof AVAILABLE_PROVIDERS.Type;
  search: (query: string) => Effect.Effect<typeof ProviderSearchResponse.Type, never>;
}

export class MusicServiceProvider extends Context.Tag("music-converter/domain/provider-shape/MusicServiceProvider")<
  MusicServiceProvider,
  MusicServiceProviderShape
>() {}
