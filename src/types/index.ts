export * from "./plex";

export interface AppConfig {
	version: string;
	configDir: string;
}

export interface UserConfig {
	token: string;
	serverUrl: string;
}

export interface ConfigFile {
	user: UserConfig;
	app: AppConfig;
	lastUpdated: string;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
	version: "1.0.0",
	configDir: "~/.hactar",
};

export const DEFAULT_USER_CONFIG: UserConfig = {
	token: "",
	serverUrl: "",
};

export type Media = {
	ratingKey: string;
	title: string;
	bytes?: number;
	files?: number;
	humanBytes?: string;
};

export type Season = Media & {
	seasonIndex: number;
	episodes: Episode[];
};

export type Episode = Media & {
	episodeIndex: number;
};

export type Show = Media & {
	seasons: Season[];
};

export interface LibraryScanResult {
	data: Show[] | Media[];
	libraryType: string;
	libraryName: string;
	bytes: number;
	files: number;
	humanBytes: string;
}
