import { describe, expect, it } from "vitest";
import {
  createImportFileName,
  createImportedFileUrl,
  getImportedFileNameFromPath,
  getImportMediaKind,
  isSupportedImportFileName
} from "./importFile";

describe("import file helpers", () => {
  it("supports common local media files", () => {
    expect(isSupportedImportFileName("backing track.wav")).toBe(true);
    expect(isSupportedImportFileName("song.mp3")).toBe(true);
    expect(isSupportedImportFileName("stems.flac")).toBe(true);
    expect(isSupportedImportFileName("camera audio.m4a")).toBe(true);
    expect(isSupportedImportFileName("reference.mp4")).toBe(true);
  });

  it("rejects unsafe or unsupported files", () => {
    expect(isSupportedImportFileName("../secret.wav")).toBe(false);
    expect(isSupportedImportFileName("script.lua")).toBe(false);
    expect(isSupportedImportFileName("")).toBe(false);
  });

  it("creates a safe imports filename while keeping the extension", () => {
    expect(createImportFileName("ERRA / Backing Track #1.wav", 12345)).toBe("12345-erra-backing-track-1.wav");
  });

  it("can add a copy suffix for duplicate imports in the same millisecond", () => {
    expect(createImportFileName("Backing Track.wav", 12345, 2)).toBe("12345-backing-track-3.wav");
  });

  it("classifies imported media for in-app preview", () => {
    expect(getImportMediaKind("backing.wav")).toBe("audio");
    expect(getImportMediaKind("camera.mp4")).toBe("video");
    expect(getImportMediaKind("notes.txt")).toBe("unknown");
  });

  it("creates a safe local preview URL for imported files", () => {
    expect(createImportedFileUrl("177991-demo backing.wav")).toBe("/api/imported-file/177991-demo%20backing.wav");
    expect(createImportedFileUrl("../demo.wav")).toBe("");
  });

  it("finds an imported file name from an imports folder path", () => {
    expect(getImportedFileNameFromPath("C:\\Project\\imports\\demo backing.wav")).toBe("demo backing.wav");
    expect(getImportedFileNameFromPath("imports/demo backing.wav")).toBe("demo backing.wav");
    expect(getImportedFileNameFromPath("C:\\Audio\\demo backing.wav")).toBe("");
  });
});
