export type RawDisplayFile = {
  id?: string | number;
  name?: string;
  file_name?: string;
  file_url?: string;
  nameFile?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DisplayFile = {
  id: string;
  name: string;
  url?: string;
  createdAt?: string;
};

export const toDisplayFile = (file: RawDisplayFile | string, index = 0): DisplayFile => {
  if (typeof file === 'string') {
    return {
      id: `${file}-${index}`,
      name: file,
    };
  }

  const name = file.file_name || file.nameFile || file.name || 'Tệp không tên';
  const url = file.file_url || file.url;

  return {
    id: String(file.id ?? url ?? `${name}-${index}`),
    name,
    url,
    createdAt: file.createdAt || file.updatedAt,
  };
};

export const toDisplayFiles = (files?: Array<RawDisplayFile | string> | null): DisplayFile[] => {
  return (files ?? []).map((file, index) => toDisplayFile(file, index));
};
