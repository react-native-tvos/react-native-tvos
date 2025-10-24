export type RepoConstants = {
  repoName: string;
  repoPath: string;
  repoUrl: string;
  releaseBranch: string;
  releaseVersion: string;
  rnPackagePath: string;
  vlPackagePath: string;
  isSnapshot: boolean;
  publishToSonatype: boolean;
  pushReleaseToRepo: boolean;
  includeVisionOS: boolean;
  includeTVOS: boolean;
};

export type MavenConstants = {
  namespace: string;
  releaseVersion: string;
};

export type EasConstants = {
  buildDir: string;
  sourceDir: string;
  buildRunner: string;
  buildPlatform: string;
  isBuildLocal: boolean;
  mavenArtifactsPath: string;
  mavenLocalPath: string;
  mavenLocalUrl: string;
};

export type PackageJSON = {
  name: string;
  version: string;
  private?: boolean;
  dependencies: { [key: string]: string | undefined };
  devDependencies?: { [key: string]: string | undefined };
  peerDependencies?: { [key: string]: string | undefined };
  scripts: { [key: string]: string };
};

export type Version = {
  version: string;
  major: string;
  minor: string;
  patch: string;
  prerelease: string | null | undefined;
};

export type BuildType =
  | 'dry-run'
  | 'release'
  | 'nightly'
  | 'prealpha'
  | 'tvrelease';

export type PackagesFilter = {
  includeReactNative: boolean;
  includePrivate?: boolean;
};

export type PackageInfo = {
  // The name of the package
  name: string;

  // The version of the package
  version: string;

  // The absolute path to the package
  path: string;

  // The parsed package.json contents
  packageJson: PackageJSON;
};

export type ProjectInfo = {
  [packageName: string]: PackageInfo;
};

export type SonatypeConfig = {
  sonatypeUsername: string;
  sonatypePassword: string;
}