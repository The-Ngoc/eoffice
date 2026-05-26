import axios from 'axios';
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { DocumentFile ,DocumentFlowHistoryItem } from '../models/Document';

import {
  ApiResponse,
  ClericalDocument,
  ClericalDocumentDto,
  ClericalDocumentStatus,
  CreateDocumentPayload,
  mapClericalDocumentDto,
} from '../models/clerical';

// Fetch list of all clerical documents and map backend DTO to UI model.
export const getAllDocuments = async (): Promise<ApiResponse<ClericalDocument[]>> => {
  const response = await axiosClient.get(ENDPOINTS.DOCUMENTS.ALL);
  const payload = response.data as ApiResponse<ClericalDocumentDto[]>;

  return {
    ...payload,
    data: (payload.data ?? []).map(mapClericalDocumentDto),
  };
};

// Fetch one document by id for detail panel.
export const getDocumentById = async (id: string): Promise<ApiResponse<ClericalDocument>> => {
  const response = await axiosClient.get(`${ENDPOINTS.DOCUMENTS.DOCUMENT}/${id}`);
  const payload = response.data as ApiResponse<ClericalDocumentDto>;

  return {
    ...payload,
    data: mapClericalDocumentDto(payload.data),
  };
};

// Create a new document and return mapped document data.
export const createDocument = async (
  data: CreateDocumentPayload,
  files: File[] = [],
): Promise<ApiResponse<ClericalDocument>> => {
  try {
    const response =
      files.length > 0
        ? await axiosClient.post(
            ENDPOINTS.DOCUMENTS.ADD,
            (() => {
              const formData = new FormData();

              Object.entries(data).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                  return;
                }

                formData.append(key, String(value));
              });

              files.forEach((file) => {
                formData.append('files', file);
              });

              console.log('📤 FormData entries:', {
                fields: Object.entries(data),
                filesCount: files.length,
                fileNames: files.map((f) => `${f.name} (${f.size} bytes)`),
              });

              return formData;
            })(),
          )
        : await axiosClient.post(ENDPOINTS.DOCUMENTS.ADD, data);

    const payload = response.data as ApiResponse<ClericalDocumentDto>;

    return {
      ...payload,
      data: mapClericalDocumentDto(payload.data),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('❌ Error:', error);
    }
    throw error;
  }
};


export const submitDocumentToLeader = async (id: string): Promise<ApiResponse<ClericalDocument>> => {
  const response = await axiosClient.post(ENDPOINTS.DOCUMENTS.SUBMIT_TO_LEADER, { id });
  const payload = response.data as ApiResponse<ClericalDocumentDto>;

  return {
    ...payload,
    data: mapClericalDocumentDto(payload.data),
  };
};

// Update processing status for a clerical document.
export const updateStatus = async (
  id: string,
  status: ClericalDocumentStatus,
): Promise<ApiResponse<ClericalDocument>> => {
  const response = await axiosClient.put(ENDPOINTS.DOCUMENTS.UPDATE_STATUS, { id, status });
  const payload = response.data as ApiResponse<ClericalDocumentDto>;

  return {
    ...payload,
    data: mapClericalDocumentDto(payload.data),
  };
};

// Delete one document by id.
export const deleteDocument = async (id: string): Promise<ApiResponse<null>> => {
  const response = await axiosClient.post(ENDPOINTS.DOCUMENTS.DELETE, { id });
  return response.data as ApiResponse<null>;
};

// Fetch document files by document id
export const getDocumentFiles = async (id: string): Promise<DocumentFile[]> => {
  const response = await axiosClient.get(`${ENDPOINTS.DOCUMENTS.FILES}/${id}`);
  return response.data as DocumentFile[];
};

// Fetch flow history by document id
export const getDocumentFlowHistory = async (id: string): Promise<ApiResponse<DocumentFlowHistoryItem[]>> => {
  const response = await axiosClient.get(
    ENDPOINTS.DOCUMENTS.FLOW_HISTORY.replace(':documentId', encodeURIComponent(id)),
  );
  return response.data as ApiResponse<DocumentFlowHistoryItem[]>;
};
