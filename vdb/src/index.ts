/* ═══════════════════════════════════════════════════════════════════
   VDB — قاعدة بيانات فيتو (VITO BYTE DATABASE) — النقطة العامة.
   محرك تخزين من البايتة الأولى: صفحات 4096، شجرة B+ بنسخ-عند-الكتابة،
   التزام ذري بنقطة واحدة، جيران بحصص، زمن بدفتر، وعربية في العُظم.
   ═══════════════════════════════════════════════════════════════════ */
export { VDB, TenantHandle, BucketHandle, type VValue, type CommitInfo } from "./engine";
export { MemoryBlockStore, KVBlockStore, D1BlockStore, type BlockStore, type MinimalD1 } from "./store";
export { WAL_MAGIC, walEncode, walDecode, crc32, type WalRecord } from "./wal";
export { GitHubWALMirror } from "./store-github";
export { cmpBytes, encKey, decKey, decRaw, decNum, encNum, ck, ckLast, ckPrefix } from "./bytes";
export { normAr, arKey } from "./ar";
export { PAGE, MAX_KEY, MAX_VAL } from "./btree";
