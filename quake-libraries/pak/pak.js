import { ascii } from "../text/ascii.js";

/**
 * @typedef {{
 *   name: string;
 *   start: number;
 *   size: number;
 *   data: DataView;
 * }} PakEntry
 */

/** @param {DataView} view */
export const get_pak_directory = (view) => {
  /** @type {PakEntry[]} */
  let entries = [];

  const magic = ascii(view, 0, 4);
  if (magic !== "PACK") return entries;
  const offset = view.getUint32(4, true);
  const directory_size = view.getUint32(8, true);
  const entry_size = 64;
  const entry_count = directory_size / entry_size;

  for (let i = 0; i < entry_count; i += 1) {
    const point = offset + i * entry_size;
    const name = ascii(view, point, 56);
    const start = view.getUint32(point + 56, true);
    const size = view.getUint32(point + 60, true);
    const data = new DataView(view.buffer, start, size);
    const entry = { name, start, size, data };

    entries.push(entry);
  }

  return entries;
};
