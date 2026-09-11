import packageJson from "@/package.json";

// The application version is part of the build (identical in every environment), so it comes
// from package.json rather than from an environment variable.
export const APP_VERSION: string = packageJson.version;
