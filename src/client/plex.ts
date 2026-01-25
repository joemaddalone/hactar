import type {
  PlexLibraryResponse,
  PlexMovieResponse,
  PlexResponse,
  PlexMovieMetadata,
  PlexSeasonResponse,
  PlexEpisodeResponse,
  Season,
  Episode,
  Show,
  Media,
  LibraryScanResult,
} from "../types";
import ora from "ora";
import { ConfigManager } from "./configure";
import { bytesToHuman } from "../utils/bytes";

export class PlexClient {
  private token: string;
  private serverUrl: string;

  constructor() {
    this.token = "";
    this.serverUrl = "";
    this.init();
  }

  private async init() {
    await this.config();
  }

  private async config() {
    if (!this.token || !this.serverUrl) {
      // attempt to get from environment configManager
      const configManager = new ConfigManager();
      await configManager.loadConfig();
      const credentials = await configManager.getCredentials();
      if (!credentials?.token || !credentials.serverUrl) {
        return;
      }
      this.token = credentials.token;
      this.serverUrl = credentials.serverUrl;
    }
    return {
      serverUrl: this.serverUrl,
      serverToken: this.token,
    };
  }

  /**
   * Make authenticated request to Plex API
   */
  private async request<T>(endpoint: string): Promise<T> {
    const config = await this.config();
    const url = `${config?.serverUrl}${endpoint}`;
    const params = new URLSearchParams({
      "X-Plex-Token": config?.serverToken || "",
    });

    try {
      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return {
          error: `Plex API error: ${response.status} ${response.statusText}`,
        } as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      // console.error("Plex API request failed:", error);
      return { error: `Plex API request failed: ${error}` } as T;
    }
  }

  /**
   * Get all libraries from Plex server
   */
  async getLibraries(): Promise<PlexLibraryResponse[]> {
    const response =
      await this.request<PlexResponse<PlexLibraryResponse>>(
        "/library/sections",
      );
    // filter to only include libraries of type movie or show
    return response.MediaContainer.Directory?.filter(
      (lib) => lib.type === "movie" || lib.type === "show",
    ) || [];
  }

  /**
   * Get all items from a specific library
   */
  async getLibraryItems(
    library: PlexLibraryResponse, showSpinner: boolean = true
  ): Promise<LibraryScanResult> {
    const spinner = showSpinner ? ora("Scanning Plex library...").start() : undefined;
    const response = await this.request<PlexResponse<PlexMovieResponse>>(
      `/library/sections/${library.key}/all`,
    );
    const items = response.MediaContainer.Metadata || [];

    const parentdata: LibraryScanResult = {
      data: [],
      libraryType: library.type,
      libraryName: library.title,
      bytes: 0,
      files: 0,
      humanBytes: "",
    };

    if (library.type === "show") {
      const shows: Show[] = [];
      for (const item of items) {
        const entry: Show = {
          ratingKey: item.ratingKey,
          title: item.title,
          seasons: [] as Season[],
          bytes: 0,
          files: 0,
          humanBytes: "",
        };
        const seasons = await this.getShowSeasons(item.ratingKey);
        for (const season of seasons) {
          const episodes = await this.getSeasonEpisodes(season.ratingKey);
          const s: Season = {
            title: season.title || `${season?.index || 0}`,
            seasonIndex: season?.index || 0,
            ratingKey: season.ratingKey,
            episodes: [] as Episode[],
            bytes: 0,
            files: 0,
            humanBytes: "",
          };
          for (const episode of episodes) {
            const episodeBytes = episode.Media?.[0]?.Part?.[0]?.size || 0;
            s.episodes.push({
              title: episode.title,
              ratingKey: episode.ratingKey,
              episodeIndex: episode?.index || 0,
              bytes: episodeBytes,
              humanBytes: bytesToHuman(episodeBytes),
            });
            s.bytes = (s.bytes || 0) + episodeBytes;
            s.files = (s.files || 0) + 1;
          }
          s.humanBytes = bytesToHuman(s.bytes || 0);
          entry.seasons.push(s);
          entry.bytes = (entry.bytes || 0) + (s.bytes || 0);
          entry.files = (entry.files || 0) + (s.files || 0);
        }
        entry.humanBytes = bytesToHuman(entry.bytes || 0);
        shows.push(entry);
        parentdata.bytes += entry.bytes || 0;
        parentdata.files += entry.files || 0;
      }
      parentdata.data = shows;
    } else {
      const movies: Media[] = items.map((item) => {
        const bytes = item.Media?.[0]?.Part?.[0]?.size || 0;
        return {
          ratingKey: item.ratingKey,
          title: item.title,
          bytes,
          files: 1,
          humanBytes: bytesToHuman(bytes),
        };
      });
      parentdata.data = movies;
      parentdata.bytes = movies.reduce((acc, m) => acc + (m.bytes || 0), 0);
      parentdata.files = movies.length;
    }

    parentdata.humanBytes = bytesToHuman(parentdata.bytes);
    spinner?.stop();
    return parentdata;
  }

  /**
   * Get detailed metadata for a specific movie
   */
  async getLibraryItemDetails(
    ratingKey: string,
  ): Promise<Partial<PlexMovieMetadata>> {
    const config = await this.config();
    const response = await this.request<PlexResponse<PlexMovieResponse>>(
      `/library/metadata/${ratingKey}`,
    );
    const movie = response.MediaContainer.Metadata?.[0];

    if (!movie) {
      throw new Error("Movie not found");
    }

    return {
      ...movie,
      thumbUrl: movie.thumb
        ? `${config?.serverUrl}${movie.thumb}?X-Plex-Token=${config?.serverToken}`
        : "",
      artUrl: movie.art
        ? `${config?.serverUrl}${movie.art}?X-Plex-Token=${config?.serverToken}`
        : "",
    };
  }

  async getShowSeasons(ratingKey: string): Promise<PlexSeasonResponse[]> {
    const response = await this.request<PlexResponse<PlexSeasonResponse>>(
      `/library/metadata/${ratingKey}/children`,
    );
    const items = response?.MediaContainer?.Metadata || [];

    return items.map((season) => ({ ...season }));
  }

  async getSeasonEpisodes(ratingKey: string): Promise<PlexEpisodeResponse[]> {
    const response = await this.request<PlexResponse<PlexEpisodeResponse>>(
      `/library/metadata/${ratingKey}/children`,
    );
    const items = response?.MediaContainer?.Metadata || [];
    return items.map((episode) => ({ ...episode }));
  }

  /**
   * Test connection to Plex server
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request<{
        MediaContainer: { machineIdentifier: string; };
      }>("/");
      return !!response.MediaContainer.machineIdentifier;
    } catch {
      return false;
    }
  }
}
