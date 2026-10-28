/**
 * Pure TypeScript QR Code Generator (based on davidshimjs/qrcodejs & Kazuhiko Arase's QRCode)
 * Zero external dependencies, SSR-safe, supports UTF-8, Error Correction L/M/Q/H,
 * auto type-number detection (1..40), Canvas rendering, SVG rendering, and PNG DataURL export.
 */

export type QRErrorCorrectLevelKey = 'L' | 'M' | 'Q' | 'H';

export const QRErrorCorrectLevel: Record<QRErrorCorrectLevelKey, number> = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

const QRMode = {
  MODE_NUMBER: 1 << 0,
  MODE_ALPHA_NUM: 1 << 1,
  MODE_8BIT_BYTE: 1 << 2,
  MODE_KANJI: 1 << 3,
};

const QRMaskPattern = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7,
};

const QRMath = (() => {
  const EXP_TABLE = new Array<number>(256);
  const LOG_TABLE = new Array<number>(256);

  for (let i = 0; i < 8; i++) {
    EXP_TABLE[i] = 1 << i;
  }
  for (let i = 8; i < 256; i++) {
    EXP_TABLE[i] =
      EXP_TABLE[i - 4] ^
      EXP_TABLE[i - 5] ^
      EXP_TABLE[i - 6] ^
      EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i++) {
    LOG_TABLE[EXP_TABLE[i]] = i;
  }

  return {
    glog(n: number): number {
      if (n < 1) throw new Error(`glog(${n})`);
      return LOG_TABLE[n];
    },
    gexp(n: number): number {
      let val = n;
      while (val < 0) val += 255;
      while (val >= 256) val -= 255;
      return EXP_TABLE[val];
    },
  };
})();

class QRPolynomial {
  private num: number[];

  constructor(num: number[], shift: number) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) {
      offset++;
    }
    this.num = new Array<number>(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset];
    }
    for (let i = num.length - offset; i < this.num.length; i++) {
      this.num[i] = 0;
    }
  }

  get(index: number): number {
    return this.num[index];
  }

  getLength(): number {
    return this.num.length;
  }

  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array<number>(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(
          QRMath.glog(this.get(i)) + QRMath.glog(e.get(j))
        );
      }
    }
    return new QRPolynomial(num, 0);
  }

  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) {
      return this;
    }
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array<number>(this.getLength());
    for (let i = 0; i < this.getLength(); i++) {
      num[i] = this.get(i);
    }
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num, 0).mod(e);
  }
}

class QRRSBlock {
  totalCount: number;
  dataCount: number;

