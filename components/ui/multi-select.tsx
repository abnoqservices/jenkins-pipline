// components/ui/multi-select.tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const multiSelectVariants = cva(
  "flex gap-1.5 flex-wrap items-center",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
      },
      size: {
        default: "min-h-10 px-3 py-2",
        sm: "min-h-9 px-2 py-1.5 text-sm",
        lg: "min-h-12 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface MultiSelectProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiSelectVariants> {
  options: { label: string; value: string }[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDisplayed?: number;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      className,
      variant,
      size,
      options,
      value = [],
      onValueChange,
      placeholder = "Select options...",
      disabled = false,
      maxDisplayed = 3,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];

      onValueChange?.(newValue);
    };

    const handleRemove = (optionValue: string) => {
      const newValue = value.filter((v) => v !== optionValue);
      onValueChange?.(newValue);
    };

    const selectedOptions = options.filter((opt) => value.includes(opt.value));

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Popover open={open} onOpenChange={setOpen} modal>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between text-left font-normal",
                !value.length && "text-muted-foreground",
                multiSelectVariants({ variant, size }),
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              <div className="flex flex-1 flex-wrap gap-1.5 overflow-hidden">
                {selectedOptions.length === 0 && placeholder}

                {selectedOptions.slice(0, maxDisplayed).map((opt) => (
                  <Badge
                    key={opt.value}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
                  >
                    {opt.label}
                    {!disabled && (
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(opt.value);
                        }}
                      />
                    )}
                  </Badge>
                ))}

                {selectedOptions.length > maxDisplayed && (
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                    +{selectedOptions.length - maxDisplayed}
                  </Badge>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => handleSelect(option.value)}
                        className={cn(
                          "cursor-pointer",
                          isSelected && "bg-accent"
                        )}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </div>
                        {option.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };