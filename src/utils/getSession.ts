import { GpwUnlockedKeychain, GpwRepoManifest } from '../types';
import { createInterface } from 'readline';
import { getGitPwPath } from './getGitPwPath';
import { TrPBKDF2 } from './TrPBKDF2';
import { readJSON } from 'fs-extra';

type Session = GpwRepoManifest & {
  unlocked_keychain: GpwUnlockedKeychain;
};

export async function getSession(): Promise<Session> {
  // Get manifest
  const manifest: GpwRepoManifest = await readJSON(
    getGitPwPath('manifest.json'),
  );

  // Prompt user for repo's passwords
  const passwords: string[] = [];
  const cli = createInterface({
    output: process.stdout,
    input: process.stdin,
  });
  for (let i = 0; i < manifest.key_stretchers.length; i++) {
    await new Promise<void>((resolve) => {
      cli.question(`Enter password #${i + 1}:\n`, (password) => {
        passwords.push(password);
        resolve();
      });
    });
  }
  cli.close();

  // Derive key from password
  const passkeys = await Promise.all(
    manifest.key_stretchers.map((stretcher, i) =>
      TrPBKDF2.deriveKey(passwords[i], stretcher.salt, stretcher.iterations),
    ),
  );

  // Create unlocked keychain
  const keychain = JSON.parse(
    JSON.stringify(manifest.locked_keychains[0]),
  ) as GpwUnlockedKeychain;
  for (let i = 0; i < keychain.keys.length; i++) {
    keychain.keys[i].data = passkeys[i];
  }

  return {
    ...manifest,
    unlocked_keychain: keychain,
  };
}