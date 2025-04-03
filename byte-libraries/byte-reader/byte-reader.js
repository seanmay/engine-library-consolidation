const BIG_ENDIAN = false;
const LITTLE_ENDIAN = true;

export const ENDIANNESS = BIG_ENDIAN | LITTLE_ENDIAN;

/**
 * @typedef {true} LITTLE_ENDIAN
 * @typedef {false} BIG_ENDIAN
 * @typedef {LITTLE_ENDIAN | BIG_ENDIAN} ENDIANNESS
 * 
 * @typedef {{ BYTES_PER_ELEMENT: 1 }} Width8
 * @typedef {{ BYTES_PER_ELEMENT: 2 }} Width16
 * @typedef {{ BYTES_PER_ELEMENT: 4 }} Width32
 * @typedef {{ BYTES_PER_ELEMENT: 8 }} Width64
 * 
 * @typedef {{ name: "Uint8Array" } & Width8} U8_Props
 * @typedef {{ name: "Uint16Array" } & Width16} U16_Props
 * @typedef {{ name: "Uint32Array" } & Width32} U32_Props
 * @typedef {{ name: "BigUint64Array"} & Width64} U64_Props
 * 
 * @typedef {{ name: "Int8Array" } & Width8} I8_Props
 * @typedef {{ name: "Int16Array" } & Width16} I16_Props
 * @typedef {{ name: "Int32Array" } & Width32} I32_Props
 * @typedef {{ name: "BigInt64Array" } & Width64} I64_Props
 * 
 * @typedef {{ name: "Float32Array" } & Width32} F32_Props
 * @typedef {{ name: "Float64Array" } & Width64} F64_Props
 * 
 * @typedef {Uint8ArrayConstructor & U8_Props} U8
 * @typedef {Uint16ArrayConstructor & U16_Props} U16
 * @typedef {Uint32ArrayConstructor & U32_Props} U32
 * @typedef {BigUint64ArrayConstructor & U64_Props} U64
 * 
 * @typedef {Int8ArrayConstructor & I8_Props} I8
 * @typedef {Int16ArrayConstructor & I16_Props} I16
 * @typedef {Int32ArrayConstructor & I32_Props} I32
 * @typedef {BigInt64ArrayConstructor & I64_Props} I64
 * 
 * @typedef {Float32ArrayConstructor & F32_Props} F32
 * @typedef {Float64ArrayConstructor & F64_Props} F64
 *
 * @typedef { U8 | I8 | U16 | I16 | U32 | I32 | F32 | U64 | I64 | F64 } TypedArrayConstructor
 */

/**
 * @template T
 * @param {T extends TypedArrayConstructor ? T : never} constructor
 * @param {ENDIANNESS} endianness
 */
export const BinaryReader = (constructor, endianness = LITTLE_ENDIAN) => {
  /** @type {T["name"]} */
  const constructor_name = constructor.name;
  /** @type {T["name"] extends `{infer Name}Array` ? `get${Name}` : never} */
  const method_name = `get${constructor_name.replace("Array", "")}`;
  /** @type {T["BYTES_PER_ELEMENT"]} */
  const BYTES_PER_ELEMENT = constructor.BYTES_PER_ELEMENT;

  /**
   * This will *not* return a single `BigUint64` or a single `Float64`. Kaboom.
   * @param {DataView} view
   * @param {number} offset
   * @returns {InstanceType<T>[number]}
   */
  const scalar = (view, offset) =>
    view[method_name](offset, endianness);

  /**
   * @param {DataView} view
   * @param {number} offset
   * @param {number} count
   * @returns {InstanceType<T>}
   */
  const vector = (view, offset, count) =>
    new constructor(view.buffer, view.byteOffset + offset, count).slice();

  /**
   * Nota Bene: this does *not* play well with Big Endian, currently
   * @param {DataView} view 
   * @param {number} offset 
   * @param {number} count 
   * @returns {InstanceType<T>}
   */
  const view = (view, offset, count) =>
    new constructor(view, view.byteOffset + offset, count); 

  return {
    scalar,
    vector,
    view,
    BYTES_PER_ELEMENT,
  };
};

export const u8 = BinaryReader(/** @type {U8} */(Uint8Array));
export const i8 = BinaryReader(/** @type {I8} */(Int8Array));

export const u16 = BinaryReader(/** @type {U16} */(Uint16Array));
export const i16 = BinaryReader(/** @type {I16} */(Int16Array));

export const u32 = BinaryReader(/** @type {U32} */(Uint32Array));
export const i32 = BinaryReader(/** @type {I32} */(Int32Array));
export const f32 = BinaryReader(/** @type {F32} */(Float32Array));

export const u64 = BinaryReader(/** @type {U64} */BigUint64Array);
export const i64 = BinaryReader(/** @type {I64} */BigInt64Array);
export const f64 = BinaryReader(/** @type {F64} */Float64Array);
