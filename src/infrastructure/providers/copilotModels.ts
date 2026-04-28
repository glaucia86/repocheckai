import { CopilotClient, type ModelInfo as CopilotSdkModelInfo } from "@github/copilot-sdk";

export interface CopilotRuntimeModelChoice {
  id: string;
  name: string;
  billingMultiplier?: number;
}

const DEFAULT_LIST_MODELS_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

function mapRuntimeModel(model: CopilotSdkModelInfo): CopilotRuntimeModelChoice {
  return {
    id: model.id,
    name: model.name,
    billingMultiplier: model.billing?.multiplier,
  };
}

export async function listCopilotSdkModels(
  timeoutMs: number = DEFAULT_LIST_MODELS_TIMEOUT_MS
): Promise<CopilotRuntimeModelChoice[] | null> {
  const client = new CopilotClient();

  try {
    await withTimeout(client.start(), timeoutMs, "Copilot client startup");
    const models = await withTimeout(client.listModels(), timeoutMs, "Copilot model listing");
    return models.map(mapRuntimeModel);
  } catch {
    return null;
  } finally {
    try {
      await withTimeout(client.stop(), timeoutMs, "Copilot client shutdown");
    } catch {
      // Best-effort cleanup only.
    }
  }
}
