import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Input.module.scss';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  dropdownOptions?: string[];
  onDropdownValueSelect?: (value: string) => void;
  wrapperClassName?: string;
}

const getFilteredDropdownOptions = (options: string[], searchValue: string): string[] => {
  const unique = options.filter(
    (option, index, array) => array.findIndex((value) => value.toLowerCase() === option.toLowerCase()) === index
  );

  const normalizedSearch = searchValue.trimStart().toLowerCase();
  if (!normalizedSearch) return unique;

  return unique.filter((option) => option.toLowerCase().startsWith(normalizedSearch));
};

export const Input: React.FC<InputProps> = ({
  dropdownOptions = [],
  onDropdownValueSelect,
  wrapperClassName,
  className,
  value,
  onChange,
  onKeyDown,
  disabled,
  ...props
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const hasDropdown = dropdownOptions.length > 0;
  const currentValue = typeof value === 'string' ? value : '';

  const visibleOptions = useMemo(
    () => getFilteredDropdownOptions(dropdownOptions, currentValue),
    [dropdownOptions, currentValue]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!hasDropdown) {
      setIsDropdownOpen(false);
    }
  }, [hasDropdown]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (hasDropdown && !disabled && event.key === 'ArrowDown') {
      event.preventDefault();
      setIsDropdownOpen(true);
    }

    if (hasDropdown && event.key === 'Escape') {
      setIsDropdownOpen(false);
    }

    onKeyDown?.(event);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (hasDropdown && !disabled) {
      const nextValue = event.target.value;
      const hasMatchingHistory = getFilteredDropdownOptions(dropdownOptions, nextValue).length > 0;

      // Auto-complete historique: ouvre la liste uniquement s'il existe des correspondances par préfixe.
      setIsDropdownOpen(nextValue.trim().length > 0 && hasMatchingHistory);
    }

    onChange?.(event);
  };

  const selectOption = (option: string) => {
    onDropdownValueSelect?.(option);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const wrapperClasses = [
    styles.inputWrapper,
    hasDropdown ? styles.withDropdown : '',
    wrapperClassName || '',
  ].join(' ').trim();

  const inputClasses = [styles.xpInput, className || ''].join(' ').trim();

  return (
    <div ref={wrapperRef} className={wrapperClasses}>
      <input
        ref={inputRef}
        className={inputClasses}
        value={value}
        disabled={disabled}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        {...props}
      />

      {hasDropdown && (
        <button
          type="button"
          className={styles.dropdownButton}
          disabled={disabled}
          aria-label="Afficher l'historique"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsDropdownOpen((previous) => !previous)}
        />
      )}

      {hasDropdown && isDropdownOpen && visibleOptions.length > 0 && (
        <div className={styles.dropdownMenu}>
          {visibleOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.dropdownOption}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
