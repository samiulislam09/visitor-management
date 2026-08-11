import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Option {
  value: string;
  label: string;
}

export function FilterSelect({
  placeholder,
  value,
  onValueChange,
  options,
  className,
  allowClear = true,
}: {
  placeholder: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: Option[];
  className?: string;
  allowClear?: boolean;
}) {
  return (
    <Select value={value ?? (allowClear ? "all" : undefined)} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start">
        {allowClear && (
          <SelectItem value="all">All {placeholder.split(" ")[0].toLowerCase()}</SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}