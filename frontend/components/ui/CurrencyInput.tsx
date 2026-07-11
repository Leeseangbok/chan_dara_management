import React, { useState, useEffect } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string;
  onChangeValue: (val: any) => void;
  step?: number | string;
}

export function CurrencyInput({ value, onChangeValue, step = "any", className, ...props }: CurrencyInputProps) {
  const rawValue = value === null || value === undefined ? "" : value.toString();

  const formatValue = (val: string) => {
    if (!val) return "";
    const cleaned = val.replace(/[^\d.-]/g, '');
    const parts = cleaned.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    if (cleaned === "-") return "-";
    if (cleaned === "-.") return "-.";
    if (cleaned === ".") return ".";

    return formattedInteger + decimalPart;
  };

  const [displayValue, setDisplayValue] = useState(formatValue(rawValue));

  useEffect(() => {
    const cleanedDisplay = displayValue.replace(/[^\d.-]/g, '');
    const cleanedValue = rawValue.replace(/[^\d.-]/g, '');
    if (cleanedDisplay !== cleanedValue || rawValue === "") {
        setDisplayValue(formatValue(rawValue));
    }
  }, [rawValue, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    let cleaned = inputValue.replace(/[^\d.-]/g, "");
    
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    setDisplayValue(formatValue(inputValue));
    onChangeValue(cleaned);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
