/**
 * @typedef {{
 *   gpu: GPU;
 *   adapter: GPUAdapter;
 *   device: GPUDevice;
 *   sdr_format: GPUTextureFormat;
 * }} Hardware
 *
 * @typedef {ReturnType<typeof HardwareScheduler>} HardwareScheduler
 *
 * @typedef {(hardware: Hardware) => void} HardwareAccessCall
 *
 * @typedef {(hardware: Hardware, encoder: GPUCommandEncoder) => void} HardwareEncoderCall
 *
 * @typedef {(hardware: Hardware, encoder: GPUCommandEncoder, pass: GPURenderPassEncoder, descriptor: GPURenderPassDescriptor) => void} HardwareRenderAccessCall
 *
 * @typedef {(hardware: Hardware, encoder: GPUCommandEncoder, pass: GPUComputePassEncoder, descriptor: GPUComputePassDescriptor) => void} HardwareComputeAccessCall
 * 
 * @export {HardwareRenderAccessCall}
 */


/**
 * @param {{
 *   adapter: GPURequestAdapterOptions,
 *   device: GPUDeviceDescriptor,
 * }} options 
 * @return {Promise<Hardware>}
 */
export const HardwareAccess = async (options) => {
  const gpu = navigator.gpu;
  const adapter = await gpu.requestAdapter(options?.adapter);
  const device = await adapter.requestDevice(options?.device);
  const sdr_format = gpu.getPreferredCanvasFormat();

  /** @type {Hardware} */
  const hardware = {
    gpu,
    adapter,
    device,

    sdr_format,
  };

  return hardware;
};


/** @param {Hardware} hardware */
export const HardwareScheduler = (hardware) => {
  /** @type {GPUDevice} */
  const device = hardware.device;

  /** @type {GPUCommandBuffer[]} */
  let commands = [];
  /** @type {GPUCommandEncoder} */
  let encoder = null;


  /** @param {?GPUCommandEncoderDescriptor} descriptor */
  const begin_encoding = (descriptor) => {
    commands.length = 0;
    encoder = device.createCommandEncoder(descriptor ?? {
      label: "[CommandBuffer] HardwareSequencer.Begin",
    });

    return scheduler;
  };


  /** @param {?GPUCommandEncoderDescriptor} descriptor */
  const gate = (descriptor) => {
    commands.push(encoder.finish());
    encoder = device.createCommandEncoder(descriptor ?? {
      label: `[CommandEncoder]: HardwareSequencer.Gate(${commands.length + 1})`,
    });

    return scheduler;
  };


  const wait = () =>
    device.queue.onSubmittedWorkDone();


  const submit = () => {
    commands.push(encoder.finish());
    device.queue.submit(commands);

    encoder = null;
    commands.length = 0;
    return device.queue.onSubmittedWorkDone();
  };


  /** @param {HardwareAccessCall[]} batch */
  const await_hardware = (batch) =>
    Promise.all(batch.map(call => call(hardware)));


  /** @param {HardwareAccessCall[]} batch */
  const access_hardware = (batch) => {
    for (let i = 0; i < batch.length; i += 1)
      batch[i](hardware);

    return scheduler;
  };


  /** @param {HardwareEncoderCall[]} batch */
  const access_encoder = (batch) => {
    for (let i = 0; i < batch.length; i += 1)
      batch[i](hardware, encoder);

    return scheduler;
  };


  /**
   * @param {HardwareRenderAccessCall[]} batch
   * @param {() => GPURenderPassDescriptor} get_descriptor
   */
  const render = (batch, get_descriptor) => {
    const descriptor = get_descriptor();
    const pass = encoder.beginRenderPass(descriptor);
    pass.pushDebugGroup(`[RenderPassEncoder]: ${descriptor.label ?? "HardwareSequencer.Render()"}`);

    for (let i = 0; i < batch.length; i += 1)
      batch[i](hardware, encoder, pass, descriptor);

    pass.popDebugGroup();
    pass.end();
    return scheduler;
  };


  /**
   * @param {HardwareComputeAccessCall[]} batch
   * @param {?() => GPUComputePassDescriptor} descriptor
   */
  const compute = (batch, get_descriptor) => {
    const descriptor = get_descriptor?.();
    const pass = encoder.beginComputePass(descriptor);
    pass.pushDebugGroup(`[ComputePassEncoder]: ${descriptor?.label ?? "HardwareSequencer.Compute()"}`);

    for (let i = 0; i < batch.length; i += 1)
      batch[i](hardware, encoder, pass, descriptor);

    pass.popDebugGroup();
    pass.end();
    return scheduler;
  };


  const scheduler = {
    hardware,
    commands,

    get encoder () { return encoder; },
    set encoder (x) { encoder = x; },

    begin_encoding,
    gate,
    submit,
    wait,

    render,
    compute,

    await_hardware,
    access_hardware,
    access_encoder,
  };

  return scheduler;
};
