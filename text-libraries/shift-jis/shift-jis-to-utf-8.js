import mapping from "./shift-jis-to-utf-8-mapping.json" with { type: "json" };

/** @param {number} char */
const is_single_char = (char) =>
  char < 0x7F || 0xA0 < char && char < 0xE0;

/**
 * @param {DataView} view
 * @param {number} offset
 * @param {number} length
 * @returns {string}
 */
export const shift_jis = (view, offset, length) => {
  let string = "";
  for (let i = 0; i < length; i += 1) {
    let number = view.getUint8(offset + i);
    const single = is_single_char(number);
    if (single) {
      const ch = String.fromCharCode(mapping.to_utf8[number]);
      string += ch;
      continue;
    }
    else {
      number = view.getUint16(offset + i, false);
      const ch = String.fromCharCode(mapping.to_utf8[number]);
      string += ch;
      i += 1;
    }
  }
  return string;
};
