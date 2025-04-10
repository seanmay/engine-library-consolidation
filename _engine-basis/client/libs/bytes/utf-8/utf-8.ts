/*
  Nota extremely Bene:
    this is not done; it's not handling 4-byte characters properly...
    ...also, I can't request 4-byte characters properly, in fromCharCode, for some reason.
    Need to better understand the spec, there.
 */


// to be used in filter sequence; not on their own

const BIT_8 = 0b10000000;
const BIT_7 = 0b01000000;
const BIT_6 = 0b00100000;
const BIT_5 = 0b00010000;

const UNSUPPORTED = 0xFFFD;

const ASCII_RANGE = 0b01111111;
const TRAILING_BYTE = 0b00111111;
const LEAD_2 = 0b00011111;
const LEAD_3 = 0b00001111;
const LEAD_4 = 0b00000111;

const is_single = (char: number) => !(char & BIT_8);
const is_double = (char: number) => !(char & BIT_6);
const is_triple = (char: number) => !(char & BIT_5);

const get_byte_length = (char: number) =>
    is_single(char) ? 1
  : is_double(char) ? 2
  : is_triple(char) ? 3
  : 4;

const is_invalid_tralier = (char: number) =>
  !(char & BIT_8) || !!(char & BIT_7);

const get_1_byte = (view: DataView, offset: number) => {
  const byte_0 = view.getUint8(offset);
  return (byte_0 & ASCII_RANGE) << 6 * 0;
};

export const get_2_bytes = (view: DataView, offset: number) => {
  const byte_0 = view.getUint8(offset + 0);
  const byte_1 = view.getUint8(offset + 1);

  if (is_invalid_tralier(byte_1))
    return UNSUPPORTED;

  return 0
    | (byte_0 & LEAD_2) << 6 * 1
    | (byte_1 & TRAILING_BYTE) << 6 * 0
    ;
};

const get_3_bytes = (view: DataView, offset: number) => {
  const byte_0 = view.getUint8(offset + 0);
  const byte_1 = view.getUint8(offset + 1);
  const byte_2 = view.getUint8(offset + 2);

  if (is_invalid_tralier(byte_1) || is_invalid_tralier(byte_2))
    return UNSUPPORTED;

  return 0
    | (byte_0 & LEAD_3) << 6 * 2
    | (byte_1 & TRAILING_BYTE) << 6 * 1
    | (byte_2 & TRAILING_BYTE) << 6 * 0
    ;
};

const get_4_bytes = (view: DataView, offset: number) => {
  const byte_0 = view.getUint8(offset + 0);
  const byte_1 = view.getUint8(offset + 1);
  const byte_2 = view.getUint8(offset + 2);
  const byte_3 = view.getUint8(offset + 3);

  if (is_invalid_tralier(byte_1) || is_invalid_tralier(byte_2) || is_invalid_tralier(byte_3))
    return UNSUPPORTED;

  return 0
    | (byte_0 & LEAD_4) << 6 * 3
    | (byte_1 & TRAILING_BYTE) << 6 * 2
    | (byte_2 & TRAILING_BYTE) << 6 * 1
    | (byte_3 & TRAILING_BYTE) << 6 * 0
    ;
};


const get_char = {
  1: get_1_byte,
  2: get_2_bytes,
  3: get_3_bytes,
  4: get_4_bytes,
};

export const utf8 = (view: DataView, offset: number, length: number) => {
  let string = "";
  for (let i = 0; i < length; i += 1) {
    const byte_0 = view.getUint8(offset + i);
    const length = get_byte_length(byte_0);
    i += length - 1;
    const ch = get_char[length](view, offset);
    string += String.fromCharCode(ch);
  }
  return string;
};