  constructor(totalCount: number, dataCount: number) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }

  private static RS_BLOCK_TABLE: number[][] = [
    // L, M, Q, H for Type 1..16
    [1, 26, 19],
    [1, 26, 16],
    [1, 26, 13],
    [1, 26, 9],
    [1, 44, 34],
    [1, 44, 28],
    [1, 44, 22],
    [1, 44, 16],
    [1, 70, 55],
    [1, 70, 44],
    [2, 35, 17],
    [2, 35, 13],
    [1, 100, 80],
    [2, 50, 32],
    [2, 50, 24],
    [4, 25, 9],
    [1, 134, 108],
    [2, 67, 43],
    [2, 33, 15, 2, 34, 16],
    [2, 33, 11, 2, 34, 12],
    [2, 86, 68],
    [4, 43, 27],
    [4, 43, 19],
    [4, 43, 15],
    [2, 98, 78],
    [4, 49, 31],
    [2, 32, 14, 4, 33, 15],
    [4, 39, 13, 1, 40, 14],
    [2, 121, 97],
    [2, 60, 38, 2, 61, 39],
    [4, 40, 18, 2, 41, 19],
    [4, 40, 14, 2, 41, 15],
    [2, 146, 116],
    [3, 58, 36, 2, 59, 37],
    [4, 36, 16, 4, 37, 17],
    [4, 36, 12, 4, 37, 13],
    [2, 86, 68, 2, 87, 69],
    [4, 69, 43, 1, 70, 44],
    [6, 43, 19, 2, 44, 20],
    [6, 43, 15, 2, 44, 16],
    [4, 101, 81],
    [1, 80, 50, 4, 81, 51],
    [4, 50, 22, 4, 51, 23],
    [3, 36, 12, 8, 37, 13],
    [2, 116, 92, 2, 117, 93],
    [6, 58, 36, 2, 59, 37],
    [4, 46, 20, 6, 47, 21],
    [7, 42, 14, 4, 43, 15],
    [4, 133, 107],
    [8, 59, 37, 1, 60, 38],
    [8, 44, 20, 4, 45, 21],
    [12, 33, 11, 4, 34, 12],
    [3, 145, 115, 1, 146, 116],
    [4, 64, 40, 5, 65, 41],
    [11, 36, 16, 5, 37, 17],
    [11, 36, 12, 5, 37, 13],
    [5, 109, 87, 1, 110, 88],
    [5, 65, 41, 5, 66, 42],
    [5, 54, 24, 7, 55, 25],
    [11, 36, 12, 7, 37, 13],
    [5, 122, 98, 1, 123, 99],
    [7, 73, 45, 3, 74, 46],
    [15, 43, 19, 2, 44, 20],
    [3, 45, 15, 13, 46, 16],
  ];

  static getRSBlocks(typeNumber: number, errorCorrectLevel: number): QRRSBlock[] {
    const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (!rsBlock) {
      throw new Error(
        `bad rs block @ typeNumber:${typeNumber}/errorCorrectLevel:${errorCorrectLevel}`
      );
    }
    const length = rsBlock.length / 3;
    const list: QRRSBlock[] = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) {
        list.push(new QRRSBlock(totalCount, dataCount));
      }
    }
    return list;
  }

  private static getRsBlockTable(
    typeNumber: number,
    errorCorrectLevel: number
  ): number[] | undefined {
    switch (errorCorrectLevel) {
      case QRErrorCorrectLevel.L:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectLevel.M:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectLevel.Q:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectLevel.H:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default:
        return undefined;
    }
  }
}

class QRBitBuffer {
  buffer: number[] = [];
  length = 0;

  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }

  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  getLengthInBits(): number {
    return this.length;
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
    }
    this.length++;
  }
}

class QR8bitByte {
  mode = QRMode.MODE_8BIT_BYTE;
  private parsedData: number[];

  constructor(data: string) {
    this.parsedData = [];
    // UTF-8 byte encoding (same as davidshimjs/qrcodejs)
    const utf8 = new TextEncoder().encode(data);
    for (let i = 0; i < utf8.length; i++) {
      this.parsedData.push(utf8[i]);
    }
  }

  getLength(): number {
    return this.parsedData.length;
  }

  write(buffer: QRBitBuffer): void {
    for (let i = 0; i < this.parsedData.length; i++) {
      buffer.put(this.parsedData[i], 8);
    }
  }
}

