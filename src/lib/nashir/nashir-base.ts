import type { NatijatNashr, NatijatIkhtibar, RamzManassa } from "@/lib/types";

export abstract class Nashir {
  abstract readonly manassa: RamzManassa;

  abstract nashr(
    matn: string,
    miftah: string,
    wasait?: string[],
  ): Promise<NatijatNashr>;

  abstract ikhtibar(miftah: string): Promise<NatijatIkhtibar>;
}
