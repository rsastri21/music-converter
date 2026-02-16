import { LayerMap } from "effect";
import { spotifySearchLayer } from "./spotify/spotify-search.js";

export class MusicServiceProviderMap extends LayerMap.Service<MusicServiceProviderMap>()("MusicServiceProviderMap", {
  layers: {
    spotify: spotifySearchLayer,
  },
}) {}