const QRUtil = (() => {
  const PATTERN_POSITION_TABLE: number[][] = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
  ];

  const G15 =
    (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
  const G18 =
    (1 << 12) |
    (1 << 11) |
    (1 << 10) |
    (1 << 9) |
    (1 << 8) |
    (1 << 5) |
    (1 << 2) |
    (1 << 0);
  const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

  const getBCHDigit = (data: number): number => {
    let digit = 0;
    let d = data;
    while (d !== 0) {
      digit++;
      d >>>= 1;
    }
    return digit;
  };

  return {
    getBCHTypeInfo(data: number): number {
      let d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= G15 << (getBCHDigit(d) - getBCHDigit(G15));
      }
      return ((data << 10) | d) ^ G15_MASK;
    },
    getBCHTypeNumber(data: number): number {
      let d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= G18 << (getBCHDigit(d) - getBCHDigit(G18));
      }
      return (data << 12) | d;
    },
    getPatternPosition(typeNumber: number): number[] {
      return PATTERN_POSITION_TABLE[typeNumber - 1] || [];
    },
    getMask(maskPattern: number, i: number, j: number): boolean {
      switch (maskPattern) {
        case QRMaskPattern.PATTERN000:
          return (i + j) % 2 === 0;
        case QRMaskPattern.PATTERN001:
          return i % 2 === 0;
        case QRMaskPattern.PATTERN010:
          return j % 3 === 0;
        case QRMaskPattern.PATTERN011:
          return (i + j) % 3 === 0;
        case QRMaskPattern.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case QRMaskPattern.PATTERN101:
          return ((i * j) % 2) + ((i * j) % 3) === 0;
        case QRMaskPattern.PATTERN110:
          return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
        case QRMaskPattern.PATTERN111:
          return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
        default:
          throw new Error(`bad maskPattern:${maskPattern}`);
      }
    },
    getErrorCorrectPolynomial(errorCorrectLength: number): QRPolynomial {
      let a = new QRPolynomial([1], 0);
      for (let i = 0; i < errorCorrectLength; i++) {
        a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      }
      return a;
    },
    getLengthInBits(mode: number, type: number): number {
      if (1 <= type && type < 10) {
        switch (mode) {
          case QRMode.MODE_NUMBER:
            return 10;
          case QRMode.MODE_ALPHA_NUM:
            return 9;
          case QRMode.MODE_8BIT_BYTE:
            return 8;
          case QRMode.MODE_KANJI:
            return 8;
        }
      } else if (type < 27) {
        switch (mode) {
          case QRMode.MODE_NUMBER:
            return 12;
          case QRMode.MODE_ALPHA_NUM:
            return 11;
          case QRMode.MODE_8BIT_BYTE:
            return 16;
          case QRMode.MODE_KANJI:
            return 10;
        }
      }
      return 16;
    },
    getLostPoint(qrCode: QRCodeModel): number {
      const moduleCount = qrCode.getModuleCount();
      let lostPoint = 0;

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          let sameCount = 0;
          const dark = qrCode.isDark(row, col);
          for (let r = -1; r <= 1; r++) {
            if (row + r < 0 || moduleCount <= row + r) continue;
            for (let c = -1; c <= 1; c++) {
              if (col + c < 0 || moduleCount <= col + c) continue;
              if (r === 0 && c === 0) continue;
              if (dark === qrCode.isDark(row + r, col + c)) {
                sameCount++;
              }
            }
          }
          if (sameCount > 5) {
            lostPoint += 3 + sameCount - 5;
          }
        }
      }

      for (let row = 0; row < moduleCount - 1; row++) {
        for (let col = 0; col < moduleCount - 1; col++) {
          let count = 0;
          if (qrCode.isDark(row, col)) count++;
          if (qrCode.isDark(row + 1, col)) count++;
          if (qrCode.isDark(row, col + 1)) count++;
          if (qrCode.isDark(row + 1, col + 1)) count++;
          if (count === 0 || count === 4) {
            lostPoint += 3;
          }
        }
      }

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount - 6; col++) {
          if (
            qrCode.isDark(row, col) &&
            !qrCode.isDark(row, col + 1) &&
            qrCode.isDark(row, col + 2) &&
            qrCode.isDark(row, col + 3) &&
            qrCode.isDark(row, col + 4) &&
            !qrCode.isDark(row, col + 5) &&
            qrCode.isDark(row, col + 6)
          ) {
            lostPoint += 40;
          }
        }
      }

      for (let col = 0; col < moduleCount; col++) {
        for (let row = 0; row < moduleCount - 6; row++) {
          if (
            qrCode.isDark(row, col) &&
            !qrCode.isDark(row + 1, col) &&
            qrCode.isDark(row + 2, col) &&
            qrCode.isDark(row + 3, col) &&
            qrCode.isDark(row + 4, col) &&
            !qrCode.isDark(row + 5, col) &&
            qrCode.isDark(row + 6, col)
          ) {
            lostPoint += 40;
          }
        }
      }

      let darkCount = 0;
      for (let col = 0; col < moduleCount; col++) {
        for (let row = 0; row < moduleCount; row++) {
          if (qrCode.isDark(row, col)) {
            darkCount++;
          }
        }
      }

      const ratio =
        Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;
      return lostPoint;
    },
  };
})();

