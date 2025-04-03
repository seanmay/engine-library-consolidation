/*
  Nota extremely Bene:
    this is not done; it's not handling 4-byte characters properly...
    ...also, I can't request 4-byte characters properly, in fromCharCode, for some reason.
    Need to better understand the spec, there.
 */


// to be used in filter sequence; not on their own

/** @param {number} char */
const is_single = (char) => !(char & 0b10000000);

/** @param {number} char */
const is_double = (char) => !(char & 0b00100000);

/** @param {number} char */
const is_triple = (char) => !(char & 0b00010000);

/** @param {number} char */
const get_byte_length = (char) =>
    is_single(char) ? 1
  : is_double(char) ? 2
  : is_triple(char) ? 3
  : 4;


const UNSUPPORTED = 0xFFFD;

/** @param {number} char */
const is_invalid_tralier = (char) =>
  !(char & 0b10000000) || !!(char & 0b01000000);

/**
 * @param {DataView} view
 * @param {number} offset
 */
const get_1_byte = (view, offset) => {
  const byte_0 = view.getUint8(offset);
  return (byte_0 & 0b01111111) << 6 * 0;
};

/**
 * @param {DataView} view
 * @param {number} offset
 */
export const get_2_bytes = (view, offset) => {
  const byte_0 = view.getUint8(offset + 0);
  const byte_1 = view.getUint8(offset + 1);

  if (is_invalid_tralier(byte_1))
    return UNSUPPORTED;

  return 0
    | (byte_0 & 0b00011111) << 6 * 1
    | (byte_1 & 0b00111111) << 6 * 0
    ;
};

/**
 * @param {DataView} view
 * @param {number} offset
 */
const get_3_bytes = (view, offset) => {
  const byte_0 = view.getUint8(offset + 0);
  const byte_1 = view.getUint8(offset + 1);
  const byte_2 = view.getUint8(offset + 2);

  if (is_invalid_tralier(byte_1) || is_invalid_tralier(byte_2))
    return UNSUPPORTED;

  return 0
    | (byte_0 & 0b00001111) << 6 * 2
    | (byte_1 & 0b00111111) << 6 * 1
    | (byte_2 & 0b00111111) << 6 * 0
    ;
};

/**
 * @param {DataView} view
 * @param {number} offset
 */
const get_4_bytes = (view, offset) => {
  const byte_0 = view.getUint8(offset + 0);
  const byte_1 = view.getUint8(offset + 1);
  const byte_2 = view.getUint8(offset + 2);
  const byte_3 = view.getUint8(offset + 3);

  if (is_invalid_tralier(byte_1) || is_invalid_tralier(byte_2) || is_invalid_tralier(byte_3))
    return UNSUPPORTED;

  return 0
    | (byte_0 & 0b00000111) << 6 * 3
    | (byte_1 & 0b00111111) << 6 * 2
    | (byte_2 & 0b00111111) << 6 * 1
    | (byte_3 & 0b00111111) << 6 * 0
    ;
};


const get_char = {
  1: get_1_byte,
  2: get_2_bytes,
  3: get_3_bytes,
  4: get_4_bytes,
};

/**
 * @param {DataView} view
 * @param {number} offset
 * @param {number} length
 */
export const utf8 = (view, offset, length) => {
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
