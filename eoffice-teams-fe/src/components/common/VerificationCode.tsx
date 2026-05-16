import React, { useState } from 'react';

interface VerificationCodeProps {
  expectedCode?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const VerificationCode: React.FC<VerificationCodeProps> = ({ expectedCode = '123456', onSuccess, onCancel }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleVerify = () => {
    setError(null);
    if (code.trim() === expectedCode) {
      onSuccess();
    } else {
      setError('Mã xác thực không đúng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[12px] font-semibold">Nhập mã xác thực</label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="6 chữ số"
          className="px-3 py-2 border border-teams-border rounded text-sm outline-none w-40"
        />
        <button onClick={handleVerify} className="btn-primary px-3 py-2 text-sm">
          Xác thực
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-3 py-2 text-sm text-text-secondary hover:underline">
            Hủy
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default VerificationCode;
