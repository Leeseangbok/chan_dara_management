import React from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string;
  onChangeValue: (val: number) => void;
  step?: number;
}

export function CurrencyInput({ value, onChangeValue, step = 100, className, ...props }: CurrencyInputProps) {
  const numericValue = typeof value === 'string' ? (parseInt(value, 10) || 0) : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    onChangeValue(raw ? parseInt(raw, 10) : 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onChangeValue(numericValue + step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChangeValue(Math.max(0, numericValue - step));
    }
  };

  const displayValue = numericValue === 0 && typeof value === 'string' && value === "" 
    ? "" 
    : numericValue.toLocaleString("en-US");

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={className}
      {...props}
    />
  );
}
