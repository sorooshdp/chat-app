import { describe, it, expect } from "vitest";
import {
  getPasswordStrength,
  getStrengthText,
  getStrengthColor,
} from "@/lib/utils/password";

describe("getPasswordStrength", () => {
  it("returns 0 for an empty password", () => {
    expect(getPasswordStrength("")).toBe(0);
  });

  it("scores one point per satisfied rule", () => {
    // length only
    expect(getPasswordStrength("abcdefgh")).toBe(1);
    // length + uppercase
    expect(getPasswordStrength("abcdefghI")).toBe(2);
    // length + uppercase + digit
    expect(getPasswordStrength("abcdefghI1")).toBe(3);
    // all four
    expect(getPasswordStrength("abcdefghI1!")).toBe(4);
  });

  it("does not award the length point below 8 characters", () => {
    expect(getPasswordStrength("Ab1!")).toBe(3);
    expect(getPasswordStrength("Ab1!")).not.toBe(4);
  });

  it("never exceeds 4", () => {
    expect(getPasswordStrength("AbcdefghI123!@#")).toBe(4);
  });
});

describe("getStrengthText", () => {
  it.each([
    ["", "Very Weak"],
    ["abcdefgh", "Weak"],
    ["abcdefghI", "Fair"],
    ["abcdefghI1", "Strong"],
    ["abcdefghI1!", "Very Strong"],
  ])("maps %j to %s", (pass, expected) => {
    expect(getStrengthText(pass)).toBe(expected);
  });
});

describe("getStrengthColor", () => {
  it.each([
    ["", "bg-slate-700"],
    ["abcdefgh", "bg-red-500"],
    ["abcdefghI", "bg-yellow-500"],
    ["abcdefghI1", "bg-blue-500"],
    ["abcdefghI1!", "bg-green-500"],
  ])("maps %j to %s", (pass, expected) => {
    expect(getStrengthColor(pass)).toBe(expected);
  });
});
