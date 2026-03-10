import { useState, useCallback } from 'react';

export function useCloneCountValidation(initialValue = '1') {
  const [cloneCount, setCloneCount] = useState(initialValue);
  const [cloneCountError, setCloneCountError] = useState<string | undefined>();

  const handleCloneCountChange = useCallback((value: string) => {
    // Allow empty string
    if (value === '') {
      setCloneCount('');
      setCloneCountError(undefined);
      return;
    }

    // Allow only digits
    if (!/^\d+$/.test(value)) {
      setCloneCountError('Please enter a number');
      return;
    }

    const num = parseInt(value, 10);
    if (num < 1 || num > 10) {
      setCloneCountError('Clone count must be between 1 and 10');
    } else {
      setCloneCountError(undefined);
    }

    setCloneCount(value);
  }, []);

  const parsedCount = parseInt(cloneCount, 10);
  const isValid = !isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 10;

  return {
    cloneCount,
    cloneCountError,
    handleCloneCountChange,
    parsedCount: isValid ? parsedCount : null,
    isValid,
  };
}