export class QRCodeModel {
  typeNumber: number;
  errorCorrectLevel: number;
  modules: Array<Array<boolean | null>> = [];
  moduleCount = 0;
  dataCache: number[] | null = null;
  dataList: QR8bitByte[] = [];

  constructor(typeNumber: number, errorCorrectLevel: number) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
  }

  addData(data: string): void {
    const newData = new QR8bitByte(data);
    this.dataList.push(newData);
    this.dataCache = null;
  }

  isDark(row: number, col: number): boolean {
    if (
      row < 0 ||
      this.moduleCount <= row ||
      col < 0 ||
      this.moduleCount <= col
    ) {
      throw new Error(`${row},${col}`);
    }
    return Boolean(this.modules[row][col]);
  }

  getModuleCount(): number {
    return this.moduleCount;
  }

  make(): void {
    this.makeImpl(false, this.getBestMaskPattern());
  }

  private makeImpl(test: boolean, maskPattern: number): void {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array<boolean | null>(this.moduleCount).fill(null);
    }

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);

    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }

    if (this.dataCache === null) {
      this.dataCache = QRCodeModel.createData(
        this.typeNumber,
        this.errorCorrectLevel,
        this.dataList
      );
    }

    this.mapData(this.dataCache, maskPattern);
  }

  private setupPositionProbePattern(row: number, col: number): void {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  private getBestMaskPattern(): number {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint(this);
      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  private setupTimingPattern(): void {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = r % 2 === 0;
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = c % 2 === 0;
    }
  }

  private setupPositionAdjustPattern(): void {
    const pos = QRUtil.getPatternPosition(this.typeNumber);
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (
              r === -2 ||
              r === 2 ||
              c === -2 ||
              c === 2 ||
              (r === 0 && c === 0)
            ) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  private setupTypeNumber(test: boolean): void {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this.modules[Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3] = mod;
    }
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this.modules[(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  private setupTypeInfo(test: boolean, maskPattern: number): void {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);

    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) {
        this.modules[i][8] = mod;
      } else if (i < 8) {
        this.modules[i + 1][8] = mod;
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod;
      }
    }

    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1] = mod;
      } else {
        this.modules[8][15 - i - 1] = mod;
      }
    }

    this.modules[this.moduleCount - 8][8] = !test;
  }

  private mapData(data: number[], maskPattern: number): void {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            const mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) {
              dark = !dark;
            }
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  private static createData(
    typeNumber: number,
    errorCorrectLevel: number,
    dataList: QR8bitByte[]
  ): number[] {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(
        data.getLength(),
        QRUtil.getLengthInBits(data.mode, typeNumber)
      );
      data.write(buffer);
    }

    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }

    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error(
        `code length overflow. (${buffer.getLengthInBits()}>${
          totalDataCount * 8
        })`
      );
    }

    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }

    while (buffer.getLengthInBits() % 8 !== 0) {
      buffer.putBit(false);
    }

    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0xec, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }

    return QRCodeModel.createBytes(buffer, rsBlocks);
  }

  private static createBytes(
    buffer: QRBitBuffer,
    rsBlocks: QRRSBlock[]
  ): number[] {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;

    const dcdata: number[][] = new Array(rsBlocks.length);
    const ecdata: number[][] = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;

      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      dcdata[r] = new Array<number>(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;

      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);

      ecdata[r] = new Array<number>(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
    }

    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalCodeCount += rsBlocks[i].totalCount;
    }

    const data = new Array<number>(totalCodeCount);
    let index = 0;

    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) {
          data[index++] = dcdata[r][i];
        }
      }
    }

    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) {
          data[index++] = ecdata[r][i];
        }
      }
    }

    return data;
  }
}

