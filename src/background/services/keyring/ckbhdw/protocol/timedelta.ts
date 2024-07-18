import EventEmitter from "events";
import { insert } from "../utils/binary";
import { now } from "../utils/util";

class TimeData extends EventEmitter {
  samples: number[] = [];
  known: Map<string, number> = new Map();
  offset = 0;
  checked = false;
  limit: number = 200;

  constructor(limit: number = 200) {
    super();

    this.limit = limit;
  }

  add(id: string, time: number) {
    if (this.samples.length >= this.limit) return;

    if (this.known.has(id)) return;

    const sample = time - now();

    this.known.set(id, sample);

    insert(this.samples, sample, compare);

    this.emit("sample", sample, this.samples.length);

    if (this.samples.length >= 5 && this.samples.length % 2 === 1) {
      let median = this.samples[this.samples.length >>> 1];

      if (Math.abs(median) >= 70 * 60) {
        if (!this.checked) {
          let match = false;

          for (const offset of this.samples) {
            if (offset !== 0 && Math.abs(offset) < 5 * 60) {
              match = true;
              break;
            }
          }

          if (!match) {
            this.checked = true;
            this.emit("mismatch");
          }
        }

        median = 0;
      }

      this.offset = median;
      this.emit("offset", this.offset);
    }
  }

  now(): number {
    return now() + this.offset;
  }

  adjust(time: number): number {
    return time + this.offset;
  }

  local(time: number): number {
    return time - this.offset;
  }

  ms(): number {
    return Date.now() + this.offset * 1000;
  }
}

function compare(a: number, b: number): number {
  return a - b;
}

export default TimeData;
