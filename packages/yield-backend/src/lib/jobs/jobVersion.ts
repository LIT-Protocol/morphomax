import { major } from 'semver';

export type AppData = {
  id: number;
  version: number;
};

export function getJobVersion(appVersion: number): string {
  // For now, all app versions use the same job api/version
  if (appVersion > 0) {
    return '1.0.0';
  }
  return '1.0.0';
}

export function assertPermittedVersion(appVersion: number, userPermittedVersion: number): number {
  const appJobVersion = getJobVersion(appVersion);
  const userPermittedJobVersion = getJobVersion(userPermittedVersion);

  if (major(appJobVersion) !== major(userPermittedJobVersion)) {
    throw new Error(
      `Incompatible job version: ${appVersion} (${appJobVersion}) vs ${userPermittedVersion} (${userPermittedJobVersion})`
    );
  }

  return userPermittedVersion;
}
