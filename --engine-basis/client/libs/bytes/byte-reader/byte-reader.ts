const BIG_ENDIAN = false;
const LITTLE_ENDIAN = true;

export const ENDIANNESS = BIG_ENDIAN || LITTLE_ENDIAN;


type LITTLE_ENDIAN = true; 
type BIG_ENDIAN = false;
type ENDIANNESS = LITTLE_ENDIAN | BIG_ENDIAN;

type Constructor = {
   U8: [    Uint8ArrayConstructor,     "Uint8Array", 1];
  U16: [   Uint16ArrayConstructor,    "Uint16Array", 2];
  U32: [   Uint32ArrayConstructor,    "Uint32Array", 4];
  U64: [BigUint64ArrayConstructor, "BigUint64Array", 8];
   I8: [     Int8ArrayConstructor,      "Int8Array", 1];
  I16: [    Int16ArrayConstructor,     "Int16Array", 2];
  I32: [    Int32ArrayConstructor,     "Int32Array", 4];
  I64: [ BigInt64ArrayConstructor,  "BigInt64Array", 8];
  F32: [  Float32ArrayConstructor,   "Float32Array", 4];
  F64: [  Float64ArrayConstructor,   "Float64Array", 8];
};

interface TypedArrayConstructor<Type extends Constructor[keyof Constructor]> {
  new(buffer: ArrayBufferLike, offset?: number, count?: number): InstanceType<Type[0]> & { BYTES_PER_ELEMENT: Type[2]; };
  name: Type[1];
  BYTES_PER_ELEMENT: Type[2]; 
}

type TypedArrays = {
  [key in keyof Constructor]: TypedArrayConstructor<Constructor[key]>
};

export type  U8 = TypedArrays["U8"];
export type  I8 = TypedArrays["I8"];

export type U16 = TypedArrays["U16"];
export type I16 = TypedArrays["I16"];

export type U32 = TypedArrays["U32"];
export type I32 = TypedArrays["I32"];
export type F32 = TypedArrays["F32"];

export type U64 = TypedArrays["U64"];
export type I64 = TypedArrays["I64"];
export type F64 = TypedArrays["F64"];


export type TypedArray = TypedArrays[keyof TypedArrays];

export type Includes<T extends string, S extends string> = T extends `${infer Start}${S}${infer End}` ? T : never;
export type Remove<T extends string, S extends string> = T extends `${infer Start}${S}${infer End}` ? `${Start}${End}` : T;

type NumberSize<T extends TypedArray> = T["BYTES_PER_ELEMENT"] extends 8 ? T["name"] extends `Big${infer Rest}` ? bigint : number : number;
type ArrayOf<T extends TypedArray> = InstanceType<T> & { BYTES_PER_ELEMENT: T["BYTES_PER_ELEMENT"] };

type Reader<T extends TypedArray> = {
  scalar: <View extends DataView>(view: View, offset: number) => NumberSize<T>;
  vector: <View extends DataView>(view: View, offset: number, count: number) => InstanceType<T>;
  view: <View extends DataView>(view: View, offset: number, count: number) => InstanceType<T>;
  BYTES_PER_ELEMENT: T["BYTES_PER_ELEMENT"];
};



export const BinaryReader = <T extends TypedArray>(Constructor: T, endianness = LITTLE_ENDIAN) => {
  const constructor_name = Constructor.name;
  const method_name = `get${constructor_name.replace("Array", "") as Remove<T["name"], "Array">}` as const;
  const BYTES_PER_ELEMENT: T["BYTES_PER_ELEMENT"] = Constructor.BYTES_PER_ELEMENT;

  const scalar: Reader<T>["scalar"] = (view, offset) =>
    view[method_name](offset, endianness) as NumberSize<T>;

  const vector: Reader<T>["vector"] = (view, offset, count) =>
    new Constructor(view.buffer).slice(view.byteOffset + offset, count) as ArrayOf<T>;

  const view: Reader<T>["view"] = (view, offset, count) =>
    new Constructor(view.buffer as ArrayBuffer, offset, count) as ArrayOf<T>; 

  const reader: Reader<T> = { scalar, vector, view, BYTES_PER_ELEMENT };
  return reader;
};

export const u8 = BinaryReader(Uint8Array as U8);
export const i8 = BinaryReader(Int8Array as I8);

export const u16 = BinaryReader(Uint16Array as U16);
export const i16 = BinaryReader(Int16Array as I16);

export const u32 = BinaryReader(Uint32Array as U32);
export const i32 = BinaryReader(Int32Array as I32);
export const f32 = BinaryReader(Float32Array as F32);

export const u64 = BinaryReader(BigUint64Array as U64);
export const i64 = BinaryReader(BigInt64Array as I64);
export const f64 = BinaryReader(Float64Array as F64);
