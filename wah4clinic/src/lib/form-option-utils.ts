interface Option {
  code: string;
  display: string;
}

function ensureSelectedOption(
  options: Option[],
  selectedCode: string,
  selectedDisplay?: string,
): Option[] {
  if (!selectedCode) {
    return options;
  }

  if (options.some((option) => option.code === selectedCode)) {
    return options;
  }

  return [
    ...options,
    {
      code: selectedCode,
      display: selectedDisplay || selectedCode,
    },
  ];
}

export { ensureSelectedOption };

