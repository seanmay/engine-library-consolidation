import { ascii } from "./text/ascii.js";

/*
  Nota Bene:
    The goal here isn't to make a feature-complete Zip implementation.
    The goal here isn't even to make an ISO-21320-1 Document Container File manager (though this should mostly work, I think).

  Nota Bene:
    The `data` properties attached to the header are live views back into the buffer of the loaded zip file.
    If you make changes to the bytes in the views, it will mess up the bytes in the backing file.
*/


/**
 * @typedef {{
 *  local: any[],
 *  central: any[],
 *  trailer: any
 * }} ZipInfo
 */


const file_descriptor_signature = 0x04034b50;
const directory_descriptor_signature = 0x02014b50;
const trailer_signature = 0x06054b50;


const is_file = (magic) => magic === file_descriptor_signature;
const is_directory = (magic) => magic === directory_descriptor_signature;
const is_trailer = (magic) => magic === trailer_signature;

/**
 * @returns {ZipInfo}
 */
export const ZipInfo = () => ({
  local: [],
  central: [],
  trailer: {}
});

/**
 * @param {ZipInfo} zip_info
 * @param {DataView} view
 * @returns {ZipInfo}
 */
export const get_zip_info = (view, parse_string = ascii, zip_info = ZipInfo()) => {
  let offset = 0;
  while (offset < view.byteLength) {
    const magic = view.getUint32(offset, true);

    if (is_file(magic)) {
      const compressed_length = view.getUint32(offset + 18, true);
      const uncompressed_length = view.getUint32(offset + 22, true);
      const name_length = view.getUint16(offset + 26, true);
      const extra_length = view.getUint16(offset + 28, true);
      const data_offset = offset + 30 + name_length + extra_length;
      const data_end = data_offset + compressed_length;
      const name = parse_string(view, offset + 30, name_length);
      const data = new Uint8Array(view.buffer, data_offset, compressed_length);
      zip_info.local.push({
        name,
        compressed_length,
        uncompressed_length,
        data_end,
        data_offset,
        data
      });
      offset = data_end;
      continue;
    }
    if (is_directory(magic)) {
      const name_length = view.getUint16(offset + 28, true);
      const extra_length = view.getUint16(offset + 30, true);
      const comment_length = view.getUint16(offset + 32, true);
      const data_offset = view.getUint32(offset + 42, true);

      const name = parse_string(view, offset + 46, name_length);
      const comment = parse_string(view, offset + 46 + name_length + extra_length, comment_length);

      zip_info.central.push({ name, comment, data_offset });
      offset = offset + 46 + name_length + extra_length + comment_length;
      continue;
    }
    if (is_trailer(magic)) {
      const entry_count = view.getUint16(offset + 10, true);
      const directory_size = view.getUint32(offset + 12, true);
      const directory_offset = view.getUint32(offset + 16, true);
      const comment_length = view.getUint16(offset + 20, true);
      const comment = parse_string(view, offset + 22, comment_length);

      zip_info.trailer = {
        entry_count,
        directory_size,
        directory_offset,
        comment
      };
      break;
    }
    break;
  }
  return zip_info;
};

export const decompress_zip_file = async (zip_header, buffer = new Uint8Array(zip_header.uncompressed_length)) => {
  const wav_extraction = new DecompressionStream("deflate-raw");
  const writer = wav_extraction.writable.getWriter();
  const reader = wav_extraction.readable;

  writer.write(zip_header.data);
  writer.close();

  let buffer_offset = 0;
  for await (const chunk of reader) {
    buffer.set(chunk, buffer_offset);
    buffer_offset += chunk.byteLength;
  }

  return buffer;
};