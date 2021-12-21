import {
  EncryptedString,
  TiperiteConfig,
  CredentialID,
  DateString,
  HexString,
  UUID,
} from '.';

export type WorkspaceID = UUID;

/**
 * The workspace object as stored in `/storage.json`
 *
 * @see StorageFileData.workspaces
 */
export interface StorageFileWorkspace {
  credentialId: CredentialID;
  lastViewedAt: DateString;
  /**
   * @example "https://github.com/example/workspace.git"
   */
  repoUrl: string;
  /**
   * The final plaintext passkey for the workspace. This is the output from
   *  `KeyDeriver.deriveKey()` using the user-supplied password and the
   *  requirements from the workspace's manifest.
   */
  passkey: HexString;
  config: TiperiteConfig;
  name: string;
  id: WorkspaceID;
}

/**
 * The `workspaces` Redux state object
 *
 * @see RootState.workspaces
 */
export interface WorkspacesState {
  allIds: WorkspaceID[];
  byId: Record<WorkspaceID, StorageFileWorkspace>;
}

/**
 * A workspace's manifest file version
 */
export type WorkspaceManifestVersion = number;

/**
 * The `manifest.json` file in a workspace's repo
 */
export interface WorkspaceManifestFileData {
  /**
   * Data needed to convert the user's password to a passkey via PBKDF2
   */
  password: {
    /**
     * Iterations to use for PBKDF2 on the user's supplied password
     */
    iterations: number;
    /**
     * Salt to use for PBKDF2 on the user's supplied password
     */
    salt: string;
  };
  version: WorkspaceManifestVersion;
  /**
   * Past and current encryption keys for the workspace, ordered newest to
   *  oldest, and encrypted using the current key.
   *
   * This allows us to decrypt old commits prior to a key change.
   *
   * It also allows us to verify that a provided password correctly generated
   *  the current key by attempting to decrypt one of the keys.
   */
  keys: {
    createdAt: DateString;
    passkey: EncryptedString;
  }[];
}
