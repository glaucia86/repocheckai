/**
 * Clipboard utilities for RepoCheckAI
 * 
 * Provides cross-platform clipboard functionality using native OS commands.
 * 
 * @module utils/clipboard
 */

import { spawn, execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { IClipboardResult, IClipboardService } from "../domain/types/interfaces.js";

// ════════════════════════════════════════════════════════════════════════════
// PLATFORM DETECTION
// ════════════════════════════════════════════════════════════════════════════

const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";
const isLinux = process.platform === "linux";

// ════════════════════════════════════════════════════════════════════════════
// CLIPBOARD SERVICE IMPLEMENTATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Cross-platform clipboard service using native OS commands
 */
class ClipboardService implements IClipboardService {
  /**
   * Check if clipboard is available on this platform
   */
  isAvailable(): boolean {
    if (isWindows || isMac) {
      return true;
    }

    if (isLinux) {
      // Check for xclip or xsel
      try {
        execSync("which xclip", { stdio: "ignore" });
        return true;
      } catch {
        try {
          execSync("which xsel", { stdio: "ignore" });
          return true;
        } catch {
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Copy text to clipboard
   */
  async copy(text: string): Promise<IClipboardResult> {
    try {
      if (isWindows) {
        return await this.copyWindows(text);
      }

      if (isMac) {
        return await this.copyMac(text);
      }

      if (isLinux) {
        return await this.copyLinux(text);
      }

      return {
        success: false,
        error: `Unsupported platform: ${process.platform}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Copy to clipboard on Windows using PowerShell
   */
  private async copyWindows(text: string): Promise<IClipboardResult> {
    return new Promise((resolve) => {
      // Write to temp file to handle Unicode properly
      const tempFile = path.join(
        os.tmpdir(),
        `repocheckai-clipboard-${Date.now()}.txt`
      );

      try {
        fs.writeFileSync(tempFile, text, "utf8");

        // Use PowerShell to read UTF-8 file and set clipboard
        const psCommand = `Get-Content -Path "${tempFile}" -Encoding UTF8 -Raw | Set-Clipboard`;
        execSync(`powershell -NoProfile -Command "${psCommand}"`, {
          windowsHide: true,
        });

        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }

        resolve({ success: true });
      } catch (error) {
        // Clean up temp file on error
        try {
          fs.unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }

        resolve({
          success: false,
          error: error instanceof Error ? error.message : "PowerShell clipboard failed",
        });
      }
    });
  }

  /**
   * Copy to clipboard on macOS using pbcopy
   */
  private async copyMac(text: string): Promise<IClipboardResult> {
    return new Promise((resolve) => {
      const proc = spawn("pbcopy", [], {
        stdio: ["pipe", "ignore", "ignore"],
      });

      proc.stdin.write(text);
      proc.stdin.end();

      proc.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: `pbcopy exited with code ${code}`,
          });
        }
      });

      proc.on("error", (error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }

  /**
   * Copy to clipboard on Linux using xclip or xsel
   */
  private async copyLinux(text: string): Promise<IClipboardResult> {
    // Try xclip first
    const xclipResult = await this.tryCommand("xclip", ["-selection", "clipboard"], text);
    if (xclipResult.success) {
      return xclipResult;
    }

    // Fallback to xsel
    return await this.tryCommand("xsel", ["--clipboard", "--input"], text);
  }

  /**
   * Helper to try a clipboard command
   */
  private async tryCommand(command: string, args: string[], text: string): Promise<IClipboardResult> {
    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        stdio: ["pipe", "ignore", "ignore"],
      });

      proc.stdin.write(text);
      proc.stdin.end();

      proc.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: `${command} exited with code ${code}`,
          });
        }
      });

      proc.on("error", (error) => {
        resolve({
          success: false,
          error: `${command} not available: ${error.message}`,
        });
      });
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Default clipboard service instance
 */
export const clipboard = new ClipboardService();

/**
 * Convenience function to copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<IClipboardResult> {
  return clipboard.copy(text);
}

/**
 * Check if clipboard is available
 */
export function isClipboardAvailable(): boolean {
  return clipboard.isAvailable();
}

