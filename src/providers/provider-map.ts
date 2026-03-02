import { LayerMap } from "effect";
import { spotifySearchLayer } from "./spotify/spotify-search.js";
import { appleMusicSearchLayer } from "./apple-music/apple-music-search.js";

export class MusicServiceProviderMap extends LayerMap.Service<MusicServiceProviderMap>()("MusicServiceProviderMap", {
  layers: {
    spotify: spotifySearchLayer,
    appleMusic: appleMusicSearchLayer,
  },
}) { }
