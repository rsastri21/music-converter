import { AlbumDao, ArtistDao, TrackDao } from "src/domain/search-contract.js";
import type { Album, Artist, Song } from "./models/models.js";

// 64px width and height for thumbnails
const THUMBNAIL_SIZE = 64;

const buildSizedUrl = (urlTemplate: string, height: number, width: number): string => {
  const widthStr = width.toString();
  const heightStr = height.toString();

  return urlTemplate.replace(/{w}/g, widthStr).replace(/{h}/g, heightStr);
};

const extractArtists = (artistName: string) => artistName.split(/\s*(?:,|&)\s*/g).filter((part) => part.length > 0);

export const songToDao = (song: typeof Song.Type): typeof TrackDao.Type =>
  TrackDao.make({
    id: song.id,
    name: song.attributes.name,
    artists: extractArtists(song.attributes.artistName),
    album: song.attributes.albumName,
    thumbnail: buildSizedUrl(song.attributes.artwork.url, THUMBNAIL_SIZE, THUMBNAIL_SIZE),
    art: buildSizedUrl(song.attributes.artwork.url, song.attributes.artwork.height, song.attributes.artwork.width),
    shareUrl: {
      ["appleMusic"]: song.attributes.url,
    },
    type: "track",
  });

export const artistToDao = (artist: typeof Artist.Type): typeof ArtistDao.Type =>
  ArtistDao.make({
    id: artist.id,
    name: artist.attributes.name,
    thumbnail: artist.attributes.artwork
      ? buildSizedUrl(artist.attributes.artwork.url, THUMBNAIL_SIZE, THUMBNAIL_SIZE)
      : "",
    art: artist.attributes.artwork
      ? buildSizedUrl(artist.attributes.artwork.url, artist.attributes.artwork.height, artist.attributes.artwork.width)
      : "",
    shareUrl: {
      ["appleMusic"]: artist.attributes.url,
    },
    type: "artist",
  });

export const albumToDao = (album: typeof Album.Type): typeof AlbumDao.Type =>
  AlbumDao.make({
    id: album.id,
    name: album.attributes.name,
    artist: album.attributes.artistName,
    thumbnail: buildSizedUrl(album.attributes.artwork.url, THUMBNAIL_SIZE, THUMBNAIL_SIZE),
    art: buildSizedUrl(album.attributes.artwork.url, album.attributes.artwork.height, album.attributes.artwork.width),
    shareUrl: {
      ["appleMusic"]: album.attributes.url,
    },
    type: "album",
  });
