
export const ascii = (view: DataView, offset: number, length: number) => {
  let string = "";
  for (let i = 0; i < length; i += 1) {
    const ch = view.getUint8(offset + i);
    if (!ch) break;
    string += String.fromCharCode(ch);
  }
  return string;
};
