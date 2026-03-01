import { Effect, identity, Layer, pipe } from "effect";
import { MusicServiceProvider, type MusicServiceProviderShape } from "src/domain/provider-shape.js";
import { SpotifyAuthService } from "./spotify-auth.js";
import { HttpClient, HttpClientRequest, HttpClientResponse, UrlParams } from "@effect/platform";
import { SpotifySearchError, SpotifySearchResponse } from "./models/api-contract.js";
import { SPOTIFY_SEARCH_URL } from "./models/models.js";
import { albumToDao, artistToDao, trackToDao } from "./mapper.js";

export const spotifySearchLayer = Layer.effect(
  MusicServiceProvider,
  Effect.gen(function*() {
    const spotifyAuth = yield* SpotifyAuthService;
    const client = yield* HttpClient.HttpClient;

    return identity<MusicServiceProviderShape>({
      providerId: "spotify",
      search: Effect.fn("SpotifySearch.search")(
        function*(query: string) {
          const token = yield* spotifyAuth.retrieve();
          const searchParams = UrlParams.fromInput({
            q: query,
            type: ["track,album,artist"],
            market: "US",
          });
          const req = HttpClientRequest.get(SPOTIFY_SEARCH_URL).pipe(
            HttpClientRequest.setUrlParams(searchParams),
            HttpClientRequest.bearerToken(token),
          );
          const res = yield* client.execute(req);
          const searchResponse = yield* HttpClientResponse.schemaBodyJson(SpotifySearchResponse)(res);
          return {
            tracks: searchResponse.tracks.items.map(trackToDao),
            artists: searchResponse.artists.items.map(artistToDao),
            albums: searchResponse.albums.items.map(albumToDao),
          };
        },
        (effect) =>
          pipe(
            effect,
            Effect.catchTag("ParseError", (e) =>
              Effect.die(new SpotifySearchError({ message: "Failed to parse response.", cause: e })),
            ),
            Effect.catchAll(Effect.die),
          ),
      ),
    });
  }),
);
