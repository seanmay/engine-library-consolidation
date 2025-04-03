/**
 * @template T
 * @param {(res: Response) => Promise<T>} transform
 * @returns {(...args: Parameters<typeof fetch>) => Promise<T>}
 */
export const load = (transform) => (...args) => fetch(...args).then(transform);

export const load_bytes = load(res => res.bytes());
export const load_text = load(res => res.text());
export const load_buffer = load(res => res.arrayBuffer());
export const load_json = load(res => res.json());
export const load_blob = load(res => res.blob());
export const load_bitmap = load(res => res.blob().then(createImageBitmap));

