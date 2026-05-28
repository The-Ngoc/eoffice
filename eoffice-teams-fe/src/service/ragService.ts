import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';

export interface RagSource {
  source: string;
  type: string | undefined;
  score: number | undefined;
}

export interface RagChatResponse {
  answer: string;
  sources: RagSource[];
}

const normalizeSources = (sources: unknown): RagSource[] => {
  if (!Array.isArray(sources)) {
    return [];
  }

  return sources
    .map((source) => {
      if (!source || typeof source !== 'object') {
        return null;
      }

      const candidate = source as Record<string, unknown>;
      const sourceLabel = candidate.source ?? candidate.fileName ?? candidate.documentId;

      if (!sourceLabel) {
        return null;
      }

      return {
        source: String(sourceLabel),
        type: typeof candidate.type === 'string' ? candidate.type : undefined,
        score: typeof candidate.score === 'number' ? candidate.score : undefined,
      };
    })
    .filter((source): source is RagSource => Boolean(source));
};

export const chatWithRag = async (question: string): Promise<RagChatResponse> => {
  const response = await axiosClient.post(ENDPOINTS.RAG.CHAT, { question });
  const payload = response.data?.data ?? response.data ?? {};
  const answer = typeof payload.answer === 'string'
    ? payload.answer
    : typeof payload.messages === 'string'
      ? payload.messages
      : '';

  return {
    answer,
    sources: normalizeSources(payload.sources),
  };
};