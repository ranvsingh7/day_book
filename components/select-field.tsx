"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  searchable = false,
  searchPlaceholder = "Search...",
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = searchable
    ? options.filter((option) => {
        const query = searchQuery.toLowerCase();
        return (
          option.label.toLowerCase().includes(query) ||
          option.value.toLowerCase().includes(query)
        );
      })
    : options;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const openAndHighlightCurrent = () => {
    setIsOpen(true);
    const selectedIndex = filteredOptions.findIndex(
      (option) => option.value === value && !option.disabled
    );
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const handleArrowNavigation = (direction: 1 | -1) => {
    if (!filteredOptions.length) {
      return;
    }

    if (!isOpen) {
      openAndHighlightCurrent();
      return;
    }

    const nextIndex = Math.min(
      Math.max((highlightedIndex < 0 ? 0 : highlightedIndex) + direction, 0),
      filteredOptions.length - 1
    );
    setHighlightedIndex(nextIndex);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      handleArrowNavigation(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      handleArrowNavigation(-1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (!isOpen) {
        openAndHighlightCurrent();
        return;
      }

      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const target = filteredOptions[highlightedIndex];
        if (!target.disabled) {
          handleSelect(target.value);
        }
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) {
      return;
    }

    const target = optionRefs.current[highlightedIndex];
    target?.scrollIntoView({ block: "nearest" });
  }, [isOpen, highlightedIndex, filteredOptions, value]);

  return (
    <div className="relative grid gap-1">
      <span className="text-sm font-medium text-slate-600">{label}</span>

      <input
        value={value}
        onChange={() => undefined}
        required={required}
        tabIndex={-1}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setHighlightedIndex(-1);
              setSearchQuery("");
            } else {
              openAndHighlightCurrent();
            }
          }}
          onKeyDown={handleKeyDown}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className={selectedOption ? "text-slate-900" : "text-slate-400"}>
            {selectedOption?.label || placeholder || "Select an option"}
          </span>
          <svg
            className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {searchable ? (
              <div className="border-b border-slate-200 p-2">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                />
              </div>
            ) : null}

            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-center text-sm text-slate-500">No options found</div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        handleSelect(option.value);
                      }
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition ${
                      option.value === value || filteredOptions[highlightedIndex]?.value === option.value
                        ? "bg-indigo-50 font-semibold text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    } ${option.disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{option.label}</span>
                      {option.value === value ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      {isOpen ? <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} /> : null}
    </div>
  );
}
