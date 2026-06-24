import type { NatijatNashr, NatijatIkhtibar, NatijatAtdaa, RamzManassa } from "@/lib/types";

export abstract class Nashir {
  abstract readonly manassa: RamzManassa;

  abstract nashr(
    matn: string,
    miftah: string,
    wasait?: string[],
  ): Promise<NatijatNashr>;

  abstract ikhtibar(miftah: string): Promise<NatijatIkhtibar>;

  abstract jibAtdaa(maerifNashr: string, miftah: string): Promise<NatijatAtdaa | null>;
}
