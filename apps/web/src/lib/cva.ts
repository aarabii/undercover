import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type VariantConfig = Record<string, Record<string, ClassValue>>;

export type VariantProps<T extends (...args: any) => any> = Parameters<T>[0];

export function cva<T extends VariantConfig>(
  base?: ClassValue,
  config?: {
    variants?: T;
    defaultVariants?: { [K in keyof T]?: keyof T[K] };
    compoundVariants?: Array<{ [K in keyof T]?: keyof T[K] } & { className: ClassValue }>;
  }
) {
  return (props?: { [K in keyof T]?: keyof T[K] | null | undefined } & { className?: ClassValue }): string => {
    const resolvedClasses: ClassValue[] = [base];

    if (config?.variants) {
      for (const [variantKey, variantOptions] of Object.entries(config.variants)) {
        const selectedOption =
          props && props[variantKey] !== undefined ? props[variantKey] : config.defaultVariants?.[variantKey];

        if (selectedOption && variantOptions[selectedOption as string]) {
          resolvedClasses.push(variantOptions[selectedOption as string]);
        }
      }
    }

    if (config?.compoundVariants && props) {
      for (const compound of config.compoundVariants) {
        const { className, ...matchVariants } = compound;
        const matches = Object.entries(matchVariants).every(([key, val]) => {
          const selected = props[key] !== undefined ? props[key] : config.defaultVariants?.[key];
          return selected === val;
        });
        if (matches) {
          resolvedClasses.push(className);
        }
      }
    }

    if (props?.className) {
      resolvedClasses.push(props.className);
    }

    return twMerge(clsx(resolvedClasses));
  };
}
