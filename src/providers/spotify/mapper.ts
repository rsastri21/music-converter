import { Array, Order, pipe } from "effect";
import type { Artist, Image, Track, Album } from "./models/models.js";
import { AlbumDao, ArtistDao, TrackDao } from "src/domain/search-contract.js";

const sortImages = (images: Readonly<Array<typeof Image.Type>>) =>
  pipe(images, Array.sortBy(Order.mapInput(Order.number, (image) => image.width)));

export const trackToDao = (track: typeof Track.Type): typeof TrackDao.Type => {
  const sortedImages = sortImages(track.album.images);
  return TrackDao.make({
    id: track.id as string,
    name: track.name,
    artists: track.artists.map((artist) => artist.name),
    album: track.album.name,
    thumbnail: sortedImages[0].url, // lowest resolution
    art: sortedImages[sortedImages.length - 1].url, // highest resolution
    shareUrls: [track.externalUrls.spotify],
    type: track.type,
  });
};

export const artistToDao = (artist: Artist): ArtistDao => {
  const sortedImages = sortImages(artist.images);
  return ArtistDao.make({
    id: artist.id as string,
    name: artist.name,
    thumbnail: sortedImages[0]?.url ?? "",
    art: sortedImages[sortedImages.length - 1]?.url ?? "",
    shareUrls: [artist.externalUrls.spotify],
    type: artist.type,
  });
};

export const albumToDao = (album: Album): AlbumDao => {
  const sortedImages = sortImages(album.images);
  return AlbumDao.make({
    id: album.id as string,
    name: album.name,
    artist: album.artists.map((artist) => artist.name).join(", "),
    thumbnail: sortedImages[0].url,
    art: sortedImages[sortedImages.length - 1].url,
    shareUrls: [album.externalUrls.spotify],
    type: album.type,
  });
};
