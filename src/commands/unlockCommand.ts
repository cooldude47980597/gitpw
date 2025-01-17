import { writeFile, readJSON, ensureDir } from 'fs-extra';
import type { GpwFile, Session } from '../types';
import { getUnlockedFileMap } from '../utils/getUnlockedFileMap';
import { getGpwPath } from '../utils/getGpwPath';
import { GpwCrypto } from '../utils/GpwCrypto';
import { getPath } from '../utils/getPath';
import { dirname } from 'path';
import { utimes } from 'utimes';

/**
 * Decrypt the files in the .gitpw directory and write their plaintext contents
 *  to the current working directory, overwriting any existing files and any
 *  untracked changes that may exist.
 */
export async function unlockCommand(session: Session): Promise<void> {
  // Get encrypted-decrypted file name/path map
  const { unlocked: map } = await getUnlockedFileMap(session.unlocked_keychain);

  // Decrypt contents
  for (const id of Object.keys(map)) {
    // Read encrypted file and decrypt its content
    const file: GpwFile = await readJSON(getGpwPath(`files/${id}.json`));
    const content = await Promise.all(
      file.content.map((c) => GpwCrypto.decrypt(c, session.unlocked_keychain)),
    ).then((c) => c.join(''));

    // Write decrypted file
    const path = getPath(map[id]);
    await ensureDir(dirname(path));
    await writeFile(path, content);
    await utimes(path, {
      btime: new Date(file.created_at).getTime(),
      mtime: new Date(file.updated_at).getTime(),
    });
  }
}
