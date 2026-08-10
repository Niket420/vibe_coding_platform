import { getWebContainer } from "@/lib/webcontainer";

function withCode(error: unknown, code: string): Error {
  const err = error instanceof Error ? error : new Error(String(error));

  (err as Error & { code?: string }).code = code;

  return err;
}

export const gitFs = {
  promises: {
    async readFile(path: string, options?: any) {
      const wc = await getWebContainer();

      try {
        const encoding =
          typeof options === "string"
            ? options
            : options?.encoding;

        return await wc.fs.readFile(path, encoding);
      } catch (error) {
        throw withCode(error, "ENOENT");
      }
    },

    async writeFile(
        path: string,
        data: string | Uint8Array,
        options?: any
      ) {
        const wc = await getWebContainer();

        const encoding =
          typeof options === "string"
            ? options
            : options?.encoding;

        await wc.fs.writeFile(path, data, encoding);
      },

    async readdir(path: string, options?: any) {
      const wc = await getWebContainer();

      try {
        return await wc.fs.readdir(path);
      } catch (error) {
        throw withCode(error, "ENOENT");
      }
    },

    async mkdir(path: string, mode?: any) {
      const wc = await getWebContainer();

      await wc.fs.mkdir(path, { recursive: true });
    },

    async unlink(path: string) {
      const wc = await getWebContainer();

      try {
        await wc.fs.rm(path);
      } catch (error) {
        throw withCode(error, "ENOENT");
      }
    },

    async rmdir(path: string) {
      const wc = await getWebContainer();

      try {
        await wc.fs.rm(path, { recursive: true });
      } catch (error) {
        throw withCode(error, "ENOENT");
      }
    },

    async stat(path: string) {
      const wc = await getWebContainer();

      try {
        await wc.fs.readdir(path);

        return {
          ctimeMs: Date.now(),
          mtimeMs: Date.now(),
          size: 0,
          mode: 0o40755,
          isFile: () => false,
          isDirectory: () => true,
           isSymbolicLink: () => false,
        };
      } catch {
        try {
          const content = await wc.fs.readFile(path);

          return {
            ctimeMs: Date.now(),
            mtimeMs: Date.now(),
            size: content.byteLength,
            mode: 0o100644,
            isFile: () => true,
            isDirectory: () => false,
            isSymbolicLink: () => false,
          };
        } catch (error) {
          throw withCode(error, "ENOENT");
        }
      }
    },

    async lstat(path: string) {
      return gitFs.promises.stat(path);
    },

    // Required by isomorphic-git.
    // WebContainer does not currently provide native symlink support
    // through this filesystem API.
    async readlink(path: string) {
      throw withCode(
        new Error("Symbolic links are not supported in WebContainer."),
        "ENOSYS"
      );
    },

    async symlink(
      target: string,
      path: string,
      type?: any
    ) {
      throw withCode(
        new Error("Symbolic links are not supported in WebContainer."),
        "ENOSYS"
      );
    },
  },
};