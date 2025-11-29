"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs/promises");
const crypto = require("crypto");
const child_process = require("child_process");
const https = require("https");
const http = require("http");
const os = require("os");
const require$$0 = require("zlib");
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var util = { exports: {} };
var constants;
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  constants = {
    /* The local file header */
    LOCHDR: 30,
    // LOC header size
    LOCSIG: 67324752,
    // "PK\003\004"
    LOCVER: 4,
    // version needed to extract
    LOCFLG: 6,
    // general purpose bit flag
    LOCHOW: 8,
    // compression method
    LOCTIM: 10,
    // modification time (2 bytes time, 2 bytes date)
    LOCCRC: 14,
    // uncompressed file crc-32 value
    LOCSIZ: 18,
    // compressed size
    LOCLEN: 22,
    // uncompressed size
    LOCNAM: 26,
    // filename length
    LOCEXT: 28,
    // extra field length
    /* The Data descriptor */
    EXTSIG: 134695760,
    // "PK\007\008"
    EXTHDR: 16,
    // EXT header size
    EXTCRC: 4,
    // uncompressed file crc-32 value
    EXTSIZ: 8,
    // compressed size
    EXTLEN: 12,
    // uncompressed size
    /* The central directory file header */
    CENHDR: 46,
    // CEN header size
    CENSIG: 33639248,
    // "PK\001\002"
    CENVEM: 4,
    // version made by
    CENVER: 6,
    // version needed to extract
    CENFLG: 8,
    // encrypt, decrypt flags
    CENHOW: 10,
    // compression method
    CENTIM: 12,
    // modification time (2 bytes time, 2 bytes date)
    CENCRC: 16,
    // uncompressed file crc-32 value
    CENSIZ: 20,
    // compressed size
    CENLEN: 24,
    // uncompressed size
    CENNAM: 28,
    // filename length
    CENEXT: 30,
    // extra field length
    CENCOM: 32,
    // file comment length
    CENDSK: 34,
    // volume number start
    CENATT: 36,
    // internal file attributes
    CENATX: 38,
    // external file attributes (host system dependent)
    CENOFF: 42,
    // LOC header offset
    /* The entries in the end of central directory */
    ENDHDR: 22,
    // END header size
    ENDSIG: 101010256,
    // "PK\005\006"
    ENDSUB: 8,
    // number of entries on this disk
    ENDTOT: 10,
    // total number of entries
    ENDSIZ: 12,
    // central directory size in bytes
    ENDOFF: 16,
    // offset of first CEN header
    ENDCOM: 20,
    // zip file comment length
    END64HDR: 20,
    // zip64 END header size
    END64SIG: 117853008,
    // zip64 Locator signature, "PK\006\007"
    END64START: 4,
    // number of the disk with the start of the zip64
    END64OFF: 8,
    // relative offset of the zip64 end of central directory
    END64NUMDISKS: 16,
    // total number of disks
    ZIP64SIG: 101075792,
    // zip64 signature, "PK\006\006"
    ZIP64HDR: 56,
    // zip64 record minimum size
    ZIP64LEAD: 12,
    // leading bytes at the start of the record, not counted by the value stored in ZIP64SIZE
    ZIP64SIZE: 4,
    // zip64 size of the central directory record
    ZIP64VEM: 12,
    // zip64 version made by
    ZIP64VER: 14,
    // zip64 version needed to extract
    ZIP64DSK: 16,
    // zip64 number of this disk
    ZIP64DSKDIR: 20,
    // number of the disk with the start of the record directory
    ZIP64SUB: 24,
    // number of entries on this disk
    ZIP64TOT: 32,
    // total number of entries
    ZIP64SIZB: 40,
    // zip64 central directory size in bytes
    ZIP64OFF: 48,
    // offset of start of central directory with respect to the starting disk number
    ZIP64EXTRA: 56,
    // extensible data sector
    /* Compression methods */
    STORED: 0,
    // no compression
    SHRUNK: 1,
    // shrunk
    REDUCED1: 2,
    // reduced with compression factor 1
    REDUCED2: 3,
    // reduced with compression factor 2
    REDUCED3: 4,
    // reduced with compression factor 3
    REDUCED4: 5,
    // reduced with compression factor 4
    IMPLODED: 6,
    // imploded
    // 7 reserved for Tokenizing compression algorithm
    DEFLATED: 8,
    // deflated
    ENHANCED_DEFLATED: 9,
    // enhanced deflated
    PKWARE: 10,
    // PKWare DCL imploded
    // 11 reserved by PKWARE
    BZIP2: 12,
    //  compressed using BZIP2
    // 13 reserved by PKWARE
    LZMA: 14,
    // LZMA
    // 15-17 reserved by PKWARE
    IBM_TERSE: 18,
    // compressed using IBM TERSE
    IBM_LZ77: 19,
    // IBM LZ77 z
    AES_ENCRYPT: 99,
    // WinZIP AES encryption method
    /* General purpose bit flag */
    // values can obtained with expression 2**bitnr
    FLG_ENC: 1,
    // Bit 0: encrypted file
    FLG_COMP1: 2,
    // Bit 1, compression option
    FLG_COMP2: 4,
    // Bit 2, compression option
    FLG_DESC: 8,
    // Bit 3, data descriptor
    FLG_ENH: 16,
    // Bit 4, enhanced deflating
    FLG_PATCH: 32,
    // Bit 5, indicates that the file is compressed patched data.
    FLG_STR: 64,
    // Bit 6, strong encryption (patented)
    // Bits 7-10: Currently unused.
    FLG_EFS: 2048,
    // Bit 11: Language encoding flag (EFS)
    // Bit 12: Reserved by PKWARE for enhanced compression.
    // Bit 13: encrypted the Central Directory (patented).
    // Bits 14-15: Reserved by PKWARE.
    FLG_MSK: 4096,
    // mask header values
    /* Load type */
    FILE: 2,
    BUFFER: 1,
    NONE: 0,
    /* 4.5 Extensible data fields */
    EF_ID: 0,
    EF_SIZE: 2,
    /* Header IDs */
    ID_ZIP64: 1,
    ID_AVINFO: 7,
    ID_PFS: 8,
    ID_OS2: 9,
    ID_NTFS: 10,
    ID_OPENVMS: 12,
    ID_UNIX: 13,
    ID_FORK: 14,
    ID_PATCH: 15,
    ID_X509_PKCS7: 20,
    ID_X509_CERTID_F: 21,
    ID_X509_CERTID_C: 22,
    ID_STRONGENC: 23,
    ID_RECORD_MGT: 24,
    ID_X509_PKCS7_RL: 25,
    ID_IBM1: 101,
    ID_IBM2: 102,
    ID_POSZIP: 18064,
    EF_ZIP64_OR_32: 4294967295,
    EF_ZIP64_OR_16: 65535,
    EF_ZIP64_SUNCOMP: 0,
    EF_ZIP64_SCOMP: 8,
    EF_ZIP64_RHO: 16,
    EF_ZIP64_DSN: 24
  };
  return constants;
}
var errors = {};
var hasRequiredErrors;
function requireErrors() {
  if (hasRequiredErrors) return errors;
  hasRequiredErrors = 1;
  (function(exports$1) {
    const errors2 = {
      /* Header error messages */
      INVALID_LOC: "Invalid LOC header (bad signature)",
      INVALID_CEN: "Invalid CEN header (bad signature)",
      INVALID_END: "Invalid END header (bad signature)",
      /* Descriptor */
      DESCRIPTOR_NOT_EXIST: "No descriptor present",
      DESCRIPTOR_UNKNOWN: "Unknown descriptor format",
      DESCRIPTOR_FAULTY: "Descriptor data is malformed",
      /* ZipEntry error messages*/
      NO_DATA: "Nothing to decompress",
      BAD_CRC: "CRC32 checksum failed {0}",
      FILE_IN_THE_WAY: "There is a file in the way: {0}",
      UNKNOWN_METHOD: "Invalid/unsupported compression method",
      /* Inflater error messages */
      AVAIL_DATA: "inflate::Available inflate data did not terminate",
      INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
      TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
      INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
      INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
      INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
      INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
      INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
      INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
      INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
      /* ADM-ZIP error messages */
      CANT_EXTRACT_FILE: "Could not extract the file",
      CANT_OVERRIDE: "Target file already exists",
      DISK_ENTRY_TOO_LARGE: "Number of disk entries is too large",
      NO_ZIP: "No zip file was loaded",
      NO_ENTRY: "Entry doesn't exist",
      DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
      FILE_NOT_FOUND: 'File not found: "{0}"',
      NOT_IMPLEMENTED: "Not implemented",
      INVALID_FILENAME: "Invalid filename",
      INVALID_FORMAT: "Invalid or unsupported zip format. No END header found",
      INVALID_PASS_PARAM: "Incompatible password parameter",
      WRONG_PASSWORD: "Wrong Password",
      /* ADM-ZIP */
      COMMENT_TOO_LONG: "Comment is too long",
      // Comment can be max 65535 bytes long (NOTE: some non-US characters may take more space)
      EXTRA_FIELD_PARSE_ERROR: "Extra field parsing error"
    };
    function E(message) {
      return function(...args) {
        if (args.length) {
          message = message.replace(/\{(\d)\}/g, (_, n) => args[n] || "");
        }
        return new Error("ADM-ZIP: " + message);
      };
    }
    for (const msg of Object.keys(errors2)) {
      exports$1[msg] = E(errors2[msg]);
    }
  })(errors);
  return errors;
}
var utils;
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  const fsystem = fs;
  const pth = path;
  const Constants = requireConstants();
  const Errors = requireErrors();
  const isWin = typeof process === "object" && "win32" === process.platform;
  const is_Obj = (obj) => typeof obj === "object" && obj !== null;
  const crcTable = new Uint32Array(256).map((t, c) => {
    for (let k = 0; k < 8; k++) {
      if ((c & 1) !== 0) {
        c = 3988292384 ^ c >>> 1;
      } else {
        c >>>= 1;
      }
    }
    return c >>> 0;
  });
  function Utils(opts) {
    this.sep = pth.sep;
    this.fs = fsystem;
    if (is_Obj(opts)) {
      if (is_Obj(opts.fs) && typeof opts.fs.statSync === "function") {
        this.fs = opts.fs;
      }
    }
  }
  utils = Utils;
  Utils.prototype.makeDir = function(folder) {
    const self = this;
    function mkdirSync(fpath) {
      let resolvedPath = fpath.split(self.sep)[0];
      fpath.split(self.sep).forEach(function(name) {
        if (!name || name.substr(-1, 1) === ":") return;
        resolvedPath += self.sep + name;
        var stat;
        try {
          stat = self.fs.statSync(resolvedPath);
        } catch (e) {
          self.fs.mkdirSync(resolvedPath);
        }
        if (stat && stat.isFile()) throw Errors.FILE_IN_THE_WAY(`"${resolvedPath}"`);
      });
    }
    mkdirSync(folder);
  };
  Utils.prototype.writeFileTo = function(path2, content, overwrite, attr) {
    const self = this;
    if (self.fs.existsSync(path2)) {
      if (!overwrite) return false;
      var stat = self.fs.statSync(path2);
      if (stat.isDirectory()) {
        return false;
      }
    }
    var folder = pth.dirname(path2);
    if (!self.fs.existsSync(folder)) {
      self.makeDir(folder);
    }
    var fd;
    try {
      fd = self.fs.openSync(path2, "w", 438);
    } catch (e) {
      self.fs.chmodSync(path2, 438);
      fd = self.fs.openSync(path2, "w", 438);
    }
    if (fd) {
      try {
        self.fs.writeSync(fd, content, 0, content.length, 0);
      } finally {
        self.fs.closeSync(fd);
      }
    }
    self.fs.chmodSync(path2, attr || 438);
    return true;
  };
  Utils.prototype.writeFileToAsync = function(path2, content, overwrite, attr, callback) {
    if (typeof attr === "function") {
      callback = attr;
      attr = void 0;
    }
    const self = this;
    self.fs.exists(path2, function(exist) {
      if (exist && !overwrite) return callback(false);
      self.fs.stat(path2, function(err, stat) {
        if (exist && stat.isDirectory()) {
          return callback(false);
        }
        var folder = pth.dirname(path2);
        self.fs.exists(folder, function(exists) {
          if (!exists) self.makeDir(folder);
          self.fs.open(path2, "w", 438, function(err2, fd) {
            if (err2) {
              self.fs.chmod(path2, 438, function() {
                self.fs.open(path2, "w", 438, function(err3, fd2) {
                  self.fs.write(fd2, content, 0, content.length, 0, function() {
                    self.fs.close(fd2, function() {
                      self.fs.chmod(path2, attr || 438, function() {
                        callback(true);
                      });
                    });
                  });
                });
              });
            } else if (fd) {
              self.fs.write(fd, content, 0, content.length, 0, function() {
                self.fs.close(fd, function() {
                  self.fs.chmod(path2, attr || 438, function() {
                    callback(true);
                  });
                });
              });
            } else {
              self.fs.chmod(path2, attr || 438, function() {
                callback(true);
              });
            }
          });
        });
      });
    });
  };
  Utils.prototype.findFiles = function(path2) {
    const self = this;
    function findSync(dir, pattern, recursive) {
      let files = [];
      self.fs.readdirSync(dir).forEach(function(file) {
        const path3 = pth.join(dir, file);
        const stat = self.fs.statSync(path3);
        {
          files.push(pth.normalize(path3) + (stat.isDirectory() ? self.sep : ""));
        }
        if (stat.isDirectory() && recursive) files = files.concat(findSync(path3, pattern, recursive));
      });
      return files;
    }
    return findSync(path2, void 0, true);
  };
  Utils.prototype.findFilesAsync = function(dir, cb) {
    const self = this;
    let results = [];
    self.fs.readdir(dir, function(err, list) {
      if (err) return cb(err);
      let list_length = list.length;
      if (!list_length) return cb(null, results);
      list.forEach(function(file) {
        file = pth.join(dir, file);
        self.fs.stat(file, function(err2, stat) {
          if (err2) return cb(err2);
          if (stat) {
            results.push(pth.normalize(file) + (stat.isDirectory() ? self.sep : ""));
            if (stat.isDirectory()) {
              self.findFilesAsync(file, function(err3, res) {
                if (err3) return cb(err3);
                results = results.concat(res);
                if (!--list_length) cb(null, results);
              });
            } else {
              if (!--list_length) cb(null, results);
            }
          }
        });
      });
    });
  };
  Utils.prototype.getAttributes = function() {
  };
  Utils.prototype.setAttributes = function() {
  };
  Utils.crc32update = function(crc, byte) {
    return crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
  };
  Utils.crc32 = function(buf) {
    if (typeof buf === "string") {
      buf = Buffer.from(buf, "utf8");
    }
    let len = buf.length;
    let crc = -1;
    for (let off = 0; off < len; ) crc = Utils.crc32update(crc, buf[off++]);
    return ~crc >>> 0;
  };
  Utils.methodToString = function(method) {
    switch (method) {
      case Constants.STORED:
        return "STORED (" + method + ")";
      case Constants.DEFLATED:
        return "DEFLATED (" + method + ")";
      default:
        return "UNSUPPORTED (" + method + ")";
    }
  };
  Utils.canonical = function(path2) {
    if (!path2) return "";
    const safeSuffix = pth.posix.normalize("/" + path2.split("\\").join("/"));
    return pth.join(".", safeSuffix);
  };
  Utils.zipnamefix = function(path2) {
    if (!path2) return "";
    const safeSuffix = pth.posix.normalize("/" + path2.split("\\").join("/"));
    return pth.posix.join(".", safeSuffix);
  };
  Utils.findLast = function(arr, callback) {
    if (!Array.isArray(arr)) throw new TypeError("arr is not array");
    const len = arr.length >>> 0;
    for (let i = len - 1; i >= 0; i--) {
      if (callback(arr[i], i, arr)) {
        return arr[i];
      }
    }
    return void 0;
  };
  Utils.sanitize = function(prefix, name) {
    prefix = pth.resolve(pth.normalize(prefix));
    var parts = name.split("/");
    for (var i = 0, l = parts.length; i < l; i++) {
      var path2 = pth.normalize(pth.join(prefix, parts.slice(i, l).join(pth.sep)));
      if (path2.indexOf(prefix) === 0) {
        return path2;
      }
    }
    return pth.normalize(pth.join(prefix, pth.basename(name)));
  };
  Utils.toBuffer = function toBuffer(input, encoder) {
    if (Buffer.isBuffer(input)) {
      return input;
    } else if (input instanceof Uint8Array) {
      return Buffer.from(input);
    } else {
      return typeof input === "string" ? encoder(input) : Buffer.alloc(0);
    }
  };
  Utils.readBigUInt64LE = function(buffer, index) {
    var slice = Buffer.from(buffer.slice(index, index + 8));
    slice.swap64();
    return parseInt(`0x${slice.toString("hex")}`);
  };
  Utils.fromDOS2Date = function(val) {
    return new Date((val >> 25 & 127) + 1980, Math.max((val >> 21 & 15) - 1, 0), Math.max(val >> 16 & 31, 1), val >> 11 & 31, val >> 5 & 63, (val & 31) << 1);
  };
  Utils.fromDate2DOS = function(val) {
    let date = 0;
    let time = 0;
    if (val.getFullYear() > 1979) {
      date = (val.getFullYear() - 1980 & 127) << 9 | val.getMonth() + 1 << 5 | val.getDate();
      time = val.getHours() << 11 | val.getMinutes() << 5 | val.getSeconds() >> 1;
    }
    return date << 16 | time;
  };
  Utils.isWin = isWin;
  Utils.crcTable = crcTable;
  return utils;
}
var fattr;
var hasRequiredFattr;
function requireFattr() {
  if (hasRequiredFattr) return fattr;
  hasRequiredFattr = 1;
  const pth = path;
  fattr = function(path2, { fs: fs2 }) {
    var _path = path2 || "", _obj = newAttr(), _stat = null;
    function newAttr() {
      return {
        directory: false,
        readonly: false,
        hidden: false,
        executable: false,
        mtime: 0,
        atime: 0
      };
    }
    if (_path && fs2.existsSync(_path)) {
      _stat = fs2.statSync(_path);
      _obj.directory = _stat.isDirectory();
      _obj.mtime = _stat.mtime;
      _obj.atime = _stat.atime;
      _obj.executable = (73 & _stat.mode) !== 0;
      _obj.readonly = (128 & _stat.mode) === 0;
      _obj.hidden = pth.basename(_path)[0] === ".";
    } else {
      console.warn("Invalid path: " + _path);
    }
    return {
      get directory() {
        return _obj.directory;
      },
      get readOnly() {
        return _obj.readonly;
      },
      get hidden() {
        return _obj.hidden;
      },
      get mtime() {
        return _obj.mtime;
      },
      get atime() {
        return _obj.atime;
      },
      get executable() {
        return _obj.executable;
      },
      decodeAttributes: function() {
      },
      encodeAttributes: function() {
      },
      toJSON: function() {
        return {
          path: _path,
          isDirectory: _obj.directory,
          isReadOnly: _obj.readonly,
          isHidden: _obj.hidden,
          isExecutable: _obj.executable,
          mTime: _obj.mtime,
          aTime: _obj.atime
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  };
  return fattr;
}
var decoder;
var hasRequiredDecoder;
function requireDecoder() {
  if (hasRequiredDecoder) return decoder;
  hasRequiredDecoder = 1;
  decoder = {
    efs: true,
    encode: (data) => Buffer.from(data, "utf8"),
    decode: (data) => data.toString("utf8")
  };
  return decoder;
}
var hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util.exports;
  hasRequiredUtil = 1;
  util.exports = requireUtils();
  util.exports.Constants = requireConstants();
  util.exports.Errors = requireErrors();
  util.exports.FileAttr = requireFattr();
  util.exports.decoder = requireDecoder();
  return util.exports;
}
var headers = {};
var entryHeader;
var hasRequiredEntryHeader;
function requireEntryHeader() {
  if (hasRequiredEntryHeader) return entryHeader;
  hasRequiredEntryHeader = 1;
  var Utils = requireUtil(), Constants = Utils.Constants;
  entryHeader = function() {
    var _verMade = 20, _version = 10, _flags = 0, _method = 0, _time = 0, _crc = 0, _compressedSize = 0, _size = 0, _fnameLen = 0, _extraLen = 0, _comLen = 0, _diskStart = 0, _inattr = 0, _attr = 0, _offset = 0;
    _verMade |= Utils.isWin ? 2560 : 768;
    _flags |= Constants.FLG_EFS;
    const _localHeader = {
      extraLen: 0
    };
    const uint32 = (val) => Math.max(0, val) >>> 0;
    const uint8 = (val) => Math.max(0, val) & 255;
    _time = Utils.fromDate2DOS(/* @__PURE__ */ new Date());
    return {
      get made() {
        return _verMade;
      },
      set made(val) {
        _verMade = val;
      },
      get version() {
        return _version;
      },
      set version(val) {
        _version = val;
      },
      get flags() {
        return _flags;
      },
      set flags(val) {
        _flags = val;
      },
      get flags_efs() {
        return (_flags & Constants.FLG_EFS) > 0;
      },
      set flags_efs(val) {
        if (val) {
          _flags |= Constants.FLG_EFS;
        } else {
          _flags &= ~Constants.FLG_EFS;
        }
      },
      get flags_desc() {
        return (_flags & Constants.FLG_DESC) > 0;
      },
      set flags_desc(val) {
        if (val) {
          _flags |= Constants.FLG_DESC;
        } else {
          _flags &= ~Constants.FLG_DESC;
        }
      },
      get method() {
        return _method;
      },
      set method(val) {
        switch (val) {
          case Constants.STORED:
            this.version = 10;
          case Constants.DEFLATED:
          default:
            this.version = 20;
        }
        _method = val;
      },
      get time() {
        return Utils.fromDOS2Date(this.timeval);
      },
      set time(val) {
        this.timeval = Utils.fromDate2DOS(val);
      },
      get timeval() {
        return _time;
      },
      set timeval(val) {
        _time = uint32(val);
      },
      get timeHighByte() {
        return uint8(_time >>> 8);
      },
      get crc() {
        return _crc;
      },
      set crc(val) {
        _crc = uint32(val);
      },
      get compressedSize() {
        return _compressedSize;
      },
      set compressedSize(val) {
        _compressedSize = uint32(val);
      },
      get size() {
        return _size;
      },
      set size(val) {
        _size = uint32(val);
      },
      get fileNameLength() {
        return _fnameLen;
      },
      set fileNameLength(val) {
        _fnameLen = val;
      },
      get extraLength() {
        return _extraLen;
      },
      set extraLength(val) {
        _extraLen = val;
      },
      get extraLocalLength() {
        return _localHeader.extraLen;
      },
      set extraLocalLength(val) {
        _localHeader.extraLen = val;
      },
      get commentLength() {
        return _comLen;
      },
      set commentLength(val) {
        _comLen = val;
      },
      get diskNumStart() {
        return _diskStart;
      },
      set diskNumStart(val) {
        _diskStart = uint32(val);
      },
      get inAttr() {
        return _inattr;
      },
      set inAttr(val) {
        _inattr = uint32(val);
      },
      get attr() {
        return _attr;
      },
      set attr(val) {
        _attr = uint32(val);
      },
      // get Unix file permissions
      get fileAttr() {
        return (_attr || 0) >> 16 & 4095;
      },
      get offset() {
        return _offset;
      },
      set offset(val) {
        _offset = uint32(val);
      },
      get encrypted() {
        return (_flags & Constants.FLG_ENC) === Constants.FLG_ENC;
      },
      get centralHeaderSize() {
        return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
      },
      get realDataOffset() {
        return _offset + Constants.LOCHDR + _localHeader.fnameLen + _localHeader.extraLen;
      },
      get localHeader() {
        return _localHeader;
      },
      loadLocalHeaderFromBinary: function(input) {
        var data = input.slice(_offset, _offset + Constants.LOCHDR);
        if (data.readUInt32LE(0) !== Constants.LOCSIG) {
          throw Utils.Errors.INVALID_LOC();
        }
        _localHeader.version = data.readUInt16LE(Constants.LOCVER);
        _localHeader.flags = data.readUInt16LE(Constants.LOCFLG);
        _localHeader.method = data.readUInt16LE(Constants.LOCHOW);
        _localHeader.time = data.readUInt32LE(Constants.LOCTIM);
        _localHeader.crc = data.readUInt32LE(Constants.LOCCRC);
        _localHeader.compressedSize = data.readUInt32LE(Constants.LOCSIZ);
        _localHeader.size = data.readUInt32LE(Constants.LOCLEN);
        _localHeader.fnameLen = data.readUInt16LE(Constants.LOCNAM);
        _localHeader.extraLen = data.readUInt16LE(Constants.LOCEXT);
        const extraStart = _offset + Constants.LOCHDR + _localHeader.fnameLen;
        const extraEnd = extraStart + _localHeader.extraLen;
        return input.slice(extraStart, extraEnd);
      },
      loadFromBinary: function(data) {
        if (data.length !== Constants.CENHDR || data.readUInt32LE(0) !== Constants.CENSIG) {
          throw Utils.Errors.INVALID_CEN();
        }
        _verMade = data.readUInt16LE(Constants.CENVEM);
        _version = data.readUInt16LE(Constants.CENVER);
        _flags = data.readUInt16LE(Constants.CENFLG);
        _method = data.readUInt16LE(Constants.CENHOW);
        _time = data.readUInt32LE(Constants.CENTIM);
        _crc = data.readUInt32LE(Constants.CENCRC);
        _compressedSize = data.readUInt32LE(Constants.CENSIZ);
        _size = data.readUInt32LE(Constants.CENLEN);
        _fnameLen = data.readUInt16LE(Constants.CENNAM);
        _extraLen = data.readUInt16LE(Constants.CENEXT);
        _comLen = data.readUInt16LE(Constants.CENCOM);
        _diskStart = data.readUInt16LE(Constants.CENDSK);
        _inattr = data.readUInt16LE(Constants.CENATT);
        _attr = data.readUInt32LE(Constants.CENATX);
        _offset = data.readUInt32LE(Constants.CENOFF);
      },
      localHeaderToBinary: function() {
        var data = Buffer.alloc(Constants.LOCHDR);
        data.writeUInt32LE(Constants.LOCSIG, 0);
        data.writeUInt16LE(_version, Constants.LOCVER);
        data.writeUInt16LE(_flags, Constants.LOCFLG);
        data.writeUInt16LE(_method, Constants.LOCHOW);
        data.writeUInt32LE(_time, Constants.LOCTIM);
        data.writeUInt32LE(_crc, Constants.LOCCRC);
        data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
        data.writeUInt32LE(_size, Constants.LOCLEN);
        data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
        data.writeUInt16LE(_localHeader.extraLen, Constants.LOCEXT);
        return data;
      },
      centralHeaderToBinary: function() {
        var data = Buffer.alloc(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
        data.writeUInt32LE(Constants.CENSIG, 0);
        data.writeUInt16LE(_verMade, Constants.CENVEM);
        data.writeUInt16LE(_version, Constants.CENVER);
        data.writeUInt16LE(_flags, Constants.CENFLG);
        data.writeUInt16LE(_method, Constants.CENHOW);
        data.writeUInt32LE(_time, Constants.CENTIM);
        data.writeUInt32LE(_crc, Constants.CENCRC);
        data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
        data.writeUInt32LE(_size, Constants.CENLEN);
        data.writeUInt16LE(_fnameLen, Constants.CENNAM);
        data.writeUInt16LE(_extraLen, Constants.CENEXT);
        data.writeUInt16LE(_comLen, Constants.CENCOM);
        data.writeUInt16LE(_diskStart, Constants.CENDSK);
        data.writeUInt16LE(_inattr, Constants.CENATT);
        data.writeUInt32LE(_attr, Constants.CENATX);
        data.writeUInt32LE(_offset, Constants.CENOFF);
        return data;
      },
      toJSON: function() {
        const bytes = function(nr) {
          return nr + " bytes";
        };
        return {
          made: _verMade,
          version: _version,
          flags: _flags,
          method: Utils.methodToString(_method),
          time: this.time,
          crc: "0x" + _crc.toString(16).toUpperCase(),
          compressedSize: bytes(_compressedSize),
          size: bytes(_size),
          fileNameLength: bytes(_fnameLen),
          extraLength: bytes(_extraLen),
          commentLength: bytes(_comLen),
          diskNumStart: _diskStart,
          inAttr: _inattr,
          attr: _attr,
          offset: _offset,
          centralHeaderSize: bytes(Constants.CENHDR + _fnameLen + _extraLen + _comLen)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  };
  return entryHeader;
}
var mainHeader;
var hasRequiredMainHeader;
function requireMainHeader() {
  if (hasRequiredMainHeader) return mainHeader;
  hasRequiredMainHeader = 1;
  var Utils = requireUtil(), Constants = Utils.Constants;
  mainHeader = function() {
    var _volumeEntries = 0, _totalEntries = 0, _size = 0, _offset = 0, _commentLength = 0;
    return {
      get diskEntries() {
        return _volumeEntries;
      },
      set diskEntries(val) {
        _volumeEntries = _totalEntries = val;
      },
      get totalEntries() {
        return _totalEntries;
      },
      set totalEntries(val) {
        _totalEntries = _volumeEntries = val;
      },
      get size() {
        return _size;
      },
      set size(val) {
        _size = val;
      },
      get offset() {
        return _offset;
      },
      set offset(val) {
        _offset = val;
      },
      get commentLength() {
        return _commentLength;
      },
      set commentLength(val) {
        _commentLength = val;
      },
      get mainHeaderSize() {
        return Constants.ENDHDR + _commentLength;
      },
      loadFromBinary: function(data) {
        if ((data.length !== Constants.ENDHDR || data.readUInt32LE(0) !== Constants.ENDSIG) && (data.length < Constants.ZIP64HDR || data.readUInt32LE(0) !== Constants.ZIP64SIG)) {
          throw Utils.Errors.INVALID_END();
        }
        if (data.readUInt32LE(0) === Constants.ENDSIG) {
          _volumeEntries = data.readUInt16LE(Constants.ENDSUB);
          _totalEntries = data.readUInt16LE(Constants.ENDTOT);
          _size = data.readUInt32LE(Constants.ENDSIZ);
          _offset = data.readUInt32LE(Constants.ENDOFF);
          _commentLength = data.readUInt16LE(Constants.ENDCOM);
        } else {
          _volumeEntries = Utils.readBigUInt64LE(data, Constants.ZIP64SUB);
          _totalEntries = Utils.readBigUInt64LE(data, Constants.ZIP64TOT);
          _size = Utils.readBigUInt64LE(data, Constants.ZIP64SIZE);
          _offset = Utils.readBigUInt64LE(data, Constants.ZIP64OFF);
          _commentLength = 0;
        }
      },
      toBinary: function() {
        var b = Buffer.alloc(Constants.ENDHDR + _commentLength);
        b.writeUInt32LE(Constants.ENDSIG, 0);
        b.writeUInt32LE(0, 4);
        b.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
        b.writeUInt16LE(_totalEntries, Constants.ENDTOT);
        b.writeUInt32LE(_size, Constants.ENDSIZ);
        b.writeUInt32LE(_offset, Constants.ENDOFF);
        b.writeUInt16LE(_commentLength, Constants.ENDCOM);
        b.fill(" ", Constants.ENDHDR);
        return b;
      },
      toJSON: function() {
        const offset = function(nr, len) {
          let offs = nr.toString(16).toUpperCase();
          while (offs.length < len) offs = "0" + offs;
          return "0x" + offs;
        };
        return {
          diskEntries: _volumeEntries,
          totalEntries: _totalEntries,
          size: _size + " bytes",
          offset: offset(_offset, 4),
          commentLength: _commentLength
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  };
  return mainHeader;
}
var hasRequiredHeaders;
function requireHeaders() {
  if (hasRequiredHeaders) return headers;
  hasRequiredHeaders = 1;
  headers.EntryHeader = requireEntryHeader();
  headers.MainHeader = requireMainHeader();
  return headers;
}
var methods = {};
var deflater;
var hasRequiredDeflater;
function requireDeflater() {
  if (hasRequiredDeflater) return deflater;
  hasRequiredDeflater = 1;
  deflater = function(inbuf) {
    var zlib = require$$0;
    var opts = { chunkSize: (parseInt(inbuf.length / 1024) + 1) * 1024 };
    return {
      deflate: function() {
        return zlib.deflateRawSync(inbuf, opts);
      },
      deflateAsync: function(callback) {
        var tmp = zlib.createDeflateRaw(opts), parts = [], total = 0;
        tmp.on("data", function(data) {
          parts.push(data);
          total += data.length;
        });
        tmp.on("end", function() {
          var buf = Buffer.alloc(total), written = 0;
          buf.fill(0);
          for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            part.copy(buf, written);
            written += part.length;
          }
          callback && callback(buf);
        });
        tmp.end(inbuf);
      }
    };
  };
  return deflater;
}
var inflater;
var hasRequiredInflater;
function requireInflater() {
  if (hasRequiredInflater) return inflater;
  hasRequiredInflater = 1;
  const version = +(process.versions ? process.versions.node : "").split(".")[0] || 0;
  inflater = function(inbuf, expectedLength) {
    var zlib = require$$0;
    const option = version >= 15 && expectedLength > 0 ? { maxOutputLength: expectedLength } : {};
    return {
      inflate: function() {
        return zlib.inflateRawSync(inbuf, option);
      },
      inflateAsync: function(callback) {
        var tmp = zlib.createInflateRaw(option), parts = [], total = 0;
        tmp.on("data", function(data) {
          parts.push(data);
          total += data.length;
        });
        tmp.on("end", function() {
          var buf = Buffer.alloc(total), written = 0;
          buf.fill(0);
          for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            part.copy(buf, written);
            written += part.length;
          }
          callback && callback(buf);
        });
        tmp.end(inbuf);
      }
    };
  };
  return inflater;
}
var zipcrypto;
var hasRequiredZipcrypto;
function requireZipcrypto() {
  if (hasRequiredZipcrypto) return zipcrypto;
  hasRequiredZipcrypto = 1;
  const { randomFillSync } = crypto;
  const Errors = requireErrors();
  const crctable = new Uint32Array(256).map((t, crc) => {
    for (let j = 0; j < 8; j++) {
      if (0 !== (crc & 1)) {
        crc = crc >>> 1 ^ 3988292384;
      } else {
        crc >>>= 1;
      }
    }
    return crc >>> 0;
  });
  const uMul = (a, b) => Math.imul(a, b) >>> 0;
  const crc32update = (pCrc32, bval) => {
    return crctable[(pCrc32 ^ bval) & 255] ^ pCrc32 >>> 8;
  };
  const genSalt = () => {
    if ("function" === typeof randomFillSync) {
      return randomFillSync(Buffer.alloc(12));
    } else {
      return genSalt.node();
    }
  };
  genSalt.node = () => {
    const salt = Buffer.alloc(12);
    const len = salt.length;
    for (let i = 0; i < len; i++) salt[i] = Math.random() * 256 & 255;
    return salt;
  };
  const config = {
    genSalt
  };
  function Initkeys(pw) {
    const pass = Buffer.isBuffer(pw) ? pw : Buffer.from(pw);
    this.keys = new Uint32Array([305419896, 591751049, 878082192]);
    for (let i = 0; i < pass.length; i++) {
      this.updateKeys(pass[i]);
    }
  }
  Initkeys.prototype.updateKeys = function(byteValue) {
    const keys = this.keys;
    keys[0] = crc32update(keys[0], byteValue);
    keys[1] += keys[0] & 255;
    keys[1] = uMul(keys[1], 134775813) + 1;
    keys[2] = crc32update(keys[2], keys[1] >>> 24);
    return byteValue;
  };
  Initkeys.prototype.next = function() {
    const k = (this.keys[2] | 2) >>> 0;
    return uMul(k, k ^ 1) >> 8 & 255;
  };
  function make_decrypter(pwd) {
    const keys = new Initkeys(pwd);
    return function(data) {
      const result = Buffer.alloc(data.length);
      let pos = 0;
      for (let c of data) {
        result[pos++] = keys.updateKeys(c ^ keys.next());
      }
      return result;
    };
  }
  function make_encrypter(pwd) {
    const keys = new Initkeys(pwd);
    return function(data, result, pos = 0) {
      if (!result) result = Buffer.alloc(data.length);
      for (let c of data) {
        const k = keys.next();
        result[pos++] = c ^ k;
        keys.updateKeys(c);
      }
      return result;
    };
  }
  function decrypt(data, header, pwd) {
    if (!data || !Buffer.isBuffer(data) || data.length < 12) {
      return Buffer.alloc(0);
    }
    const decrypter = make_decrypter(pwd);
    const salt = decrypter(data.slice(0, 12));
    const verifyByte = (header.flags & 8) === 8 ? header.timeHighByte : header.crc >>> 24;
    if (salt[11] !== verifyByte) {
      throw Errors.WRONG_PASSWORD();
    }
    return decrypter(data.slice(12));
  }
  function _salter(data) {
    if (Buffer.isBuffer(data) && data.length >= 12) {
      config.genSalt = function() {
        return data.slice(0, 12);
      };
    } else if (data === "node") {
      config.genSalt = genSalt.node;
    } else {
      config.genSalt = genSalt;
    }
  }
  function encrypt(data, header, pwd, oldlike = false) {
    if (data == null) data = Buffer.alloc(0);
    if (!Buffer.isBuffer(data)) data = Buffer.from(data.toString());
    const encrypter = make_encrypter(pwd);
    const salt = config.genSalt();
    salt[11] = header.crc >>> 24 & 255;
    if (oldlike) salt[10] = header.crc >>> 16 & 255;
    const result = Buffer.alloc(data.length + 12);
    encrypter(salt, result);
    return encrypter(data, result, 12);
  }
  zipcrypto = { decrypt, encrypt, _salter };
  return zipcrypto;
}
var hasRequiredMethods;
function requireMethods() {
  if (hasRequiredMethods) return methods;
  hasRequiredMethods = 1;
  methods.Deflater = requireDeflater();
  methods.Inflater = requireInflater();
  methods.ZipCrypto = requireZipcrypto();
  return methods;
}
var zipEntry;
var hasRequiredZipEntry;
function requireZipEntry() {
  if (hasRequiredZipEntry) return zipEntry;
  hasRequiredZipEntry = 1;
  var Utils = requireUtil(), Headers = requireHeaders(), Constants = Utils.Constants, Methods = requireMethods();
  zipEntry = function(options, input) {
    var _centralHeader = new Headers.EntryHeader(), _entryName = Buffer.alloc(0), _comment = Buffer.alloc(0), _isDirectory = false, uncompressedData = null, _extra = Buffer.alloc(0), _extralocal = Buffer.alloc(0), _efs = true;
    const opts = options;
    const decoder2 = typeof opts.decoder === "object" ? opts.decoder : Utils.decoder;
    _efs = decoder2.hasOwnProperty("efs") ? decoder2.efs : false;
    function getCompressedDataFromZip() {
      if (!input || !(input instanceof Uint8Array)) {
        return Buffer.alloc(0);
      }
      _extralocal = _centralHeader.loadLocalHeaderFromBinary(input);
      return input.slice(_centralHeader.realDataOffset, _centralHeader.realDataOffset + _centralHeader.compressedSize);
    }
    function crc32OK(data) {
      if (!_centralHeader.flags_desc) {
        if (Utils.crc32(data) !== _centralHeader.localHeader.crc) {
          return false;
        }
      } else {
        const descriptor = {};
        const dataEndOffset = _centralHeader.realDataOffset + _centralHeader.compressedSize;
        if (input.readUInt32LE(dataEndOffset) == Constants.LOCSIG || input.readUInt32LE(dataEndOffset) == Constants.CENSIG) {
          throw Utils.Errors.DESCRIPTOR_NOT_EXIST();
        }
        if (input.readUInt32LE(dataEndOffset) == Constants.EXTSIG) {
          descriptor.crc = input.readUInt32LE(dataEndOffset + Constants.EXTCRC);
          descriptor.compressedSize = input.readUInt32LE(dataEndOffset + Constants.EXTSIZ);
          descriptor.size = input.readUInt32LE(dataEndOffset + Constants.EXTLEN);
        } else if (input.readUInt16LE(dataEndOffset + 12) === 19280) {
          descriptor.crc = input.readUInt32LE(dataEndOffset + Constants.EXTCRC - 4);
          descriptor.compressedSize = input.readUInt32LE(dataEndOffset + Constants.EXTSIZ - 4);
          descriptor.size = input.readUInt32LE(dataEndOffset + Constants.EXTLEN - 4);
        } else {
          throw Utils.Errors.DESCRIPTOR_UNKNOWN();
        }
        if (descriptor.compressedSize !== _centralHeader.compressedSize || descriptor.size !== _centralHeader.size || descriptor.crc !== _centralHeader.crc) {
          throw Utils.Errors.DESCRIPTOR_FAULTY();
        }
        if (Utils.crc32(data) !== descriptor.crc) {
          return false;
        }
      }
      return true;
    }
    function decompress(async, callback, pass) {
      if (typeof callback === "undefined" && typeof async === "string") {
        pass = async;
        async = void 0;
      }
      if (_isDirectory) {
        if (async && callback) {
          callback(Buffer.alloc(0), Utils.Errors.DIRECTORY_CONTENT_ERROR());
        }
        return Buffer.alloc(0);
      }
      var compressedData = getCompressedDataFromZip();
      if (compressedData.length === 0) {
        if (async && callback) callback(compressedData);
        return compressedData;
      }
      if (_centralHeader.encrypted) {
        if ("string" !== typeof pass && !Buffer.isBuffer(pass)) {
          throw Utils.Errors.INVALID_PASS_PARAM();
        }
        compressedData = Methods.ZipCrypto.decrypt(compressedData, _centralHeader, pass);
      }
      var data = Buffer.alloc(_centralHeader.size);
      switch (_centralHeader.method) {
        case Utils.Constants.STORED:
          compressedData.copy(data);
          if (!crc32OK(data)) {
            if (async && callback) callback(data, Utils.Errors.BAD_CRC());
            throw Utils.Errors.BAD_CRC();
          } else {
            if (async && callback) callback(data);
            return data;
          }
        case Utils.Constants.DEFLATED:
          var inflater2 = new Methods.Inflater(compressedData, _centralHeader.size);
          if (!async) {
            const result = inflater2.inflate(data);
            result.copy(data, 0);
            if (!crc32OK(data)) {
              throw Utils.Errors.BAD_CRC(`"${decoder2.decode(_entryName)}"`);
            }
            return data;
          } else {
            inflater2.inflateAsync(function(result) {
              result.copy(result, 0);
              if (callback) {
                if (!crc32OK(result)) {
                  callback(result, Utils.Errors.BAD_CRC());
                } else {
                  callback(result);
                }
              }
            });
          }
          break;
        default:
          if (async && callback) callback(Buffer.alloc(0), Utils.Errors.UNKNOWN_METHOD());
          throw Utils.Errors.UNKNOWN_METHOD();
      }
    }
    function compress(async, callback) {
      if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
        if (async && callback) callback(getCompressedDataFromZip());
        return getCompressedDataFromZip();
      }
      if (uncompressedData.length && !_isDirectory) {
        var compressedData;
        switch (_centralHeader.method) {
          case Utils.Constants.STORED:
            _centralHeader.compressedSize = _centralHeader.size;
            compressedData = Buffer.alloc(uncompressedData.length);
            uncompressedData.copy(compressedData);
            if (async && callback) callback(compressedData);
            return compressedData;
          default:
          case Utils.Constants.DEFLATED:
            var deflater2 = new Methods.Deflater(uncompressedData);
            if (!async) {
              var deflated = deflater2.deflate();
              _centralHeader.compressedSize = deflated.length;
              return deflated;
            } else {
              deflater2.deflateAsync(function(data) {
                compressedData = Buffer.alloc(data.length);
                _centralHeader.compressedSize = data.length;
                data.copy(compressedData);
                callback && callback(compressedData);
              });
            }
            deflater2 = null;
            break;
        }
      } else if (async && callback) {
        callback(Buffer.alloc(0));
      } else {
        return Buffer.alloc(0);
      }
    }
    function readUInt64LE(buffer, offset) {
      return (buffer.readUInt32LE(offset + 4) << 4) + buffer.readUInt32LE(offset);
    }
    function parseExtra(data) {
      try {
        var offset = 0;
        var signature, size, part;
        while (offset + 4 < data.length) {
          signature = data.readUInt16LE(offset);
          offset += 2;
          size = data.readUInt16LE(offset);
          offset += 2;
          part = data.slice(offset, offset + size);
          offset += size;
          if (Constants.ID_ZIP64 === signature) {
            parseZip64ExtendedInformation(part);
          }
        }
      } catch (error) {
        throw Utils.Errors.EXTRA_FIELD_PARSE_ERROR();
      }
    }
    function parseZip64ExtendedInformation(data) {
      var size, compressedSize, offset, diskNumStart;
      if (data.length >= Constants.EF_ZIP64_SCOMP) {
        size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
        if (_centralHeader.size === Constants.EF_ZIP64_OR_32) {
          _centralHeader.size = size;
        }
      }
      if (data.length >= Constants.EF_ZIP64_RHO) {
        compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
        if (_centralHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
          _centralHeader.compressedSize = compressedSize;
        }
      }
      if (data.length >= Constants.EF_ZIP64_DSN) {
        offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
        if (_centralHeader.offset === Constants.EF_ZIP64_OR_32) {
          _centralHeader.offset = offset;
        }
      }
      if (data.length >= Constants.EF_ZIP64_DSN + 4) {
        diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
        if (_centralHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
          _centralHeader.diskNumStart = diskNumStart;
        }
      }
    }
    return {
      get entryName() {
        return decoder2.decode(_entryName);
      },
      get rawEntryName() {
        return _entryName;
      },
      set entryName(val) {
        _entryName = Utils.toBuffer(val, decoder2.encode);
        var lastChar = _entryName[_entryName.length - 1];
        _isDirectory = lastChar === 47 || lastChar === 92;
        _centralHeader.fileNameLength = _entryName.length;
      },
      get efs() {
        if (typeof _efs === "function") {
          return _efs(this.entryName);
        } else {
          return _efs;
        }
      },
      get extra() {
        return _extra;
      },
      set extra(val) {
        _extra = val;
        _centralHeader.extraLength = val.length;
        parseExtra(val);
      },
      get comment() {
        return decoder2.decode(_comment);
      },
      set comment(val) {
        _comment = Utils.toBuffer(val, decoder2.encode);
        _centralHeader.commentLength = _comment.length;
        if (_comment.length > 65535) throw Utils.Errors.COMMENT_TOO_LONG();
      },
      get name() {
        var n = decoder2.decode(_entryName);
        return _isDirectory ? n.substr(n.length - 1).split("/").pop() : n.split("/").pop();
      },
      get isDirectory() {
        return _isDirectory;
      },
      getCompressedData: function() {
        return compress(false, null);
      },
      getCompressedDataAsync: function(callback) {
        compress(true, callback);
      },
      setData: function(value) {
        uncompressedData = Utils.toBuffer(value, Utils.decoder.encode);
        if (!_isDirectory && uncompressedData.length) {
          _centralHeader.size = uncompressedData.length;
          _centralHeader.method = Utils.Constants.DEFLATED;
          _centralHeader.crc = Utils.crc32(value);
          _centralHeader.changed = true;
        } else {
          _centralHeader.method = Utils.Constants.STORED;
        }
      },
      getData: function(pass) {
        if (_centralHeader.changed) {
          return uncompressedData;
        } else {
          return decompress(false, null, pass);
        }
      },
      getDataAsync: function(callback, pass) {
        if (_centralHeader.changed) {
          callback(uncompressedData);
        } else {
          decompress(true, callback, pass);
        }
      },
      set attr(attr) {
        _centralHeader.attr = attr;
      },
      get attr() {
        return _centralHeader.attr;
      },
      set header(data) {
        _centralHeader.loadFromBinary(data);
      },
      get header() {
        return _centralHeader;
      },
      packCentralHeader: function() {
        _centralHeader.flags_efs = this.efs;
        _centralHeader.extraLength = _extra.length;
        var header = _centralHeader.centralHeaderToBinary();
        var addpos = Utils.Constants.CENHDR;
        _entryName.copy(header, addpos);
        addpos += _entryName.length;
        _extra.copy(header, addpos);
        addpos += _centralHeader.extraLength;
        _comment.copy(header, addpos);
        return header;
      },
      packLocalHeader: function() {
        let addpos = 0;
        _centralHeader.flags_efs = this.efs;
        _centralHeader.extraLocalLength = _extralocal.length;
        const localHeaderBuf = _centralHeader.localHeaderToBinary();
        const localHeader = Buffer.alloc(localHeaderBuf.length + _entryName.length + _centralHeader.extraLocalLength);
        localHeaderBuf.copy(localHeader, addpos);
        addpos += localHeaderBuf.length;
        _entryName.copy(localHeader, addpos);
        addpos += _entryName.length;
        _extralocal.copy(localHeader, addpos);
        addpos += _extralocal.length;
        return localHeader;
      },
      toJSON: function() {
        const bytes = function(nr) {
          return "<" + (nr && nr.length + " bytes buffer" || "null") + ">";
        };
        return {
          entryName: this.entryName,
          name: this.name,
          comment: this.comment,
          isDirectory: this.isDirectory,
          header: _centralHeader.toJSON(),
          compressedData: bytes(input),
          data: bytes(uncompressedData)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  };
  return zipEntry;
}
var zipFile;
var hasRequiredZipFile;
function requireZipFile() {
  if (hasRequiredZipFile) return zipFile;
  hasRequiredZipFile = 1;
  const ZipEntry = requireZipEntry();
  const Headers = requireHeaders();
  const Utils = requireUtil();
  zipFile = function(inBuffer, options) {
    var entryList = [], entryTable = {}, _comment = Buffer.alloc(0), mainHeader2 = new Headers.MainHeader(), loadedEntries = false;
    const temporary = /* @__PURE__ */ new Set();
    const opts = options;
    const { noSort, decoder: decoder2 } = opts;
    if (inBuffer) {
      readMainHeader(opts.readEntries);
    } else {
      loadedEntries = true;
    }
    function makeTemporaryFolders() {
      const foldersList = /* @__PURE__ */ new Set();
      for (const elem of Object.keys(entryTable)) {
        const elements = elem.split("/");
        elements.pop();
        if (!elements.length) continue;
        for (let i = 0; i < elements.length; i++) {
          const sub = elements.slice(0, i + 1).join("/") + "/";
          foldersList.add(sub);
        }
      }
      for (const elem of foldersList) {
        if (!(elem in entryTable)) {
          const tempfolder = new ZipEntry(opts);
          tempfolder.entryName = elem;
          tempfolder.attr = 16;
          tempfolder.temporary = true;
          entryList.push(tempfolder);
          entryTable[tempfolder.entryName] = tempfolder;
          temporary.add(tempfolder);
        }
      }
    }
    function readEntries() {
      loadedEntries = true;
      entryTable = {};
      if (mainHeader2.diskEntries > (inBuffer.length - mainHeader2.offset) / Utils.Constants.CENHDR) {
        throw Utils.Errors.DISK_ENTRY_TOO_LARGE();
      }
      entryList = new Array(mainHeader2.diskEntries);
      var index = mainHeader2.offset;
      for (var i = 0; i < entryList.length; i++) {
        var tmp = index, entry = new ZipEntry(opts, inBuffer);
        entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);
        entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);
        if (entry.header.extraLength) {
          entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
        }
        if (entry.header.commentLength) entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);
        index += entry.header.centralHeaderSize;
        entryList[i] = entry;
        entryTable[entry.entryName] = entry;
      }
      temporary.clear();
      makeTemporaryFolders();
    }
    function readMainHeader(readNow) {
      var i = inBuffer.length - Utils.Constants.ENDHDR, max = Math.max(0, i - 65535), n = max, endStart = inBuffer.length, endOffset = -1, commentEnd = 0;
      const trailingSpace = typeof opts.trailingSpace === "boolean" ? opts.trailingSpace : false;
      if (trailingSpace) max = 0;
      for (i; i >= n; i--) {
        if (inBuffer[i] !== 80) continue;
        if (inBuffer.readUInt32LE(i) === Utils.Constants.ENDSIG) {
          endOffset = i;
          commentEnd = i;
          endStart = i + Utils.Constants.ENDHDR;
          n = i - Utils.Constants.END64HDR;
          continue;
        }
        if (inBuffer.readUInt32LE(i) === Utils.Constants.END64SIG) {
          n = max;
          continue;
        }
        if (inBuffer.readUInt32LE(i) === Utils.Constants.ZIP64SIG) {
          endOffset = i;
          endStart = i + Utils.readBigUInt64LE(inBuffer, i + Utils.Constants.ZIP64SIZE) + Utils.Constants.ZIP64LEAD;
          break;
        }
      }
      if (endOffset == -1) throw Utils.Errors.INVALID_FORMAT();
      mainHeader2.loadFromBinary(inBuffer.slice(endOffset, endStart));
      if (mainHeader2.commentLength) {
        _comment = inBuffer.slice(commentEnd + Utils.Constants.ENDHDR);
      }
      if (readNow) readEntries();
    }
    function sortEntries() {
      if (entryList.length > 1 && !noSort) {
        entryList.sort((a, b) => a.entryName.toLowerCase().localeCompare(b.entryName.toLowerCase()));
      }
    }
    return {
      /**
       * Returns an array of ZipEntry objects existent in the current opened archive
       * @return Array
       */
      get entries() {
        if (!loadedEntries) {
          readEntries();
        }
        return entryList.filter((e) => !temporary.has(e));
      },
      /**
       * Archive comment
       * @return {String}
       */
      get comment() {
        return decoder2.decode(_comment);
      },
      set comment(val) {
        _comment = Utils.toBuffer(val, decoder2.encode);
        mainHeader2.commentLength = _comment.length;
      },
      getEntryCount: function() {
        if (!loadedEntries) {
          return mainHeader2.diskEntries;
        }
        return entryList.length;
      },
      forEach: function(callback) {
        this.entries.forEach(callback);
      },
      /**
       * Returns a reference to the entry with the given name or null if entry is inexistent
       *
       * @param entryName
       * @return ZipEntry
       */
      getEntry: function(entryName) {
        if (!loadedEntries) {
          readEntries();
        }
        return entryTable[entryName] || null;
      },
      /**
       * Adds the given entry to the entry list
       *
       * @param entry
       */
      setEntry: function(entry) {
        if (!loadedEntries) {
          readEntries();
        }
        entryList.push(entry);
        entryTable[entry.entryName] = entry;
        mainHeader2.totalEntries = entryList.length;
      },
      /**
       * Removes the file with the given name from the entry list.
       *
       * If the entry is a directory, then all nested files and directories will be removed
       * @param entryName
       * @returns {void}
       */
      deleteFile: function(entryName, withsubfolders = true) {
        if (!loadedEntries) {
          readEntries();
        }
        const entry = entryTable[entryName];
        const list = this.getEntryChildren(entry, withsubfolders).map((child) => child.entryName);
        list.forEach(this.deleteEntry);
      },
      /**
       * Removes the entry with the given name from the entry list.
       *
       * @param {string} entryName
       * @returns {void}
       */
      deleteEntry: function(entryName) {
        if (!loadedEntries) {
          readEntries();
        }
        const entry = entryTable[entryName];
        const index = entryList.indexOf(entry);
        if (index >= 0) {
          entryList.splice(index, 1);
          delete entryTable[entryName];
          mainHeader2.totalEntries = entryList.length;
        }
      },
      /**
       *  Iterates and returns all nested files and directories of the given entry
       *
       * @param entry
       * @return Array
       */
      getEntryChildren: function(entry, subfolders = true) {
        if (!loadedEntries) {
          readEntries();
        }
        if (typeof entry === "object") {
          if (entry.isDirectory && subfolders) {
            const list = [];
            const name = entry.entryName;
            for (const zipEntry2 of entryList) {
              if (zipEntry2.entryName.startsWith(name)) {
                list.push(zipEntry2);
              }
            }
            return list;
          } else {
            return [entry];
          }
        }
        return [];
      },
      /**
       *  How many child elements entry has
       *
       * @param {ZipEntry} entry
       * @return {integer}
       */
      getChildCount: function(entry) {
        if (entry && entry.isDirectory) {
          const list = this.getEntryChildren(entry);
          return list.includes(entry) ? list.length - 1 : list.length;
        }
        return 0;
      },
      /**
       * Returns the zip file
       *
       * @return Buffer
       */
      compressToBuffer: function() {
        if (!loadedEntries) {
          readEntries();
        }
        sortEntries();
        const dataBlock = [];
        const headerBlocks = [];
        let totalSize = 0;
        let dindex = 0;
        mainHeader2.size = 0;
        mainHeader2.offset = 0;
        let totalEntries = 0;
        for (const entry of this.entries) {
          const compressedData = entry.getCompressedData();
          entry.header.offset = dindex;
          const localHeader = entry.packLocalHeader();
          const dataLength = localHeader.length + compressedData.length;
          dindex += dataLength;
          dataBlock.push(localHeader);
          dataBlock.push(compressedData);
          const centralHeader = entry.packCentralHeader();
          headerBlocks.push(centralHeader);
          mainHeader2.size += centralHeader.length;
          totalSize += dataLength + centralHeader.length;
          totalEntries++;
        }
        totalSize += mainHeader2.mainHeaderSize;
        mainHeader2.offset = dindex;
        mainHeader2.totalEntries = totalEntries;
        dindex = 0;
        const outBuffer = Buffer.alloc(totalSize);
        for (const content of dataBlock) {
          content.copy(outBuffer, dindex);
          dindex += content.length;
        }
        for (const content of headerBlocks) {
          content.copy(outBuffer, dindex);
          dindex += content.length;
        }
        const mh = mainHeader2.toBinary();
        if (_comment) {
          _comment.copy(mh, Utils.Constants.ENDHDR);
        }
        mh.copy(outBuffer, dindex);
        inBuffer = outBuffer;
        loadedEntries = false;
        return outBuffer;
      },
      toAsyncBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
        try {
          if (!loadedEntries) {
            readEntries();
          }
          sortEntries();
          const dataBlock = [];
          const centralHeaders = [];
          let totalSize = 0;
          let dindex = 0;
          let totalEntries = 0;
          mainHeader2.size = 0;
          mainHeader2.offset = 0;
          const compress2Buffer = function(entryLists) {
            if (entryLists.length > 0) {
              const entry = entryLists.shift();
              const name = entry.entryName + entry.extra.toString();
              if (onItemStart) onItemStart(name);
              entry.getCompressedDataAsync(function(compressedData) {
                if (onItemEnd) onItemEnd(name);
                entry.header.offset = dindex;
                const localHeader = entry.packLocalHeader();
                const dataLength = localHeader.length + compressedData.length;
                dindex += dataLength;
                dataBlock.push(localHeader);
                dataBlock.push(compressedData);
                const centalHeader = entry.packCentralHeader();
                centralHeaders.push(centalHeader);
                mainHeader2.size += centalHeader.length;
                totalSize += dataLength + centalHeader.length;
                totalEntries++;
                compress2Buffer(entryLists);
              });
            } else {
              totalSize += mainHeader2.mainHeaderSize;
              mainHeader2.offset = dindex;
              mainHeader2.totalEntries = totalEntries;
              dindex = 0;
              const outBuffer = Buffer.alloc(totalSize);
              dataBlock.forEach(function(content) {
                content.copy(outBuffer, dindex);
                dindex += content.length;
              });
              centralHeaders.forEach(function(content) {
                content.copy(outBuffer, dindex);
                dindex += content.length;
              });
              const mh = mainHeader2.toBinary();
              if (_comment) {
                _comment.copy(mh, Utils.Constants.ENDHDR);
              }
              mh.copy(outBuffer, dindex);
              inBuffer = outBuffer;
              loadedEntries = false;
              onSuccess(outBuffer);
            }
          };
          compress2Buffer(Array.from(this.entries));
        } catch (e) {
          onFail(e);
        }
      }
    };
  };
  return zipFile;
}
var admZip;
var hasRequiredAdmZip;
function requireAdmZip() {
  if (hasRequiredAdmZip) return admZip;
  hasRequiredAdmZip = 1;
  const Utils = requireUtil();
  const pth = path;
  const ZipEntry = requireZipEntry();
  const ZipFile = requireZipFile();
  const get_Bool = (...val) => Utils.findLast(val, (c) => typeof c === "boolean");
  const get_Str = (...val) => Utils.findLast(val, (c) => typeof c === "string");
  const get_Fun = (...val) => Utils.findLast(val, (c) => typeof c === "function");
  const defaultOptions = {
    // option "noSort" : if true it disables files sorting
    noSort: false,
    // read entries during load (initial loading may be slower)
    readEntries: false,
    // default method is none
    method: Utils.Constants.NONE,
    // file system
    fs: null
  };
  admZip = function(input, options) {
    let inBuffer = null;
    const opts = Object.assign(/* @__PURE__ */ Object.create(null), defaultOptions);
    if (input && "object" === typeof input) {
      if (!(input instanceof Uint8Array)) {
        Object.assign(opts, input);
        input = opts.input ? opts.input : void 0;
        if (opts.input) delete opts.input;
      }
      if (Buffer.isBuffer(input)) {
        inBuffer = input;
        opts.method = Utils.Constants.BUFFER;
        input = void 0;
      }
    }
    Object.assign(opts, options);
    const filetools = new Utils(opts);
    if (typeof opts.decoder !== "object" || typeof opts.decoder.encode !== "function" || typeof opts.decoder.decode !== "function") {
      opts.decoder = Utils.decoder;
    }
    if (input && "string" === typeof input) {
      if (filetools.fs.existsSync(input)) {
        opts.method = Utils.Constants.FILE;
        opts.filename = input;
        inBuffer = filetools.fs.readFileSync(input);
      } else {
        throw Utils.Errors.INVALID_FILENAME();
      }
    }
    const _zip = new ZipFile(inBuffer, opts);
    const { canonical, sanitize, zipnamefix } = Utils;
    function getEntry(entry) {
      if (entry && _zip) {
        var item;
        if (typeof entry === "string") item = _zip.getEntry(pth.posix.normalize(entry));
        if (typeof entry === "object" && typeof entry.entryName !== "undefined" && typeof entry.header !== "undefined") item = _zip.getEntry(entry.entryName);
        if (item) {
          return item;
        }
      }
      return null;
    }
    function fixPath(zipPath) {
      const { join, normalize, sep } = pth.posix;
      return join(".", normalize(sep + zipPath.split("\\").join(sep) + sep));
    }
    function filenameFilter(filterfn) {
      if (filterfn instanceof RegExp) {
        return /* @__PURE__ */ (function(rx) {
          return function(filename) {
            return rx.test(filename);
          };
        })(filterfn);
      } else if ("function" !== typeof filterfn) {
        return () => true;
      }
      return filterfn;
    }
    const relativePath = (local, entry) => {
      let lastChar = entry.slice(-1);
      lastChar = lastChar === filetools.sep ? filetools.sep : "";
      return pth.relative(local, entry) + lastChar;
    };
    return {
      /**
       * Extracts the given entry from the archive and returns the content as a Buffer object
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {Buffer|string} [pass] - password
       * @return Buffer or Null in case of error
       */
      readFile: function(entry, pass) {
        var item = getEntry(entry);
        return item && item.getData(pass) || null;
      },
      /**
       * Returns how many child elements has on entry (directories) on files it is always 0
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @returns {integer}
       */
      childCount: function(entry) {
        const item = getEntry(entry);
        if (item) {
          return _zip.getChildCount(item);
        }
      },
      /**
       * Asynchronous readFile
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       *
       * @return Buffer or Null in case of error
       */
      readFileAsync: function(entry, callback) {
        var item = getEntry(entry);
        if (item) {
          item.getDataAsync(callback);
        } else {
          callback(null, "getEntry failed for:" + entry);
        }
      },
      /**
       * Extracts the given entry from the archive and returns the content as plain text in the given encoding
       * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
       * @param {string} encoding - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsText: function(entry, encoding) {
        var item = getEntry(entry);
        if (item) {
          var data = item.getData();
          if (data && data.length) {
            return data.toString(encoding || "utf8");
          }
        }
        return "";
      },
      /**
       * Asynchronous readAsText
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       * @param {string} [encoding] - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsTextAsync: function(entry, callback, encoding) {
        var item = getEntry(entry);
        if (item) {
          item.getDataAsync(function(data, err) {
            if (err) {
              callback(data, err);
              return;
            }
            if (data && data.length) {
              callback(data.toString(encoding || "utf8"));
            } else {
              callback("");
            }
          });
        } else {
          callback("");
        }
      },
      /**
       * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
       *
       * @param {ZipEntry|string} entry
       * @returns {void}
       */
      deleteFile: function(entry, withsubfolders = true) {
        var item = getEntry(entry);
        if (item) {
          _zip.deleteFile(item.entryName, withsubfolders);
        }
      },
      /**
       * Remove the entry from the file or directory without affecting any nested entries
       *
       * @param {ZipEntry|string} entry
       * @returns {void}
       */
      deleteEntry: function(entry) {
        var item = getEntry(entry);
        if (item) {
          _zip.deleteEntry(item.entryName);
        }
      },
      /**
       * Adds a comment to the zip. The zip must be rewritten after adding the comment.
       *
       * @param {string} comment
       */
      addZipComment: function(comment) {
        _zip.comment = comment;
      },
      /**
       * Returns the zip comment
       *
       * @return String
       */
      getZipComment: function() {
        return _zip.comment || "";
      },
      /**
       * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
       * The comment cannot exceed 65535 characters in length
       *
       * @param {ZipEntry} entry
       * @param {string} comment
       */
      addZipEntryComment: function(entry, comment) {
        var item = getEntry(entry);
        if (item) {
          item.comment = comment;
        }
      },
      /**
       * Returns the comment of the specified entry
       *
       * @param {ZipEntry} entry
       * @return String
       */
      getZipEntryComment: function(entry) {
        var item = getEntry(entry);
        if (item) {
          return item.comment || "";
        }
        return "";
      },
      /**
       * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
       *
       * @param {ZipEntry} entry
       * @param {Buffer} content
       */
      updateFile: function(entry, content) {
        var item = getEntry(entry);
        if (item) {
          item.setData(content);
        }
      },
      /**
       * Adds a file from the disk to the archive
       *
       * @param {string} localPath File to add to zip
       * @param {string} [zipPath] Optional path inside the zip
       * @param {string} [zipName] Optional name for the file
       * @param {string} [comment] Optional file comment
       */
      addLocalFile: function(localPath2, zipPath, zipName, comment) {
        if (filetools.fs.existsSync(localPath2)) {
          zipPath = zipPath ? fixPath(zipPath) : "";
          const p = pth.win32.basename(pth.win32.normalize(localPath2));
          zipPath += zipName ? zipName : p;
          const _attr = filetools.fs.statSync(localPath2);
          const data = _attr.isFile() ? filetools.fs.readFileSync(localPath2) : Buffer.alloc(0);
          if (_attr.isDirectory()) zipPath += filetools.sep;
          this.addFile(zipPath, data, comment, _attr);
        } else {
          throw Utils.Errors.FILE_NOT_FOUND(localPath2);
        }
      },
      /**
       * Callback for showing if everything was done.
       *
       * @callback doneCallback
       * @param {Error} err - Error object
       * @param {boolean} done - was request fully completed
       */
      /**
       * Adds a file from the disk to the archive
       *
       * @param {(object|string)} options - options object, if it is string it us used as localPath.
       * @param {string} options.localPath - Local path to the file.
       * @param {string} [options.comment] - Optional file comment.
       * @param {string} [options.zipPath] - Optional path inside the zip
       * @param {string} [options.zipName] - Optional name for the file
       * @param {doneCallback} callback - The callback that handles the response.
       */
      addLocalFileAsync: function(options2, callback) {
        options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
        const localPath2 = pth.resolve(options2.localPath);
        const { comment } = options2;
        let { zipPath, zipName } = options2;
        const self = this;
        filetools.fs.stat(localPath2, function(err, stats) {
          if (err) return callback(err, false);
          zipPath = zipPath ? fixPath(zipPath) : "";
          const p = pth.win32.basename(pth.win32.normalize(localPath2));
          zipPath += zipName ? zipName : p;
          if (stats.isFile()) {
            filetools.fs.readFile(localPath2, function(err2, data) {
              if (err2) return callback(err2, false);
              self.addFile(zipPath, data, comment, stats);
              return setImmediate(callback, void 0, true);
            });
          } else if (stats.isDirectory()) {
            zipPath += filetools.sep;
            self.addFile(zipPath, Buffer.alloc(0), comment, stats);
            return setImmediate(callback, void 0, true);
          }
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - local path to the folder
       * @param {string} [zipPath] - optional path inside zip
       * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
       */
      addLocalFolder: function(localPath2, zipPath, filter) {
        filter = filenameFilter(filter);
        zipPath = zipPath ? fixPath(zipPath) : "";
        localPath2 = pth.normalize(localPath2);
        if (filetools.fs.existsSync(localPath2)) {
          const items = filetools.findFiles(localPath2);
          const self = this;
          if (items.length) {
            for (const filepath of items) {
              const p = pth.join(zipPath, relativePath(localPath2, filepath));
              if (filter(p)) {
                self.addLocalFile(filepath, pth.dirname(p));
              }
            }
          }
        } else {
          throw Utils.Errors.FILE_NOT_FOUND(localPath2);
        }
      },
      /**
       * Asynchronous addLocalFolder
       * @param {string} localPath
       * @param {callback} callback
       * @param {string} [zipPath] optional path inside zip
       * @param {RegExp|function} [filter] optional RegExp or Function if files match will
       *               be included.
       */
      addLocalFolderAsync: function(localPath2, callback, zipPath, filter) {
        filter = filenameFilter(filter);
        zipPath = zipPath ? fixPath(zipPath) : "";
        localPath2 = pth.normalize(localPath2);
        var self = this;
        filetools.fs.open(localPath2, "r", function(err) {
          if (err && err.code === "ENOENT") {
            callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath2));
          } else if (err) {
            callback(void 0, err);
          } else {
            var items = filetools.findFiles(localPath2);
            var i = -1;
            var next = function() {
              i += 1;
              if (i < items.length) {
                var filepath = items[i];
                var p = relativePath(localPath2, filepath).split("\\").join("/");
                p = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
                if (filter(p)) {
                  filetools.fs.stat(filepath, function(er0, stats) {
                    if (er0) callback(void 0, er0);
                    if (stats.isFile()) {
                      filetools.fs.readFile(filepath, function(er1, data) {
                        if (er1) {
                          callback(void 0, er1);
                        } else {
                          self.addFile(zipPath + p, data, "", stats);
                          next();
                        }
                      });
                    } else {
                      self.addFile(zipPath + p + "/", Buffer.alloc(0), "", stats);
                      next();
                    }
                  });
                } else {
                  process.nextTick(() => {
                    next();
                  });
                }
              } else {
                callback(true, void 0);
              }
            };
            next();
          }
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {object | string} options - options object, if it is string it us used as localPath.
       * @param {string} options.localPath - Local path to the folder.
       * @param {string} [options.zipPath] - optional path inside zip.
       * @param {RegExp|function} [options.filter] - optional RegExp or Function if files match will be included.
       * @param {function|string} [options.namefix] - optional function to help fix filename
       * @param {doneCallback} callback - The callback that handles the response.
       *
       */
      addLocalFolderAsync2: function(options2, callback) {
        const self = this;
        options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
        localPath = pth.resolve(fixPath(options2.localPath));
        let { zipPath, filter, namefix } = options2;
        if (filter instanceof RegExp) {
          filter = /* @__PURE__ */ (function(rx) {
            return function(filename) {
              return rx.test(filename);
            };
          })(filter);
        } else if ("function" !== typeof filter) {
          filter = function() {
            return true;
          };
        }
        zipPath = zipPath ? fixPath(zipPath) : "";
        if (namefix == "latin1") {
          namefix = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
        }
        if (typeof namefix !== "function") namefix = (str) => str;
        const relPathFix = (entry) => pth.join(zipPath, namefix(relativePath(localPath, entry)));
        const fileNameFix = (entry) => pth.win32.basename(pth.win32.normalize(namefix(entry)));
        filetools.fs.open(localPath, "r", function(err) {
          if (err && err.code === "ENOENT") {
            callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
          } else if (err) {
            callback(void 0, err);
          } else {
            filetools.findFilesAsync(localPath, function(err2, fileEntries) {
              if (err2) return callback(err2);
              fileEntries = fileEntries.filter((dir) => filter(relPathFix(dir)));
              if (!fileEntries.length) callback(void 0, false);
              setImmediate(
                fileEntries.reverse().reduce(function(next, entry) {
                  return function(err3, done) {
                    if (err3 || done === false) return setImmediate(next, err3, false);
                    self.addLocalFileAsync(
                      {
                        localPath: entry,
                        zipPath: pth.dirname(relPathFix(entry)),
                        zipName: fileNameFix(entry)
                      },
                      next
                    );
                  };
                }, callback)
              );
            });
          }
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - path where files will be extracted
       * @param {object} props - optional properties
       * @param {string} [props.zipPath] - optional path inside zip
       * @param {RegExp|function} [props.filter] - optional RegExp or Function if files match will be included.
       * @param {function|string} [props.namefix] - optional function to help fix filename
       */
      addLocalFolderPromise: function(localPath2, props) {
        return new Promise((resolve, reject) => {
          this.addLocalFolderAsync2(Object.assign({ localPath: localPath2 }, props), (err, done) => {
            if (err) reject(err);
            if (done) resolve(this);
          });
        });
      },
      /**
       * Allows you to create a entry (file or directory) in the zip file.
       * If you want to create a directory the entryName must end in / and a null buffer should be provided.
       * Comment and attributes are optional
       *
       * @param {string} entryName
       * @param {Buffer | string} content - file content as buffer or utf8 coded string
       * @param {string} [comment] - file comment
       * @param {number | object} [attr] - number as unix file permissions, object as filesystem Stats object
       */
      addFile: function(entryName, content, comment, attr) {
        entryName = zipnamefix(entryName);
        let entry = getEntry(entryName);
        const update = entry != null;
        if (!update) {
          entry = new ZipEntry(opts);
          entry.entryName = entryName;
        }
        entry.comment = comment || "";
        const isStat = "object" === typeof attr && attr instanceof filetools.fs.Stats;
        if (isStat) {
          entry.header.time = attr.mtime;
        }
        var fileattr = entry.isDirectory ? 16 : 0;
        let unix = entry.isDirectory ? 16384 : 32768;
        if (isStat) {
          unix |= 4095 & attr.mode;
        } else if ("number" === typeof attr) {
          unix |= 4095 & attr;
        } else {
          unix |= entry.isDirectory ? 493 : 420;
        }
        fileattr = (fileattr | unix << 16) >>> 0;
        entry.attr = fileattr;
        entry.setData(content);
        if (!update) _zip.setEntry(entry);
        return entry;
      },
      /**
       * Returns an array of ZipEntry objects representing the files and folders inside the archive
       *
       * @param {string} [password]
       * @returns Array
       */
      getEntries: function(password) {
        _zip.password = password;
        return _zip ? _zip.entries : [];
      },
      /**
       * Returns a ZipEntry object representing the file or folder specified by ``name``.
       *
       * @param {string} name
       * @return ZipEntry
       */
      getEntry: function(name) {
        return getEntry(name);
      },
      getEntryCount: function() {
        return _zip.getEntryCount();
      },
      forEach: function(callback) {
        return _zip.forEach(callback);
      },
      /**
       * Extracts the given entry to the given targetPath
       * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
       *
       * @param {string|ZipEntry} entry - ZipEntry object or String with the full path of the entry
       * @param {string} targetPath - Target folder where to write the file
       * @param {boolean} [maintainEntryPath=true] - If maintainEntryPath is true and the entry is inside a folder, the entry folder will be created in targetPath as well. Default is TRUE
       * @param {boolean} [overwrite=false] - If the file already exists at the target path, the file will be overwriten if this is true.
       * @param {boolean} [keepOriginalPermission=false] - The file will be set as the permission from the entry if this is true.
       * @param {string} [outFileName] - String If set will override the filename of the extracted file (Only works if the entry is a file)
       *
       * @return Boolean
       */
      extractEntryTo: function(entry, targetPath, maintainEntryPath, overwrite, keepOriginalPermission, outFileName) {
        overwrite = get_Bool(false, overwrite);
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        maintainEntryPath = get_Bool(true, maintainEntryPath);
        outFileName = get_Str(keepOriginalPermission, outFileName);
        var item = getEntry(entry);
        if (!item) {
          throw Utils.Errors.NO_ENTRY();
        }
        var entryName = canonical(item.entryName);
        var target = sanitize(targetPath, outFileName && !item.isDirectory ? outFileName : maintainEntryPath ? entryName : pth.basename(entryName));
        if (item.isDirectory) {
          var children = _zip.getEntryChildren(item);
          children.forEach(function(child) {
            if (child.isDirectory) return;
            var content2 = child.getData();
            if (!content2) {
              throw Utils.Errors.CANT_EXTRACT_FILE();
            }
            var name = canonical(child.entryName);
            var childName = sanitize(targetPath, maintainEntryPath ? name : pth.basename(name));
            const fileAttr2 = keepOriginalPermission ? child.header.fileAttr : void 0;
            filetools.writeFileTo(childName, content2, overwrite, fileAttr2);
          });
          return true;
        }
        var content = item.getData(_zip.password);
        if (!content) throw Utils.Errors.CANT_EXTRACT_FILE();
        if (filetools.fs.existsSync(target) && !overwrite) {
          throw Utils.Errors.CANT_OVERRIDE();
        }
        const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
        filetools.writeFileTo(target, content, overwrite, fileAttr);
        return true;
      },
      /**
       * Test the archive
       * @param {string} [pass]
       */
      test: function(pass) {
        if (!_zip) {
          return false;
        }
        for (var entry in _zip.entries) {
          try {
            if (entry.isDirectory) {
              continue;
            }
            var content = _zip.entries[entry].getData(pass);
            if (!content) {
              return false;
            }
          } catch (err) {
            return false;
          }
        }
        return true;
      },
      /**
       * Extracts the entire archive to the given location
       *
       * @param {string} targetPath Target location
       * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
       *                  Default is FALSE
       * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
       *                  Default is FALSE
       * @param {string|Buffer} [pass] password
       */
      extractAllTo: function(targetPath, overwrite, keepOriginalPermission, pass) {
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        pass = get_Str(keepOriginalPermission, pass);
        overwrite = get_Bool(false, overwrite);
        if (!_zip) throw Utils.Errors.NO_ZIP();
        _zip.entries.forEach(function(entry) {
          var entryName = sanitize(targetPath, canonical(entry.entryName));
          if (entry.isDirectory) {
            filetools.makeDir(entryName);
            return;
          }
          var content = entry.getData(pass);
          if (!content) {
            throw Utils.Errors.CANT_EXTRACT_FILE();
          }
          const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
          filetools.writeFileTo(entryName, content, overwrite, fileAttr);
          try {
            filetools.fs.utimesSync(entryName, entry.header.time, entry.header.time);
          } catch (err) {
            throw Utils.Errors.CANT_EXTRACT_FILE();
          }
        });
      },
      /**
       * Asynchronous extractAllTo
       *
       * @param {string} targetPath Target location
       * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
       *                  Default is FALSE
       * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
       *                  Default is FALSE
       * @param {function} callback The callback will be executed when all entries are extracted successfully or any error is thrown.
       */
      extractAllToAsync: function(targetPath, overwrite, keepOriginalPermission, callback) {
        callback = get_Fun(overwrite, keepOriginalPermission, callback);
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        overwrite = get_Bool(false, overwrite);
        if (!callback) {
          return new Promise((resolve, reject) => {
            this.extractAllToAsync(targetPath, overwrite, keepOriginalPermission, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this);
              }
            });
          });
        }
        if (!_zip) {
          callback(Utils.Errors.NO_ZIP());
          return;
        }
        targetPath = pth.resolve(targetPath);
        const getPath = (entry) => sanitize(targetPath, pth.normalize(canonical(entry.entryName)));
        const getError = (msg, file) => new Error(msg + ': "' + file + '"');
        const dirEntries = [];
        const fileEntries = [];
        _zip.entries.forEach((e) => {
          if (e.isDirectory) {
            dirEntries.push(e);
          } else {
            fileEntries.push(e);
          }
        });
        for (const entry of dirEntries) {
          const dirPath = getPath(entry);
          const dirAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
          try {
            filetools.makeDir(dirPath);
            if (dirAttr) filetools.fs.chmodSync(dirPath, dirAttr);
            filetools.fs.utimesSync(dirPath, entry.header.time, entry.header.time);
          } catch (er) {
            callback(getError("Unable to create folder", dirPath));
          }
        }
        fileEntries.reverse().reduce(function(next, entry) {
          return function(err) {
            if (err) {
              next(err);
            } else {
              const entryName = pth.normalize(canonical(entry.entryName));
              const filePath = sanitize(targetPath, entryName);
              entry.getDataAsync(function(content, err_1) {
                if (err_1) {
                  next(err_1);
                } else if (!content) {
                  next(Utils.Errors.CANT_EXTRACT_FILE());
                } else {
                  const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
                  filetools.writeFileToAsync(filePath, content, overwrite, fileAttr, function(succ) {
                    if (!succ) {
                      next(getError("Unable to write file", filePath));
                    }
                    filetools.fs.utimes(filePath, entry.header.time, entry.header.time, function(err_2) {
                      if (err_2) {
                        next(getError("Unable to set times", filePath));
                      } else {
                        next();
                      }
                    });
                  });
                }
              });
            }
          };
        }, callback)();
      },
      /**
       * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
       *
       * @param {string} targetFileName
       * @param {function} callback
       */
      writeZip: function(targetFileName, callback) {
        if (arguments.length === 1) {
          if (typeof targetFileName === "function") {
            callback = targetFileName;
            targetFileName = "";
          }
        }
        if (!targetFileName && opts.filename) {
          targetFileName = opts.filename;
        }
        if (!targetFileName) return;
        var zipData = _zip.compressToBuffer();
        if (zipData) {
          var ok = filetools.writeFileTo(targetFileName, zipData, true);
          if (typeof callback === "function") callback(!ok ? new Error("failed") : null, "");
        }
      },
      /**
      	         *
      	         * @param {string} targetFileName
      	         * @param {object} [props]
      	         * @param {boolean} [props.overwrite=true] If the file already exists at the target path, the file will be overwriten if this is true.
      	         * @param {boolean} [props.perm] The file will be set as the permission from the entry if this is true.
      
      	         * @returns {Promise<void>}
      	         */
      writeZipPromise: function(targetFileName, props) {
        const { overwrite, perm } = Object.assign({ overwrite: true }, props);
        return new Promise((resolve, reject) => {
          if (!targetFileName && opts.filename) targetFileName = opts.filename;
          if (!targetFileName) reject("ADM-ZIP: ZIP File Name Missing");
          this.toBufferPromise().then((zipData) => {
            const ret = (done) => done ? resolve(done) : reject("ADM-ZIP: Wasn't able to write zip file");
            filetools.writeFileToAsync(targetFileName, zipData, overwrite, perm, ret);
          }, reject);
        });
      },
      /**
       * @returns {Promise<Buffer>} A promise to the Buffer.
       */
      toBufferPromise: function() {
        return new Promise((resolve, reject) => {
          _zip.toAsyncBuffer(resolve, reject);
        });
      },
      /**
       * Returns the content of the entire zip file as a Buffer object
       *
       * @prop {function} [onSuccess]
       * @prop {function} [onFail]
       * @prop {function} [onItemStart]
       * @prop {function} [onItemEnd]
       * @returns {Buffer}
       */
      toBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
        if (typeof onSuccess === "function") {
          _zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
          return null;
        }
        return _zip.compressToBuffer();
      }
    };
  };
  return admZip;
}
var admZipExports = requireAdmZip();
const AdmZip = /* @__PURE__ */ getDefaultExportFromCjs(admZipExports);
const readEnvFile = () => {
  const env = {};
  const possibleEnvPaths = [
    // Production paths (outside app.asar)
    path.join(process.resourcesPath || "", "app", ".env"),
    path.join(process.resourcesPath || "", ".env"),
    // Development paths
    path.join(process.cwd(), ".env"),
    path.join(__dirname, "..", ".env"),
    path.join(__dirname, "..", "..", ".env"),
    // Portable executable path (Windows)
    path.join(path.dirname(process.execPath), ".env")
  ];
  try {
    const electron2 = require("electron");
    const app = electron2.app || electron2.default?.app;
    if (app && typeof app.getAppPath === "function") {
      try {
        const appPath = app.getAppPath();
        if (appPath) {
          possibleEnvPaths.push(path.join(appPath, ".env"));
          possibleEnvPaths.push(path.join(path.dirname(appPath), ".env"));
          possibleEnvPaths.push(path.join(path.dirname(appPath), "..", ".env"));
        }
      } catch {
      }
    }
  } catch {
  }
  for (const envPath of possibleEnvPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...valueParts] = trimmed.split("=");
            if (key && valueParts.length > 0) {
              const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
              env[key.trim()] = value;
            }
          }
        });
        console.log(`[Electron Config] Loaded .env from: ${envPath}`);
        break;
      }
    } catch (error) {
    }
  }
  return env;
};
const getApiBaseUrl = () => {
  let envUrl = process.env.VITE_API_URL;
  if (!envUrl) {
    const envFile = readEnvFile();
    envUrl = envFile.VITE_API_URL;
  }
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:7240";
  }
  console.warn(
    "⚠️  VITE_API_URL is not configured in Electron main process.\nUsing default production server: http://5.188.119.206:7240\nPlease set VITE_API_URL in .env file or pass as environment variable.\nExample: VITE_API_URL=http://your-server.com:7240"
  );
  return "http://5.188.119.206:7240";
};
const getWebSocketUrl = () => {
  let envWsUrl = process.env.VITE_WS_URL;
  if (!envWsUrl) {
    const envFile = readEnvFile();
    envWsUrl = envFile.VITE_WS_URL;
  }
  if (envWsUrl) {
    return envWsUrl.replace(/\/$/, "");
  }
  const apiUrl = getApiBaseUrl();
  try {
    const url = new URL(apiUrl);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}/ws`;
  } catch {
    return "ws://5.188.119.206/ws";
  }
};
const getDevServerUrl = () => {
  const envDevUrl = process.env.VITE_DEV_SERVER_URL;
  if (envDevUrl) {
    return envDevUrl.replace(/\/$/, "");
  }
  return "http://localhost:5173";
};
const ELECTRON_CONFIG = {
  apiUrl: getApiBaseUrl(),
  wsUrl: getWebSocketUrl(),
  devServerUrl: getDevServerUrl(),
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production"
};
console.log("[Electron Config]", {
  apiUrl: ELECTRON_CONFIG.apiUrl,
  wsUrl: ELECTRON_CONFIG.wsUrl,
  devServerUrl: ELECTRON_CONFIG.devServerUrl,
  isDevelopment: ELECTRON_CONFIG.isDevelopment,
  isProduction: ELECTRON_CONFIG.isProduction,
  env: {
    VITE_API_URL: process.env.VITE_API_URL || "NOT SET",
    VITE_WS_URL: process.env.VITE_WS_URL || "NOT SET"
  }
});
let mainWindow = null;
let tray = null;
const activeDownloads = /* @__PURE__ */ new Map();
const isDevelopment = process.env.NODE_ENV === "development";
if (isDevelopment) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}
async function logErrorToBackend(error, context) {
  try {
    const errorData = JSON.stringify({
      errorType: "ELECTRON_ERROR",
      errorMessage: error.message || String(error),
      stackTrace: error.stack || null,
      component: context?.component || "ElectronMain",
      action: context?.action || "unhandledError",
      os: process.platform,
      osVersion: os.release(),
      launcherVersion: electron.app.getVersion()
    });
    const apiUrl = ELECTRON_CONFIG.apiUrl;
    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      port: parseInt(url.port) || 7240,
      path: "/api/crashes/launcher-errors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(errorData)
      },
      timeout: 2e3
      // 2 second timeout
    };
    const req = http.request(options, () => {
    });
    req.on("error", () => {
    });
    req.write(errorData);
    req.end();
  } catch (logError) {
    console.error("[ErrorLogger] Failed to log error to backend:", logError);
  }
}
process.on("uncaughtException", (error) => {
  console.error("[Electron] Uncaught Exception:", error);
  logErrorToBackend(error, { component: "ElectronMain", action: "uncaughtException" });
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Electron] Unhandled Rejection:", reason);
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logErrorToBackend(error, { component: "ElectronMain", action: "unhandledRejection" });
});
function stopAllDownloads() {
  console.log(`Stopping ${activeDownloads.size} active downloads...`);
  activeDownloads.forEach((download, id) => {
    try {
      download.request.destroy();
      download.writer.destroy();
      if (fs.existsSync(download.destPath)) {
        fs.unlinkSync(download.destPath);
      }
    } catch (error) {
      console.error(`Error stopping download ${id}:`, error);
    }
  });
  activeDownloads.clear();
}
function createTray() {
  if (tray) {
    return;
  }
  try {
    const appDir = getAppDir();
    const possibleIconPaths = [
      path.join(appDir, "assets", "icon.png"),
      path.join(appDir, "icon.png"),
      path.join(process.cwd(), "assets", "icon.png"),
      path.join(process.cwd(), "icon.png")
    ];
    let iconPath = null;
    for (const possiblePath of possibleIconPaths) {
      if (fs.existsSync(possiblePath)) {
        iconPath = possiblePath;
        break;
      }
    }
    if (iconPath) {
      tray = new electron.Tray(iconPath);
    } else {
      const size = 16;
      const buffer = Buffer.alloc(size * size * 4);
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 20;
        buffer[i + 1] = 20;
        buffer[i + 2] = 20;
        buffer[i + 3] = 255;
      }
      const drawPixel = (x, y) => {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const idx = (y * size + x) * 4;
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
        }
      };
      for (let y = 4; y < 12; y++) {
        drawPixel(3, y);
        drawPixel(12, y);
        if (y < 8) {
          drawPixel(3 + (y - 4), y);
          drawPixel(12 - (y - 4), y);
        }
      }
      const img = electron.nativeImage.createFromBuffer(buffer, { width: size, height: size });
      tray = new electron.Tray(img);
    }
    const contextMenu = electron.Menu.buildFromTemplate([
      {
        label: "Show Launcher",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        }
      },
      {
        label: "Quit",
        click: () => {
          console.log("[Tray] Quit requested - closing all windows and exiting...");
          stopAllDownloads();
          if (mainWindow) {
            mainWindow.removeAllListeners("close");
            mainWindow.destroy();
            mainWindow = null;
          }
          if (tray) {
            tray.destroy();
            tray = null;
          }
          setTimeout(() => {
            electron.app.exit(0);
          }, 100);
        }
      }
    ]);
    tray.setToolTip("Modern Launcher");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      } else {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Failed to create tray:", error);
  }
}
function getAppDir() {
  if (isDevelopment) {
    return process.cwd();
  } else {
    const appPath = electron.app.getAppPath();
    console.log("App path:", appPath);
    console.log("__dirname:", __dirname);
    console.log("process.resourcesPath:", process.resourcesPath);
    return appPath;
  }
}
function createWindow() {
  const appDir = getAppDir();
  let preloadPath;
  if (isDevelopment) {
    preloadPath = path.join(appDir, "dist-electron", "preload.js");
  } else {
    const possiblePreloadPaths = [
      path.join(__dirname, "preload.js"),
      // Primary: dist-electron/preload.js
      path.join(appDir, "dist-electron", "preload.js"),
      // Alternative 1
      path.join(appDir, "preload.js"),
      // Alternative 2
      path.join(process.resourcesPath, "app", "dist-electron", "preload.js"),
      // Alternative 3
      path.join(process.resourcesPath, "app.asar.unpacked", "preload.js")
      // Alternative 4
    ];
    preloadPath = possiblePreloadPaths.find((p) => fs.existsSync(p)) || possiblePreloadPaths[0];
    console.log("Using preload path:", preloadPath);
    console.log("Preload exists:", fs.existsSync(preloadPath));
  }
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: "#0a0a0a",
    // Dark background to avoid white flash
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Required for preload scripts
      // Disable webSecurity in production to allow file:// protocol to make HTTP requests
      // This is safe because we control the content and use contextIsolation
      webSecurity: isDevelopment
      // Only enable in development
    },
    show: false
    // Don't show until ready
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  if (isDevelopment) {
    const devServerUrl = ELECTRON_CONFIG.devServerUrl;
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(appDir, "dist", "index.html");
    console.log("Production mode - Loading index.html");
    console.log("App dir:", appDir);
    console.log("Index path:", indexPath);
    console.log("File exists:", fs.existsSync(indexPath));
    mainWindow.loadFile(indexPath).catch((error) => {
      console.error("Failed to load index.html:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      const altPaths = [
        path.join(__dirname, "..", "dist", "index.html"),
        path.join(process.resourcesPath, "app", "dist", "index.html")
      ];
      let fallbackLoaded = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log("Trying alternative path:", altPath);
          mainWindow.loadFile(altPath).catch((altError) => {
            console.error("Alternative path also failed:", altError);
          });
          fallbackLoaded = true;
          break;
        }
      }
      if (!fallbackLoaded) {
        const fileUrl = path.resolve(indexPath).replace(/\\/g, "/");
        const url = `file:///${fileUrl}`;
        console.log("Trying URL load:", url);
        mainWindow.loadURL(url).catch((urlError) => {
          console.error("URL load also failed:", urlError);
          if (process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
            mainWindow?.webContents.openDevTools();
          }
        });
      }
    });
  }
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.error("❌ Page failed to load:", { errorCode, errorDescription, validatedURL });
    console.error("Error code:", errorCode);
    console.error("Error description:", errorDescription);
    console.error("Validated URL:", validatedURL);
    if (isDevelopment || process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
      mainWindow?.webContents.openDevTools();
    }
    mainWindow?.webContents.send("app:error", `Failed to load page: ${errorDescription}`);
  });
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("✅ Page loaded successfully");
    const url = mainWindow?.webContents.getURL();
    console.log("Current URL:", url);
    if (!isDevelopment) {
      mainWindow?.webContents.openDevTools();
    }
  });
  mainWindow.webContents.on("dom-ready", () => {
    console.log("✅ DOM is ready");
  });
  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    const levelNames = ["log", "warn", "info", "error"];
    const levelName = levelNames[level] || "unknown";
    console.log(`[Renderer ${levelName}]:`, message);
    if (level === 3) {
      console.error("Renderer error:", { message, line, sourceId });
    }
  });
  mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    if (details.url.includes("/api/") || details.url.includes("5.188.119.206")) {
      console.log("[Network Request]", {
        method: details.method,
        url: details.url,
        resourceType: details.resourceType,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    callback({});
  });
  mainWindow.webContents.session.webRequest.onErrorOccurred((details) => {
    if (details.url.includes("/api/") || details.url.includes("5.188.119.206")) {
      console.error("[Network Error]", {
        url: details.url,
        error: details.error,
        resourceType: details.resourceType,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  mainWindow.webContents.session.webRequest.onCompleted((details) => {
    if (details.url.includes("/api/") || details.url.includes("5.188.119.206")) {
      console.log("[Network Response]", {
        method: details.method,
        url: details.url,
        statusCode: details.statusCode,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.on("close", (event) => {
    if (tray && process.platform !== "darwin") {
      event.preventDefault();
      mainWindow?.hide();
    } else {
      stopAllDownloads();
      if (mainWindow) {
        mainWindow.destroy();
        mainWindow = null;
      }
    }
  });
  mainWindow.on("minimize", () => {
  });
}
const defaultUserDataPath = electron.app.getPath("userData");
const customUserDataPath = defaultUserDataPath.replace(/Modern Launcher/g, "Modern-Launcher");
if (customUserDataPath !== defaultUserDataPath) {
  electron.app.setPath("userData", customUserDataPath);
  console.log(`[App] Set custom userData path: ${customUserDataPath} (original: ${defaultUserDataPath})`);
}
electron.app.on("session-created", (session) => {
  session.webRequest.onHeadersReceived((details, callback) => {
    if (!isDevelopment) {
      callback({
        responseHeaders: {
          ...details.responseHeaders
        }
      });
      return;
    }
    if (isDevelopment) {
      const apiHost = (() => {
        try {
          const url = new URL(ELECTRON_CONFIG.apiUrl);
          const host = url.host;
          console.log("[CSP] Using API host:", host, "from URL:", ELECTRON_CONFIG.apiUrl);
          return host;
        } catch (error) {
          console.error("[CSP] Failed to parse API URL:", ELECTRON_CONFIG.apiUrl, error);
          return "5.188.119.206:7240";
        }
      })();
      const wsHost = (() => {
        try {
          const wsUrl = ELECTRON_CONFIG.wsUrl;
          const url = new URL(wsUrl);
          const host = url.host;
          console.log("[CSP] Using WebSocket host:", host, "from URL:", wsUrl);
          return host;
        } catch (error) {
          console.error("[CSP] Failed to parse WebSocket URL:", ELECTRON_CONFIG.wsUrl, error);
          const [hostname2, port2] = apiHost.split(":");
          return port2 ? `${hostname2}:${port2}` : hostname2;
        }
      })();
      const [hostname, port] = apiHost.split(":");
      const hostPattern = port ? `${hostname}:${port}` : hostname;
      const [wsHostname, wsPort] = wsHost.split(":");
      const wsHostPattern = wsPort ? `${wsHostname}:${wsPort}` : wsHostname;
      const connectSrc = `'self' http://localhost:* http://${hostPattern} http://${hostname}:* ws://localhost:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* wss://localhost:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:*`;
      const scriptSrc = `'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://${hostPattern} http://${hostname}:*`;
      const defaultSrc = `'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* http://${hostPattern} http://${hostname}:* ws://localhost:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* wss://localhost:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:*`;
      if (!session._cspLogged) {
        console.log("[CSP] Content Security Policy configured for development:", {
          apiHost,
          hostname,
          port,
          connectSrc
        });
        session._cspLogged = true;
      }
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src " + defaultSrc + "; script-src " + scriptSrc + "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src " + connectSrc + ";"
          ]
        }
      });
    }
  });
});
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log("Another instance is already running. Exiting...");
  electron.app.quit();
  process.exit(0);
} else {
  electron.app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
  electron.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron.app.on("activate", () => {
      if (electron.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  });
  electron.app.on("window-all-closed", () => {
    if (tray) {
      return;
    }
    if (process.platform !== "darwin") {
      stopAllDownloads();
      electron.app.quit();
    }
  });
}
electron.app.on("before-quit", () => {
  stopAllDownloads();
});
electron.ipcMain.on("window:minimize", () => {
  mainWindow?.minimize();
});
electron.ipcMain.on("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
electron.ipcMain.on("window:close", () => {
  stopAllDownloads();
  mainWindow?.close();
});
electron.ipcMain.on("window:minimizeToTray", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});
function findJarFiles(dir) {
  const jars = [];
  try {
    if (!fs.existsSync(dir)) {
      return jars;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        jars.push(...findJarFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".jar")) {
        jars.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  return jars;
}
function getPlatformFromJarName(jarName) {
  const name = jarName.toLowerCase();
  if (name.includes("natives-linux")) {
    return "linux";
  } else if (name.includes("natives-windows") || name.includes("natives-win")) {
    return "windows";
  } else if (name.includes("natives-macos") || name.includes("natives-osx") || name.includes("natives-mac")) {
    return "macos";
  }
  return null;
}
async function extractNativesFromJar(jarPath, outputDir) {
  return new Promise((resolve, reject) => {
    try {
      const jarName = path.basename(jarPath);
      const platform = getPlatformFromJarName(jarName);
      const targetDir = platform ? path.join(outputDir, platform) : outputDir;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const zip = new AdmZip(jarPath);
      const entries = zip.getEntries();
      const nativeFiles = [];
      for (const entry of entries) {
        if (!entry.isDirectory) {
          const name = entry.entryName;
          const ext = path.extname(name).toLowerCase();
          if (ext === ".dll" || ext === ".so" || ext === ".dylib") {
            nativeFiles.push({ entry, name: path.basename(name) });
          }
        }
      }
      if (nativeFiles.length === 0) {
        resolve();
        return;
      }
      for (const { entry, name } of nativeFiles) {
        const outputPath = path.join(targetDir, name);
        try {
          const data = entry.getData();
          fs.writeFileSync(outputPath, data);
        } catch (error) {
          console.warn(`Failed to extract ${name} from ${jarPath}:`, error.message);
        }
      }
      resolve();
    } catch (error) {
      const jarName = path.basename(jarPath);
      const platform = getPlatformFromJarName(jarName);
      const targetDir = platform ? path.join(outputDir, platform) : outputDir;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const isWindows = process.platform === "win32";
      const unzipCmd = isWindows ? "jar xf" : "unzip -o";
      child_process.exec(`${unzipCmd} "${jarPath}" -d "${targetDir}"`, (err) => {
        if (err) {
          console.warn(`Failed to extract natives from ${jarPath}:`, err.message);
          resolve();
        } else {
          resolve();
        }
      });
    }
  });
}
async function extractAllNatives(librariesDir, clientDir) {
  const nativesDir = path.join(librariesDir, "..", "natives");
  if (fs.existsSync(nativesDir)) {
    const files = fs.readdirSync(nativesDir);
    if (files.length > 0) {
      console.log(`Native libraries already extracted to: ${nativesDir}`);
      return nativesDir;
    }
  }
  const nativesJars = [];
  function findNativesJars(dir) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".jar")) {
          if (entry.name.toLowerCase().includes("natives")) {
            nativesJars.push(fullPath);
          }
        } else if (entry.isDirectory()) {
          findNativesJars(fullPath);
        }
      }
    } catch (error) {
    }
  }
  findNativesJars(librariesDir);
  if (nativesJars.length === 0) {
    console.warn(`No natives JAR files found in ${librariesDir}`);
    return nativesDir;
  }
  console.log(`Found ${nativesJars.length} natives JAR files, extracting...`);
  if (!fs.existsSync(nativesDir)) {
    fs.mkdirSync(nativesDir, { recursive: true });
  }
  for (const jarPath of nativesJars) {
    try {
      await extractNativesFromJar(jarPath, nativesDir);
      console.log(`Extracted natives from: ${path.basename(jarPath)}`);
    } catch (error) {
      console.warn(`Failed to extract natives from ${jarPath}:`, error.message);
    }
  }
  return nativesDir;
}
function findNativeLibDirs(librariesDir) {
  const nativeDirs = [];
  const visited = /* @__PURE__ */ new Set();
  const currentPlatform = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux";
  const extractedNativesDir = path.join(librariesDir, "..", "natives");
  if (fs.existsSync(extractedNativesDir)) {
    const platformNativesDir = path.join(extractedNativesDir, currentPlatform);
    if (fs.existsSync(platformNativesDir)) {
      const files = fs.readdirSync(platformNativesDir);
      if (files.length > 0) {
        nativeDirs.push(platformNativesDir);
        console.log(`Using platform-specific natives: ${platformNativesDir}`);
      }
    } else {
      const files = fs.readdirSync(extractedNativesDir);
      if (files.length > 0) {
        const hasPlatformFiles = files.some((file) => {
          const ext = path.extname(file).toLowerCase();
          const isPlatformFile = currentPlatform === "windows" && ext === ".dll" || currentPlatform === "linux" && ext === ".so" || currentPlatform === "macos" && ext === ".dylib";
          return isPlatformFile;
        });
        if (hasPlatformFiles) {
          nativeDirs.push(extractedNativesDir);
          console.log(`Using legacy natives directory: ${extractedNativesDir}`);
        }
      }
    }
  }
  function searchDir(dir) {
    if (visited.has(dir) || !fs.existsSync(dir)) {
      return;
    }
    visited.add(dir);
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "natives") {
            nativeDirs.push(fullPath);
            continue;
          }
          searchDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === ".dll" || ext === ".so" || ext === ".dylib") {
            if (!nativeDirs.includes(dir)) {
              nativeDirs.push(dir);
            }
          }
        }
      }
    } catch (error) {
    }
  }
  searchDir(librariesDir);
  return Array.from(new Set(nativeDirs));
}
function findUpdatesDir() {
  if (isDevelopment) {
    const cwdUpdates = path.resolve(process.cwd(), "updates");
    if (fs.existsSync(cwdUpdates)) {
      console.log("Found updates in process.cwd():", cwdUpdates);
      return cwdUpdates;
    }
    const backendUpdates = path.resolve(process.cwd(), "packages", "backend", "updates");
    if (fs.existsSync(backendUpdates)) {
      console.log("Found updates in packages/backend/updates:", backendUpdates);
      return backendUpdates;
    }
    const appDir = getAppDir();
    let currentDir = appDir;
    const maxDepth = 10;
    let depth = 0;
    while (depth < maxDepth && currentDir !== path.dirname(currentDir)) {
      const packagesDir = path.join(currentDir, "packages");
      const updatesPath = path.join(currentDir, "updates");
      if (fs.existsSync(packagesDir) && fs.existsSync(updatesPath)) {
        console.log("Found updates in project root:", updatesPath);
        return path.resolve(updatesPath);
      }
      currentDir = path.dirname(currentDir);
      depth++;
    }
  }
  try {
    const appDataPath = electron.app.getPath("appData");
    const launcherDataDir = path.join(appDataPath, "Modern-Launcher");
    const updatesDir = path.join(launcherDataDir, "updates");
    if (!fs.existsSync(launcherDataDir)) {
      fs.mkdirSync(launcherDataDir, { recursive: true });
      console.log("Created launcher data directory:", launcherDataDir);
    }
    if (!fs.existsSync(updatesDir)) {
      fs.mkdirSync(updatesDir, { recursive: true });
      console.log("Created updates directory:", updatesDir);
    }
    console.log("Using updates directory in AppData/Roaming:", updatesDir);
    return updatesDir;
  } catch (error) {
    console.warn("Could not create updates directory in AppData:", error);
  }
  try {
    const appPath = electron.app.getAppPath();
    let appDir = path.dirname(appPath);
    for (let i = 0; i < 5; i++) {
      const appUpdates = path.join(appDir, "updates");
      if (fs.existsSync(appUpdates)) {
        console.log("Found updates relative to app path:", appUpdates);
        return path.resolve(appUpdates);
      }
      appDir = path.dirname(appDir);
    }
  } catch (error) {
    console.warn("Could not get app path:", error);
  }
  const defaultPath = path.resolve(process.cwd(), "updates");
  console.log("Using default updates path:", defaultPath);
  return defaultPath;
}
function detectConnectionIssueType(message) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("connection refused") || lowerMessage.includes("connection.*refused")) {
    return "CONNECTION_REFUSED";
  }
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "CONNECTION_TIMEOUT";
  }
  if (lowerMessage.includes("authentication") || lowerMessage.includes("auth")) {
    return "AUTHENTICATION_FAILED";
  }
  if (lowerMessage.includes("server full") || lowerMessage.includes("server.*full")) {
    return "SERVER_FULL";
  }
  if (lowerMessage.includes("version") && lowerMessage.includes("mismatch")) {
    return "VERSION_MISMATCH";
  }
  if (lowerMessage.includes("network") || lowerMessage.includes("network.*error")) {
    return "NETWORK_ERROR";
  }
  return "UNKNOWN";
}
function findJavaInstallations() {
  const found = [];
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";
  const isLinux = process.platform === "linux";
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const javaExe = isWindows ? path.join(javaHome, "bin", "java.exe") : path.join(javaHome, "bin", "java");
    if (fs.existsSync(javaExe)) {
      found.push(javaExe);
    }
  }
  try {
    child_process.execSync("java -version", { timeout: 2e3, stdio: "pipe" });
    found.push("java");
  } catch {
  }
  if (isWindows) {
    const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    const standardPaths = [
      path.join(programFiles, "Java"),
      path.join(programFilesX86, "Java"),
      path.join(process.env["LOCALAPPDATA"] || "", "Programs", "Java"),
      "C:\\Program Files\\Eclipse Adoptium",
      "C:\\Program Files\\Eclipse Foundation",
      "C:\\Program Files\\Microsoft",
      "C:\\Program Files\\OpenJDK"
    ];
    for (const basePath of standardPaths) {
      if (!fs.existsSync(basePath)) continue;
      try {
        const entries = fs.readdirSync(basePath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const javaExe = path.join(basePath, entry.name, "bin", "java.exe");
            if (fs.existsSync(javaExe)) {
              found.push(javaExe);
            }
          }
        }
      } catch (error) {
      }
    }
    try {
      const regOutput = child_process.execSync('reg query "HKLM\\SOFTWARE\\JavaSoft\\Java Runtime Environment" /s /v JavaHome 2>nul', {
        encoding: "utf-8",
        timeout: 3e3,
        stdio: "pipe"
      });
      const javaHomeMatches = regOutput.match(/JavaHome\s+REG_SZ\s+(.+)/g);
      if (javaHomeMatches) {
        for (const match of javaHomeMatches) {
          const javaHomePath = match.replace(/JavaHome\s+REG_SZ\s+/, "").trim();
          const javaExe = path.join(javaHomePath, "bin", "java.exe");
          if (fs.existsSync(javaExe) && !found.includes(javaExe)) {
            found.push(javaExe);
          }
        }
      }
    } catch {
    }
  }
  if (isMac) {
    const macPaths = [
      "/Library/Java/JavaVirtualMachines",
      "/System/Library/Java/JavaVirtualMachines",
      "/usr/libexec/java_home"
    ];
    for (const basePath of macPaths) {
      if (fs.existsSync(basePath)) {
        try {
          const entries = fs.readdirSync(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const javaExe = path.join(basePath, entry.name, "Contents", "Home", "bin", "java");
              if (fs.existsSync(javaExe)) {
                found.push(javaExe);
              }
            }
          }
        } catch {
        }
      }
    }
    try {
      const javaHomeOutput = child_process.execSync("/usr/libexec/java_home -V", {
        timeout: 2e3,
        stdio: "pipe",
        encoding: "utf-8"
      });
      const javaHomePaths = javaHomeOutput.match(/\/Library\/Java\/JavaVirtualMachines\/[^\s]+/g);
      if (javaHomePaths) {
        for (const javaHomePath of javaHomePaths) {
          const javaExe = path.join(javaHomePath, "Contents", "Home", "bin", "java");
          if (fs.existsSync(javaExe) && !found.includes(javaExe)) {
            found.push(javaExe);
          }
        }
      }
    } catch {
    }
  }
  if (isLinux) {
    const linuxPaths = [
      "/usr/lib/jvm",
      "/usr/java",
      "/opt/java",
      "/usr/local/java"
    ];
    for (const basePath of linuxPaths) {
      if (fs.existsSync(basePath)) {
        try {
          const entries = fs.readdirSync(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const javaExe = path.join(basePath, entry.name, "bin", "java");
              if (fs.existsSync(javaExe) && !found.includes(javaExe)) {
                found.push(javaExe);
              }
            }
          }
        } catch {
        }
      }
    }
  }
  return Array.from(new Set(found));
}
function getJavaVersion(javaPath) {
  try {
    const output = child_process.execSync(`"${javaPath}" -version 2>&1`, {
      timeout: 5e3,
      encoding: "utf-8",
      stdio: "pipe"
    });
    const versionMatch = output.match(/version\s+"?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:_(\d+))?"?/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1], 10);
      const minor = versionMatch[2] ? parseInt(versionMatch[2], 10) : 0;
      const patch = versionMatch[3] ? parseInt(versionMatch[3], 10) : 0;
      const build = versionMatch[4] ? parseInt(versionMatch[4], 10) : 0;
      const actualMajor = major === 1 && minor > 0 ? minor : major;
      return {
        version: `${actualMajor}.${patch || 0}`,
        major: actualMajor,
        full: output.split("\n")[0] || output
      };
    }
    return null;
  } catch (error) {
    console.error(`Failed to get Java version from ${javaPath}:`, error);
    return null;
  }
}
function checkJavaVersion(javaPath, requiredVersion) {
  const versionInfo = getJavaVersion(javaPath);
  if (!versionInfo) {
    return {
      valid: false,
      requiredVersion,
      error: `Failed to determine Java version from ${javaPath}`
    };
  }
  const requiredMajor = parseInt(requiredVersion, 10);
  const isValid = versionInfo.major >= requiredMajor;
  return {
    valid: isValid,
    currentVersion: versionInfo.version,
    requiredVersion,
    error: isValid ? void 0 : `Java ${versionInfo.major} is installed, but Java ${requiredMajor} or higher is required`
  };
}
electron.ipcMain.handle("launcher:launch", async (event, args) => {
  const { javaPath, jvmArgs, mainClass, classPath, gameArgs, workingDir, version, clientDirectory, jvmVersion, profileId, serverAddress, serverPort, userId, username } = args;
  try {
    const updatesDir = findUpdatesDir();
    console.log("Updates directory:", updatesDir);
    const clientDir = clientDirectory || version;
    console.log(`Using client directory: ${clientDir} (version: ${version})`);
    const resolvedWorkingDir = path.isAbsolute(workingDir) ? workingDir : path.resolve(process.cwd(), workingDir);
    const resolvedClassPath = [];
    const hasModLauncher = classPath.some(
      (cp) => cp.includes("modlauncher") || cp.includes("ModLauncher") || cp.includes("bootstraplauncher")
    );
    if (hasModLauncher && jvmVersion === "8") {
      console.warn("[Launch] ⚠️  WARNING: ModLauncher detected in classpath, but Java 8 is required. ModLauncher requires Java 16+. This may cause UnsupportedClassVersionError.");
      console.warn("[Launch] Consider using Java 16+ or check if the client uses the correct Forge version for Minecraft 1.12.2.");
    }
    const hasLibrariesEntry = classPath.includes("libraries");
    let librariesDir = path.join(updatesDir, clientDir, "libraries");
    if (!fs.existsSync(librariesDir)) {
      librariesDir = path.join(updatesDir, version, "libraries");
    }
    for (const cp of classPath) {
      if (cp === "client.jar") {
        let clientJar2 = path.join(updatesDir, clientDir, "client.jar");
        if (!fs.existsSync(clientJar2)) {
          clientJar2 = path.join(resolvedWorkingDir, clientDir, "client.jar");
        }
        if (!fs.existsSync(clientJar2)) {
          clientJar2 = path.join(updatesDir, version, "client.jar");
        }
        if (!fs.existsSync(clientJar2)) {
          clientJar2 = path.join(resolvedWorkingDir, version, "client.jar");
        }
        if (!fs.existsSync(clientJar2)) {
          return {
            success: false,
            error: `Client JAR not found. Searched in:
- ${path.join(updatesDir, clientDir, "client.jar")}
- ${path.join(updatesDir, version, "client.jar")}
- ${path.join(resolvedWorkingDir, clientDir, "client.jar")}
- ${path.join(resolvedWorkingDir, version, "client.jar")}

Please download Minecraft files first.`
          };
        }
        resolvedClassPath.push(clientJar2);
      } else if (cp === "libraries") {
        let librariesDir2 = path.join(updatesDir, clientDir, "libraries");
        if (!fs.existsSync(librariesDir2)) {
          librariesDir2 = path.join(resolvedWorkingDir, clientDir, "libraries");
        }
        if (!fs.existsSync(librariesDir2)) {
          librariesDir2 = path.join(updatesDir, version, "libraries");
        }
        if (!fs.existsSync(librariesDir2)) {
          librariesDir2 = path.join(resolvedWorkingDir, version, "libraries");
        }
        const jarFiles = findJarFiles(librariesDir2);
        if (jarFiles.length === 0) {
          console.warn(`[Launch] ⚠️  No JAR files found in ${librariesDir2}`);
        } else {
          console.log(`[Launch] Found ${jarFiles.length} JAR files in libraries directory`);
          const fastutilJar2 = jarFiles.find((j) => j.includes("fastutil"));
          const launchwrapperJar2 = jarFiles.find((j) => j.includes("launchwrapper"));
          const forgeJar2 = jarFiles.find((j) => j.includes("forge"));
          if (!fastutilJar2) {
            console.warn(`[Launch] ⚠️  WARNING: fastutil JAR not found in libraries!`);
          } else {
            console.log(`[Launch] ✓ Found fastutil: ${path.basename(fastutilJar2)}`);
          }
          if (!launchwrapperJar2) {
            console.warn(`[Launch] ⚠️  WARNING: launchwrapper JAR not found in libraries!`);
          } else {
            console.log(`[Launch] ✓ Found launchwrapper: ${path.basename(launchwrapperJar2)}`);
          }
          if (!forgeJar2) {
            console.warn(`[Launch] ⚠️  WARNING: forge JAR not found in libraries!`);
          } else {
            console.log(`[Launch] ✓ Found forge: ${path.basename(forgeJar2)}`);
          }
        }
        resolvedClassPath.push(...jarFiles);
        const nativeDirs = findNativeLibDirs(librariesDir2);
        if (nativeDirs.length > 0) {
          console.log(`Found ${nativeDirs.length} native library directories`);
        }
      } else {
        let resolved = path.isAbsolute(cp) ? cp : path.join(updatesDir, clientDir, cp);
        if (!fs.existsSync(resolved)) {
          resolved = path.join(resolvedWorkingDir, clientDir, cp);
        }
        if (!fs.existsSync(resolved)) {
          resolved = path.join(updatesDir, version, cp);
        }
        if (!fs.existsSync(resolved)) {
          resolved = path.join(resolvedWorkingDir, version, cp);
        }
        if (fs.existsSync(resolved)) {
          resolvedClassPath.push(resolved);
        } else {
          console.warn(`[Launch] ⚠️  ClassPath entry not found: ${resolved}`);
          console.warn(`[Launch]   Searched in:`);
          console.warn(`[Launch]     - ${path.join(updatesDir, clientDir, cp)}`);
          console.warn(`[Launch]     - ${path.join(resolvedWorkingDir, clientDir, cp)}`);
          console.warn(`[Launch]     - ${path.join(updatesDir, version, cp)}`);
          console.warn(`[Launch]     - ${path.join(resolvedWorkingDir, version, cp)}`);
        }
      }
    }
    if (!hasLibrariesEntry && fs.existsSync(librariesDir)) {
      console.log('[Launch] ⚠️  classPath does not contain "libraries" entry, but libraries directory exists.');
      console.log("[Launch] Adding all JAR files from libraries directory to ensure all dependencies are included...");
      const allJarFiles = findJarFiles(librariesDir);
      if (allJarFiles.length > 0) {
        console.log(`[Launch] Found ${allJarFiles.length} additional JAR files in libraries directory`);
        for (const jarFile of allJarFiles) {
          if (!resolvedClassPath.includes(jarFile)) {
            resolvedClassPath.push(jarFile);
          }
        }
      }
    }
    if (resolvedClassPath.length === 0) {
      return {
        success: false,
        error: "No valid classpath entries found. Please ensure Minecraft files are downloaded."
      };
    }
    console.log(`[Launch] Resolved classpath (${resolvedClassPath.length} entries):`);
    const clientJar = resolvedClassPath.find((cp) => cp.includes("client.jar"));
    const fastutilJar = resolvedClassPath.find((cp) => cp.includes("fastutil"));
    const launchwrapperJar = resolvedClassPath.find((cp) => cp.includes("launchwrapper"));
    const forgeJar = resolvedClassPath.find((cp) => cp.includes("forge"));
    console.log(`[Launch]   - client.jar: ${clientJar || "NOT FOUND"}`);
    console.log(`[Launch]   - fastutil: ${fastutilJar || "NOT FOUND"}`);
    console.log(`[Launch]   - launchwrapper: ${launchwrapperJar || "NOT FOUND"}`);
    console.log(`[Launch]   - forge: ${forgeJar || "NOT FOUND"}`);
    console.log(`[Launch] Total JAR files in classpath: ${resolvedClassPath.length}`);
    if (!fastutilJar) {
      console.error("[Launch] ❌ ERROR: fastutil library not found in classpath!");
      console.error("[Launch] This is required for Minecraft 1.12.2.");
      console.error("[Launch] Expected: libraries/it/unimi/dsi/fastutil/7.1.0/fastutil-7.1.0.jar");
      console.error("[Launch] Full classpath:");
      resolvedClassPath.forEach((cp, i) => {
        const exists = fs.existsSync(cp);
        console.error(`[Launch]   [${i + 1}] ${exists ? "✓" : "✗"} ${cp}`);
      });
      return {
        success: false,
        error: `FastUtil library not found in classpath. This is required for Minecraft 1.12.2.

Expected: libraries/it/unimi/dsi/fastutil/7.1.0/fastutil-7.1.0.jar

Please ensure all Minecraft libraries are downloaded. Check the libraries directory:
${path.join(updatesDir, clientDir, "libraries")}`
      };
    }
    console.log("[Launch] ✓ FastUtil library found in classpath");
    if (mainClass === "net.minecraft.launchwrapper.Launch") {
      if (!launchwrapperJar) {
        console.error("[Launch] ❌ ERROR: launchwrapper library not found in classpath!");
        console.error("[Launch] This is required for Forge 1.12.2.");
        console.error("[Launch] Expected: libraries/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar");
        console.error("[Launch] Full classpath:");
        resolvedClassPath.forEach((cp, i) => {
          const exists = fs.existsSync(cp);
          console.error(`[Launch]   [${i + 1}] ${exists ? "✓" : "✗"} ${cp}`);
        });
        return {
          success: false,
          error: `LaunchWrapper library not found in classpath. This is required for Forge 1.12.2.

Expected: libraries/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar

Please ensure all Minecraft libraries are downloaded. Check the libraries directory:
${path.join(updatesDir, clientDir, "libraries")}`
        };
      }
      console.log("[Launch] ✓ LaunchWrapper library found in classpath");
    }
    if (!fs.existsSync(resolvedWorkingDir)) {
      console.log(`Creating working directory: ${resolvedWorkingDir}`);
      fs.mkdirSync(resolvedWorkingDir, { recursive: true });
    }
    if (!fs.existsSync(librariesDir)) {
      librariesDir = path.join(updatesDir, version, "libraries");
    }
    let nativeLibDirs = [];
    if (fs.existsSync(librariesDir)) {
      try {
        const extractedNativesDir = await extractAllNatives(librariesDir, clientDir);
        nativeLibDirs = findNativeLibDirs(librariesDir);
      } catch (error) {
        console.warn(`Failed to extract native libraries:`, error.message);
        nativeLibDirs = findNativeLibDirs(librariesDir);
      }
    }
    console.log(`Searching for native libraries in: ${librariesDir}`);
    console.log(`Found ${nativeLibDirs.length} native library directories:`);
    nativeLibDirs.forEach((dir) => console.log(`  - ${dir}`));
    const fullArgs = [
      ...jvmArgs
    ];
    if (nativeLibDirs.length > 0) {
      const nativePath = nativeLibDirs.join(path.delimiter);
      fullArgs.push(`-Djava.library.path=${nativePath}`);
      console.log(`Added native library path: ${nativePath}`);
    } else {
      console.warn(`⚠️  No native libraries found! This may cause UnsatisfiedLinkError.`);
      console.warn(`   Please re-download Minecraft files: npm run download-minecraft ${version}`);
    }
    fullArgs.push(
      "-cp",
      resolvedClassPath.join(path.delimiter),
      mainClass,
      ...gameArgs
    );
    if (mainClass === "net.minecraft.launchwrapper.Launch") {
      console.log("[Launch] Forge LaunchWrapper - Full command:");
      console.log(`[Launch] Java: ${javaPath}`);
      console.log(`[Launch] Main Class: ${mainClass}`);
      console.log(`[Launch] ClassPath entries: ${resolvedClassPath.length}`);
      console.log(`[Launch] ClassPath (first 5): ${resolvedClassPath.slice(0, 5).join(", ")}`);
      const hasLaunchWrapper = resolvedClassPath.some(
        (cp) => cp.includes("launchwrapper") || cp.includes("LaunchWrapper")
      );
      console.log(`[Launch] Has launchwrapper in classpath: ${hasLaunchWrapper}`);
      if (!hasLaunchWrapper) {
        console.error("[Launch] ❌ ERROR: launchwrapper library not found in classpath!");
        console.error("[Launch] This is required for Forge 1.12.2. Please ensure libraries are downloaded.");
        console.error("[Launch] Expected path: libraries/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar");
        console.error("[Launch] Full classpath:", resolvedClassPath.join("\n"));
      }
      const hasForge = resolvedClassPath.some(
        (cp) => cp.includes("forge") || cp.includes("Forge")
      );
      console.log(`[Launch] Has Forge library in classpath: ${hasForge}`);
      console.log(`[Launch] Game Args: ${gameArgs.join(" ")}`);
      console.log(`[Launch] Has --tweakClass in gameArgs: ${gameArgs.includes("--tweakClass")}`);
    }
    const finalJavaCheck = getJavaVersion(javaPath);
    if (finalJavaCheck) {
      console.log(`[Launch] Final Java check - Path: ${javaPath}, Version: ${finalJavaCheck.major} (${finalJavaCheck.full})`);
    }
    console.log("Launching Minecraft with:", {
      javaPath,
      workingDir: resolvedWorkingDir,
      classPathCount: resolvedClassPath.length,
      mainClass,
      jvmArgsCount: jvmArgs.length,
      gameArgsCount: gameArgs.length,
      javaVersion: finalJavaCheck?.major || "unknown"
    });
    console.log("Full command:", `${javaPath} ${fullArgs.join(" ")}`);
    if (javaPath !== "java" && !fs.existsSync(javaPath)) {
      return {
        success: false,
        error: `Java executable not found: ${javaPath}. Please check the Java path in settings.`
      };
    }
    let javaVersionCheck = null;
    try {
      const requiredJavaVersion = jvmVersion || "8";
      javaVersionCheck = checkJavaVersion(javaPath, requiredJavaVersion);
      if (requiredJavaVersion === "8") {
        const versionInfo = getJavaVersion(javaPath);
        console.log(`[JavaCheck] Detected Java version: ${versionInfo?.major || "unknown"} (${versionInfo?.full || "unknown"})`);
        if (!versionInfo) {
          return {
            success: false,
            error: `Failed to detect Java version. Please ensure Java 8 is installed and the path is correct.`
          };
        }
        if (versionInfo.major !== 8) {
          return {
            success: false,
            error: `Java version mismatch. Minecraft 1.12.2 with Forge requires Java 8 exactly, but Java ${versionInfo.major} (${versionInfo.full}) is being used. Please install Java 8 or specify the correct path to Java 8 in settings.`
          };
        }
        console.log(`[JavaCheck] ✓ Java 8 confirmed: ${versionInfo.full}`);
      }
      if (!javaVersionCheck.valid) {
        return {
          success: false,
          error: javaVersionCheck.error || `Java version check failed. Required: Java ${requiredJavaVersion}+, found: ${javaVersionCheck.currentVersion || "unknown"}`
        };
      }
      console.log(`[JavaCheck] ✓ Java version check passed: ${javaVersionCheck.currentVersion} (required: ${requiredJavaVersion}${requiredJavaVersion === "8" ? " exactly" : "+"})`);
    } catch (error) {
      return {
        success: false,
        error: `Failed to verify Java: ${error.message}. Please install Java or specify the full path to Java in settings.`
      };
    }
    let processError = null;
    let processExited = false;
    let exitCode = null;
    const gameProcess = child_process.spawn(javaPath, fullArgs, {
      cwd: resolvedWorkingDir,
      stdio: "pipe",
      shell: false
    });
    gameProcess.on("error", (error) => {
      processError = error;
      console.error("Process spawn error:", error);
      mainWindow?.webContents.send("game:error", `Process error: ${error.message}`);
    });
    let stderrBuffer = "";
    let stdoutBuffer = "";
    const stdoutLines = [];
    const maxStdoutLines = 100;
    const connectionIssuePatterns = [
      /connection.*refused/i,
      /connection.*timeout/i,
      /connection.*timed.*out/i,
      /authentication.*failed/i,
      /server.*full/i,
      /version.*mismatch/i,
      /network.*error/i,
      /can't.*connect/i,
      /unable.*to.*connect/i,
      /failed.*to.*connect/i
    ];
    gameProcess.stderr?.on("data", (data) => {
      const message = data.toString();
      stderrBuffer += message;
      console.error("Game stderr:", message);
      mainWindow?.webContents.send("game:error", message);
      for (const pattern of connectionIssuePatterns) {
        if (pattern.test(message)) {
          mainWindow?.webContents.send("game:connection-issue", {
            message,
            type: detectConnectionIssueType(message)
          });
          break;
        }
      }
    });
    gameProcess.stdout?.on("data", (data) => {
      const message = data.toString();
      console.log("Game stdout:", message);
      mainWindow?.webContents.send("game:log", message);
      const lines = message.split("\n").filter((l) => l.trim());
      stdoutLines.push(...lines);
      if (stdoutLines.length > maxStdoutLines) {
        stdoutLines.splice(0, stdoutLines.length - maxStdoutLines);
      }
      stdoutBuffer = stdoutLines.join("\n");
      for (const pattern of connectionIssuePatterns) {
        if (pattern.test(message)) {
          mainWindow?.webContents.send("game:connection-issue", {
            message,
            type: detectConnectionIssueType(message)
          });
          break;
        }
      }
    });
    gameProcess.on("exit", (code, signal) => {
      processExited = true;
      exitCode = code;
      console.log(`Game process exited with code ${code}, signal ${signal}`);
      mainWindow?.webContents.send("game:exit", code !== null && code !== void 0 ? code : 0);
      if (code !== 0 && code !== null) {
        const errorMsg = stderrBuffer || `Game exited with code ${code}`;
        console.error("Game failed:", errorMsg);
        mainWindow?.webContents.send("game:error", errorMsg);
        mainWindow?.webContents.send("game:crash", {
          exitCode: code,
          errorMessage: errorMsg.substring(0, 5e3),
          // Limit length
          stderrOutput: stderrBuffer.substring(0, 1e4),
          // Limit length
          stdoutOutput: stdoutBuffer.substring(0, 1e4),
          // Limit length
          profileId,
          profileVersion: version,
          serverAddress,
          serverPort,
          javaVersion: javaVersionCheck?.currentVersion,
          javaPath,
          os: process.platform,
          osVersion: os.release(),
          userId,
          username
        });
      }
    });
    gameProcess.on("close", (code, signal) => {
      if (!processExited) {
        console.log(`Game process closed with code ${code}, signal ${signal}`);
        processExited = true;
        exitCode = code;
        mainWindow?.webContents.send("game:exit", code !== null && code !== void 0 ? code : 0);
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (processError) {
      return {
        success: false,
        error: `Failed to start Java process: ${processError.message}`
      };
    }
    if (processExited && exitCode !== 0) {
      return {
        success: false,
        error: `Game process exited immediately with code ${exitCode}. Check the error messages above.`
      };
    }
    if (!gameProcess.pid) {
      return {
        success: false,
        error: "Failed to start game process (no PID). Check Java installation and arguments."
      };
    }
    console.log(`Game process started successfully with PID: ${gameProcess.pid}`);
    return { success: true, pid: gameProcess.pid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("file:ensureDir", async (event, dirPath) => {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("file:writeFile", async (event, filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    await fsPromises.mkdir(dir, { recursive: true });
    await fsPromises.writeFile(filePath, Buffer.from(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("file:deleteFile", async (event, filePath) => {
  try {
    await fsPromises.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("file:calculateHash", async (event, filePath, algorithm) => {
  try {
    const content = await fsPromises.readFile(filePath);
    const hash = crypto.createHash(algorithm).update(content).digest("hex");
    return hash;
  } catch (error) {
    throw new Error(`Failed to calculate hash: ${error.message}`);
  }
});
electron.ipcMain.handle("file:readFile", async (event, filePath) => {
  try {
    const content = await fsPromises.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});
electron.ipcMain.handle("file:exists", async (event, filePath) => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
});
electron.ipcMain.handle("http:request", async (event, options) => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(options.url);
      const client = urlObj.protocol === "https:" ? https : http;
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || "GET",
        headers: {
          "User-Agent": "Modern-Launcher/1.0",
          "Accept": "application/json",
          ...options.headers
        },
        timeout: options.timeout || 3e4
      };
      let requestData;
      if (options.data && ["POST", "PUT", "PATCH"].includes(requestOptions.method)) {
        if (typeof options.data === "string") {
          requestData = options.data;
        } else {
          requestData = JSON.stringify(options.data);
          requestOptions.headers["Content-Type"] = "application/json";
        }
        requestOptions.headers["Content-Length"] = Buffer.byteLength(requestData);
      }
      console.log("[HTTP Request]", {
        method: requestOptions.method,
        url: options.url,
        hostname: requestOptions.hostname,
        port: requestOptions.port,
        path: requestOptions.path
      });
      const req = client.request(requestOptions, (res) => {
        let responseData = "";
        res.on("data", (chunk) => {
          responseData += chunk;
        });
        res.on("end", () => {
          console.log("[HTTP Response]", {
            url: options.url,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers
          });
          let parsedData = responseData;
          try {
            parsedData = JSON.parse(responseData);
          } catch {
          }
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            data: parsedData
          });
        });
      });
      req.on("error", (error) => {
        console.error("[HTTP Error]", {
          url: options.url,
          error: error.message,
          code: error.code
        });
        reject({
          message: error.message,
          code: error.code
        });
      });
      req.on("timeout", () => {
        req.destroy();
        reject({
          message: "Request timeout",
          code: "ETIMEDOUT"
        });
      });
      if (requestData) {
        req.write(requestData);
      }
      req.end();
    } catch (error) {
      console.error("[HTTP Request Error]", {
        url: options.url,
        error: error.message
      });
      reject({
        message: error.message,
        code: error.code
      });
    }
  });
});
electron.ipcMain.on("file:download", async (event, url, destPath, authToken) => {
  const downloadId = `${url}-${destPath}`;
  try {
    const dir = path.dirname(destPath);
    await fsPromises.mkdir(dir, { recursive: true });
    const client = url.startsWith("https:") ? https : http;
    const requestOptions = {};
    if (authToken) {
      requestOptions.headers = {
        "Authorization": `Bearer ${authToken}`
      };
    }
    const request = client.get(url, requestOptions, (response) => {
      if (response.statusCode !== 200) {
        activeDownloads.delete(downloadId);
        event.reply("file:download:error", `HTTP ${response.statusCode}`);
        return;
      }
      const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
      const writer = fs.createWriteStream(destPath, { highWaterMark: 64 * 1024 });
      let downloadedBytes = 0;
      activeDownloads.set(downloadId, { request, writer, destPath });
      let lastProgressUpdate = 0;
      const progressUpdateInterval = Math.max(totalBytes * 0.05, 1024 * 1024);
      response.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        if (downloadedBytes - lastProgressUpdate >= progressUpdateInterval || downloadedBytes === totalBytes) {
          const progress = totalBytes > 0 ? downloadedBytes / totalBytes * 100 : 0;
          event.reply("file:download:progress", progress);
          lastProgressUpdate = downloadedBytes;
        }
      });
      response.on("end", () => {
        writer.end();
      });
      response.on("error", (error) => {
        activeDownloads.delete(downloadId);
        writer.destroy();
        fs.unlink(destPath, () => {
        });
        event.reply("file:download:error", error.message);
      });
      response.pipe(writer);
      writer.on("error", (error) => {
        activeDownloads.delete(downloadId);
        response.destroy();
        fs.unlink(destPath, () => {
        });
        event.reply("file:download:error", error.message);
      });
      writer.on("finish", () => {
        activeDownloads.delete(downloadId);
        event.reply("file:download:complete");
      });
    });
    request.on("error", (error) => {
      activeDownloads.delete(downloadId);
      event.reply("file:download:error", error.message);
    });
  } catch (error) {
    activeDownloads.delete(downloadId);
    event.reply("file:download:error", error.message);
  }
});
electron.ipcMain.handle("app:version", async () => {
  try {
    const userDataPath = electron.app.getPath("userData");
    const versionConfigPath = path.join(userDataPath, "launcher-version.json");
    if (fs.existsSync(versionConfigPath)) {
      const configContent = await fsPromises.readFile(versionConfigPath, "utf-8");
      const config = JSON.parse(configContent);
      if (config.version) {
        console.log(`[LauncherUpdate] Using version from config file: ${config.version}`);
        return config.version;
      }
    }
  } catch (error) {
    console.warn("[LauncherUpdate] Failed to read version from config file:", error);
  }
  return electron.app.getVersion();
});
electron.ipcMain.handle("app:paths", () => {
  return {
    userData: electron.app.getPath("userData"),
    appData: electron.app.getPath("appData"),
    temp: electron.app.getPath("temp")
  };
});
electron.ipcMain.handle("app:updatesDir", () => {
  return findUpdatesDir();
});
electron.ipcMain.handle("java:findInstallations", async () => {
  try {
    const installations = findJavaInstallations();
    const results = installations.map((javaPath) => {
      const versionInfo = getJavaVersion(javaPath);
      return {
        path: javaPath,
        version: versionInfo?.version || "unknown",
        major: versionInfo?.major || 0,
        full: versionInfo?.full || ""
      };
    });
    return { success: true, installations: results };
  } catch (error) {
    return { success: false, error: error.message, installations: [] };
  }
});
electron.ipcMain.handle("java:checkVersion", async (event, javaPath, requiredVersion) => {
  try {
    const result = checkJavaVersion(javaPath, requiredVersion);
    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: error.message,
      requiredVersion
    };
  }
});
electron.ipcMain.handle("java:getVersion", async (event, javaPath) => {
  try {
    const versionInfo = getJavaVersion(javaPath);
    if (!versionInfo) {
      return { success: false, error: "Failed to get Java version" };
    }
    return { success: true, ...versionInfo };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("dialog:selectJavaFile", async () => {
  try {
    const isWindows = process.platform === "win32";
    const result = await electron.dialog.showOpenDialog(mainWindow, {
      title: "Select Java Executable",
      filters: [
        { name: "Java Executable", extensions: isWindows ? ["exe"] : [] },
        { name: "All Files", extensions: ["*"] }
      ],
      properties: ["openFile"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    const selectedPath = result.filePaths[0];
    const versionInfo = getJavaVersion(selectedPath);
    if (!versionInfo) {
      return {
        success: false,
        error: "Selected file is not a valid Java executable"
      };
    }
    return {
      success: true,
      path: selectedPath,
      version: versionInfo.version,
      major: versionInfo.major
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("notification:show", async (event, title, body, options) => {
  try {
    if (!electron.Notification.isSupported()) {
      console.warn("Desktop notifications are not supported on this system");
      return { success: false, error: "Notifications not supported" };
    }
    const notification = new electron.Notification({
      title,
      body,
      icon: options?.icon,
      silent: !options?.sound
    });
    notification.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
    notification.show();
    setTimeout(() => {
      notification.close();
    }, 5e3);
    return { success: true };
  } catch (error) {
    console.error("Error showing notification:", error);
    return { success: false, error: error.message };
  }
});
let updateDownloadProgress = 0;
let updateDownloadId = null;
electron.ipcMain.handle("launcher:checkUpdate", async (event, currentVersion, apiUrl, authToken) => {
  try {
    const url = `${apiUrl}/api/launcher/check-update?currentVersion=${encodeURIComponent(currentVersion)}`;
    console.log(`[LauncherUpdate] Checking for updates: ${url}`);
    console.log(`[LauncherUpdate] Current version: ${currentVersion}`);
    return new Promise((resolve) => {
      const client = url.startsWith("https:") ? https : http;
      const headers2 = {
        "User-Agent": "Modern-Launcher/1.0"
      };
      if (authToken) {
        headers2["Authorization"] = `Bearer ${authToken}`;
      }
      const req = client.get(url, {
        headers: headers2
      }, (res) => {
        let data = "";
        console.log(`[LauncherUpdate] Response status: ${res.statusCode}`);
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            console.log(`[LauncherUpdate] Response data: ${data.substring(0, 200)}...`);
            const response = JSON.parse(data);
            if (response.success && response.data) {
              if (response.data.hasUpdate) {
                console.log(`[LauncherUpdate] Update found! Version: ${response.data.latestVersion?.version}`);
                resolve({
                  success: true,
                  hasUpdate: true,
                  updateInfo: response.data.latestVersion,
                  isRequired: response.data.isRequired
                });
              } else {
                console.log("[LauncherUpdate] No updates available");
                resolve({
                  success: true,
                  hasUpdate: false
                });
              }
            } else {
              console.error("[LauncherUpdate] Invalid response:", response);
              resolve({
                success: false,
                error: "Invalid response from server"
              });
            }
          } catch (error) {
            console.error("[LauncherUpdate] Parse error:", error);
            resolve({
              success: false,
              error: `Failed to parse response: ${error.message}`
            });
          }
        });
      });
      req.on("error", (error) => {
        console.error("[LauncherUpdate] Network error:", error);
        resolve({
          success: false,
          error: `Network error: ${error.message}`
        });
      });
      req.setTimeout(1e4, () => {
        console.error("[LauncherUpdate] Request timeout");
        req.destroy();
        resolve({
          success: false,
          error: "Request timeout"
        });
      });
    });
  } catch (error) {
    console.error("[LauncherUpdate] Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
});
electron.ipcMain.on("launcher:downloadUpdate", async (event, updateInfo, apiUrl) => {
  try {
    const downloadUrl = updateInfo.downloadUrl;
    if (!downloadUrl) {
      event.reply("launcher:update:error", "Download URL is not provided");
      return;
    }
    const isWindows = process.platform === "win32";
    const tempDir = electron.app.getPath("temp");
    const fileName = isWindows ? `launcher-update-${updateInfo.version}.exe` : `launcher-update-${updateInfo.version}.${process.platform === "darwin" ? "dmg" : "AppImage"}`;
    const destPath = path.join(tempDir, fileName);
    const downloadId = `${downloadUrl}-${Date.now()}`;
    updateDownloadId = downloadId;
    updateDownloadProgress = 0;
    await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
    const downloadWithRedirects = (url, maxRedirects = 5) => {
      if (maxRedirects <= 0) {
        event.reply("launcher:update:error", "Too many redirects");
        return;
      }
      const urlClient = url.startsWith("https:") ? https : http;
      const request = urlClient.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const location = response.headers.location;
          if (!location) {
            event.reply("launcher:update:error", `HTTP ${response.statusCode}: No redirect location`);
            return;
          }
          const redirectUrl = location.startsWith("http") ? location : new URL(location, url).href;
          console.log(`[LauncherUpdate] Following redirect to: ${redirectUrl}`);
          downloadWithRedirects(redirectUrl, maxRedirects - 1);
          return;
        }
        if (response.statusCode !== 200) {
          event.reply("launcher:update:error", `HTTP ${response.statusCode}`);
          return;
        }
        const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
        const writer = fs.createWriteStream(destPath);
        let downloadedBytes = 0;
        response.on("data", (chunk) => {
          if (updateDownloadId !== downloadId) {
            response.destroy();
            writer.destroy();
            return;
          }
          downloadedBytes += chunk.length;
          updateDownloadProgress = totalBytes > 0 ? downloadedBytes / totalBytes * 100 : 0;
          event.reply("launcher:update:progress", updateDownloadProgress);
        });
        response.on("end", async () => {
          if (updateDownloadId !== downloadId) {
            try {
              await fsPromises.unlink(destPath);
            } catch {
            }
            return;
          }
          writer.end();
          if (updateInfo.fileHash) {
            try {
              const fileContent = await fsPromises.readFile(destPath);
              const hash = crypto.createHash("sha256").update(fileContent).digest("hex");
              if (hash.toLowerCase() !== updateInfo.fileHash.toLowerCase()) {
                await fsPromises.unlink(destPath);
                event.reply("launcher:update:error", "File hash verification failed. File may be corrupted.");
                return;
              }
            } catch (error) {
              await fsPromises.unlink(destPath);
              event.reply("launcher:update:error", `Hash verification error: ${error.message}`);
              return;
            }
          }
          event.reply("launcher:update:complete", destPath);
        });
        response.on("error", async (error) => {
          writer.destroy();
          try {
            await fsPromises.unlink(destPath);
          } catch {
          }
          event.reply("launcher:update:error", error.message);
        });
        response.pipe(writer);
        writer.on("error", async (error) => {
          response.destroy();
          try {
            await fsPromises.unlink(destPath);
          } catch {
          }
          event.reply("launcher:update:error", error.message);
        });
      });
      request.on("error", (error) => {
        event.reply("launcher:update:error", error.message);
      });
      request.setTimeout(3e5, () => {
        request.destroy();
        event.reply("launcher:update:error", "Download timeout");
      });
    };
    downloadWithRedirects(downloadUrl);
  } catch (error) {
    event.reply("launcher:update:error", error.message);
  }
});
electron.ipcMain.on("launcher:cancelUpdate", () => {
  updateDownloadId = null;
  updateDownloadProgress = 0;
});
electron.ipcMain.handle("launcher:installUpdate", async (event, installerPath, newVersion) => {
  try {
    if (!fs.existsSync(installerPath)) {
      return {
        success: false,
        error: "Installer file not found"
      };
    }
    const userDataPath = electron.app.getPath("userData");
    const versionConfigPath = path.join(userDataPath, "launcher-version.json");
    try {
      await fsPromises.writeFile(versionConfigPath, JSON.stringify({ version: newVersion, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }), "utf-8");
      console.log(`[LauncherUpdate] Saved version ${newVersion} to config file`);
    } catch (error) {
      console.warn("[LauncherUpdate] Failed to save version to config file:", error);
    }
    const isWindows = process.platform === "win32";
    const isMac = process.platform === "darwin";
    const currentExe = process.execPath;
    if (isWindows) {
      child_process.exec(`"${installerPath}" /S /D="${path.dirname(currentExe)}"`, (error) => {
        if (error) {
          console.error("Error running installer:", error);
        } else {
          setTimeout(() => {
            electron.app.quit();
          }, 1e3);
        }
      });
      return { success: true };
    } else if (isMac) {
      child_process.exec(`open "${installerPath}"`, (error) => {
        if (error) {
          console.error("Error opening DMG:", error);
        }
      });
      return { success: true, message: "Please follow the installation instructions" };
    } else {
      await fsPromises.chmod(installerPath, 493);
      child_process.exec(`"${installerPath}"`, (error) => {
        if (error) {
          console.error("Error running installer:", error);
        } else {
          setTimeout(() => {
            electron.app.quit();
          }, 1e3);
        }
      });
      return { success: true };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
electron.ipcMain.on("launcher:restart", () => {
  electron.app.relaunch();
  electron.app.exit(0);
});