export function createQRCodeMatrix(
  text: string,
  levelKey: QRErrorCorrectLevelKey = 'M'
): boolean[][] {
  const cleanText = text || 'https://meplanner.vercel.app';
  const level = QRErrorCorrectLevel[levelKey] ?? QRErrorCorrectLevel.M;

  let selectedType = 1;
  for (let typeNum = 1; typeNum <= 16; typeNum++) {
    try {
      const model = new QRCodeModel(typeNum, level);
      model.addData(cleanText);
      model.make();
      selectedType = typeNum;
      const count = model.getModuleCount();
      const matrix: boolean[][] = [];
      for (let r = 0; r < count; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < count; c++) {
          row.push(model.isDark(r, c));
        }
        matrix.push(row);
      }
      return matrix;
    } catch {
      selectedType = typeNum + 1;
    }
  }

  // Fallback with Level L if text is very long
  const fallbackModel = new QRCodeModel(
    Math.min(16, selectedType),
    QRErrorCorrectLevel.L
  );
  fallbackModel.addData(cleanText.slice(0, 320));
  fallbackModel.make();
  const count = fallbackModel.getModuleCount();
  const matrix: boolean[][] = [];
  for (let r = 0; r < count; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < count; c++) {
      row.push(fallbackModel.isDark(r, c));
    }
    matrix.push(row);
  }
  return matrix;
}

export function renderQRCodeToDataUrl(options: {
  text: string;
  size?: number;
  colorDark?: string;
  colorLight?: string;
  quietZone?: number;
  correctLevel?: QRErrorCorrectLevelKey;
}): string {
  const {
    text,
    size = 256,
    colorDark = '#1c1917',
    colorLight = '#ffffff',
    quietZone = 2,
    correctLevel = 'M',
  } = options;

  const matrix = createQRCodeMatrix(text, correctLevel);
  const moduleCount = matrix.length;
  const totalModules = moduleCount + quietZone * 2;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = colorLight;
      ctx.fillRect(0, 0, size, size);
      const cellSize = size / totalModules;
      ctx.fillStyle = colorDark;
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (matrix[r][c]) {
            const x = Math.floor((c + quietZone) * cellSize);
            const y = Math.floor((r + quietZone) * cellSize);
            const w = Math.ceil((c + quietZone + 1) * cellSize) - x;
            const h = Math.ceil((r + quietZone + 1) * cellSize) - y;
            ctx.fillRect(x, y, w, h);
          }
        }
      }

      // Draw MEPlanner "M" Ribbon Logo badge in the center of the QR canvas
      const boxSize = Math.round(size * 0.22);
      const boxX = Math.round((size - boxSize) / 2);
      const boxY = Math.round((size - boxSize) / 2);
      const radius = Math.max(4, Math.round(boxSize * 0.22));

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxSize, boxSize, radius);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, size * 0.008);
      ctx.strokeStyle = '#D4AF37';
      ctx.stroke();

      // Draw stylized M ribbon in violet-blue-coral gradient inside the center badge
      const mGrad = ctx.createLinearGradient(
        boxX + boxSize * 0.18,
        boxY + boxSize * 0.22,
        boxX + boxSize * 0.82,
        boxY + boxSize * 0.78
      );
      mGrad.addColorStop(0, '#8B5CF6');
      mGrad.addColorStop(0.5, '#3B82F6');
      mGrad.addColorStop(1, '#FB7185');
      ctx.strokeStyle = mGrad;
      ctx.lineWidth = Math.max(2, boxSize * 0.13);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(boxX + boxSize * 0.24, boxY + boxSize * 0.74);
      ctx.lineTo(boxX + boxSize * 0.24, boxY + boxSize * 0.28);
      ctx.lineTo(boxX + boxSize * 0.5, boxY + boxSize * 0.58);
      ctx.lineTo(boxX + boxSize * 0.76, boxY + boxSize * 0.28);
      ctx.lineTo(boxX + boxSize * 0.76, boxY + boxSize * 0.74);
      ctx.stroke();
      ctx.restore();

      return canvas.toDataURL('image/png');
    }
  }

  // SSR-safe SVG Data URI fallback
  let paths = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        paths += `<rect x="${c + quietZone}" y="${r + quietZone}" width="1" height="1" fill="${colorDark}"/>`;
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${colorLight}"/>${paths}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
