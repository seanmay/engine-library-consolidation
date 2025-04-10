import { ascii } from "@ascii";
import { u16, u32, u8 } from "../byte-reader/byte-reader.ts";

/*
  Nota Bene:
    The goal here isn't to make a feature-complete Zip implementation.
    The goal here isn't even to make an ISO-21320-1 Document Container File manager (though this should mostly work, I think).

  Nota Bene:
    The `data` properties attached to the header are live views back into the buffer of the loaded zip file.
    If you make changes to the bytes in the views, it will mess up the bytes in the backing file.
*/


// /**
//  * @typedef {{
//  *  local: any[],
//  *  central: any[],
//  *  trailer: any
//  * }} ZipInfo
//  */

// TODO: better than this
type ZipInfo = {
  local: ZipInfoLocal[];
  central: ZipInfoDirectory[];
  trailer: ZipInfoTrailer;
};

type ZipInfoLocal = {
  name: string;
  compressed_length: number;
  uncompressed_length: number;
  data_end: number;
  data_offset: number;
  data: Uint8Array;
};


type ZipInfoDirectory = {
  name_length: number;
  extra_length: number;
  comment_length: number;
  data_offset: number;
  name: string;
  comment: string;
};


type ZipInfoTrailer = {
  entry_count: number,
  directory_size: number,
  directory_offset: number,
  comment: string
};


const file_descriptor_signature = 0x04034b50;
const directory_descriptor_signature = 0x02014b50;
const trailer_signature = 0x06054b50;


const is_file = (magic: number) => magic === file_descriptor_signature;
const is_directory = (magic: number) => magic === directory_descriptor_signature;
const is_trailer = (magic: number) => magic === trailer_signature;


export const ZipInfo = (): ZipInfo => ({
  local: [],
  central: [],
  trailer: { entry_count: 0, directory_size: 0, directory_offset: 0, comment: "" }
});


export const read_local_entry = (view: DataView, parse_string = ascii, initial_offset: number): ZipInfoLocal => {
  const offset = initial_offset;

  const compressed_length = u32.scalar(view, offset + 18);
  const uncompressed_length = u32.scalar(view, offset + 22);
  const name_length = u16.scalar(view, offset + 26);
  const extra_length = u16.scalar(view, offset + 28);

  const data_offset = offset + 30 + name_length + extra_length;
  const name = parse_string(view, offset + 30, name_length);
  const data = u8.view(view, data_offset, compressed_length);

  const data_end = data_offset + compressed_length;

  return { name, compressed_length, uncompressed_length, data_end, data_offset, data };
};

export const read_trailer = (view: DataView, parse_string = ascii, initial_offset: number): ZipInfoTrailer => ({
  entry_count: u16.scalar(view, initial_offset + 10),
  directory_size: u32.scalar(view, initial_offset + 12),
  directory_offset: u32.scalar(view, initial_offset + 16),
  comment: parse_string(view, initial_offset + 22, u16.scalar(view, initial_offset + 20)),
});

export const read_directory_entry = (view: DataView, parse_string = ascii, initial_offset: number) => ({
  name_length: u16.scalar(view, initial_offset + 28),
  extra_length: u16.scalar(view, initial_offset + 30),
  comment_length: u16.scalar(view, initial_offset + 32),
  data_offset: u32.scalar(view, initial_offset + 42),

  name: parse_string(view, initial_offset + 46, u16.scalar(view, initial_offset + 28)),
  comment: parse_string(view, initial_offset + 46 + u16.scalar(view, initial_offset + 28) + u16.scalar(view, initial_offset + 30), u16.scalar(view, initial_offset + 32)),
});


export const get_zip_info = (view: DataView, parse_string = ascii, zip_info = ZipInfo()) => {
  let offset = 0;
  while (offset < view.byteLength) {
    const magic = u32.scalar(view, offset);

    if (is_file(magic)) {
      const entry = read_local_entry(view, parse_string, offset);
      zip_info.local.push(entry);
      offset = entry.data_end;
      continue;
    }

    if (is_directory(magic)) {
      const entry = read_directory_entry(view, parse_string, offset);   
      zip_info.central.push(entry);
      offset = offset + 46 + entry.name_length + entry.extra_length + entry.comment_length;
      continue;
    }

    if (is_trailer(magic)) {
      zip_info.trailer = read_trailer(view, parse_string, offset);
      break;
    }
    break;
  }
  return zip_info;
};


export const decompress_zip_file = async (zip_header: ZipInfoLocal, buffer = new Uint8Array(zip_header.uncompressed_length)) => {
  const file_extraction = new DecompressionStream("deflate-raw");
  const writer = file_extraction.writable.getWriter();
  const reader = file_extraction.readable;

  writer.write(zip_header.data);
  writer.close();

  let buffer_offset = 0;
  const chunks = await Array.fromAsync(reader);
  
  for (const chunk of chunks) {
    buffer.set(chunk, buffer_offset);
    buffer_offset += chunk.byteLength;
  }

  return buffer;
};
