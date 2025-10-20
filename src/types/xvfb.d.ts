declare module "xvfb" {
  type XvfbOptions = {
    silent?: boolean;
    xvfb_args?: string[];
  };
  class Xvfb {
    constructor(options?: XvfbOptions);
    startSync(): void;
    stopSync(): void;
  }
  export default Xvfb;
}
