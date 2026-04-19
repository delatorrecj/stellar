import React, { useState, useEffect } from 'react';
import { StrKey } from '@stellar/stellar-sdk';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddressInputProps {
  label?: string;
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  placeholder?: string;
  helperText?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'G...',
  helperText,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!value) {
      setError(null);
      setIsValid(false);
      return;
    }

    try {
      const isStrKey = StrKey.isValidEd25519PublicKey(value);
      const isCorrectLength = value.length === 56;
      
      if (isStrKey && isCorrectLength) {
        setError(null);
        setIsValid(true);
      } else {
        if (value.length > 0 && value.length < 56) {
          setError(`Address too short (${value.length}/56)`);
        } else {
          setError('Invalid Stellar address format');
        }
        setIsValid(false);
      }
    } catch {
      setError('Invalid format');
      setIsValid(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value.trim();
    // Immediate validation logic to update parent
    const valid = StrKey.isValidEd25519PublicKey(newVal);
    onChange(newVal, valid);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`
            w-full h-12 px-4 rounded-md border text-sm font-mono transition-all outline-none
            ${error ? 'border-error ring-1 ring-error/20' : 'border-neutral-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-400/10'}
            ${isValid ? 'pr-10 border-success/50' : ''}
          `}
        />
        {isValid && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
        )}
        {error && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-error" />
        )}
      </div>
      {error && <span className="text-xs text-error font-medium">{error}</span>}
      {!error && helperText && <span className="text-xs text-neutral-400">{helperText}</span>}
    </div>
  );
};
