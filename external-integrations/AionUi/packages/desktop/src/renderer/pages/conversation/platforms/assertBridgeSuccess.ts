// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

type BridgeResult<T = unknown> =
  | {
      success: boolean;
      data?: T;
      msg?: string;
    }
  | null
  | undefined;

export const assertBridgeSuccess = <T>(
  result: BridgeResult<T>,
  fallbackMessage: string
): {
  success: true;
  data?: T;
} => {
  if (result?.success === true) {
    return result as {
      success: true;
      data?: T;
    };
  }

  throw new Error(result?.msg || fallbackMessage);
};
