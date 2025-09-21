import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({ options, value, onChange, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onChange(inputValue);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [comboboxRef, inputValue, onChange]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes((inputValue || '').toLowerCase()) && option.toLowerCase() !== (inputValue || '').toLowerCase()
  );

  const showCreateOption = inputValue && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase());

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setInputValue(selectedValue);
    setIsOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      if(!isOpen) {
          setIsOpen(true);
      }
  }

  return (
    <div className={`relative ${className || ''}`} ref={comboboxRef}>
      <div className="relative">
          <input
            type="text"
            value={inputValue || ''}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(inputValue);
              } else if (e.key === 'Escape') {
                  setIsOpen(false);
                  setInputValue(value); 
              }
            }}
            placeholder={placeholder}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
            aria-label="Toggle dropdown"
          >
            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
      </div>

      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {showCreateOption && (
             <li
              onClick={() => handleSelect(inputValue)}
              className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 cursor-pointer font-medium"
            >
              新增: "{inputValue}"
            </li>
          )}
          {filteredOptions.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer"
            >
              {option}
            </li>
          ))}
          {filteredOptions.length === 0 && !showCreateOption && (
             <li className="px-4 py-2 text-sm text-gray-500">无匹配项</li>
          )}
        </ul>
      )}
    </div>
  );
};